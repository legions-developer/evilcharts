"use client";

import {
  resolveTooltipPosition,
  roundnessClass,
  tooltipIndicatorHtml,
  tooltipRow,
  tooltipVariantClass,
  type TooltipPosition,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/registry/ui/echarts-tooltip";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FC,
  type ReactNode,
} from "react";
import {
  buildChartCss,
  getColorsCount,
  resolveColors,
  withAlpha,
  type ChartConfig,
  type ResolvedColors,
} from "@/registry/ui/echarts-chart";
import { TooltipComponent, type TooltipComponentOption } from "echarts/components";
import { LegendOverlay, type LegendVariant } from "@/registry/ui/echarts-legend";
import { PieChart, type PieSeriesOption } from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

// Re-export the shared types that were previously declared inline here, so
// existing consumers/examples keep importing them from the chart module.
export type { ChartConfig, LegendVariant, TooltipPosition, TooltipRoundness, TooltipVariant };

// Modular registration keeps the bundle lean — only the pieces this chart needs.
// A pie has no coordinate system, so there is no GridComponent and no axes; the
// tooltip is item-triggered. Never register GraphicComponent: the loading shimmer
// and selection dim are per-sector itemStyle updates, not graphic overlays.
echarts.use([PieChart, TooltipComponent, CanvasRenderer]);

type EChartsInstance = ReturnType<typeof echarts.init>;

// The exact option surface this chart uses — a pie series plus the tooltip
// component. Narrower than echarts' full EChartsOption, so a misspelled key fails
// the compile instead of silently reaching setOption.
type EChartsOption = ComposeOption<PieSeriesOption | TooltipComponentOption>;

// Sector paint — structurally assignable to a pie datum's itemStyle. `color`
// accepts the same solid-or-gradient value sectorPaint returns, and the optional
// border fields carry the constant-width gap / overlap separator.
type PieItemStyle = {
  color: string | echarts.graphic.LinearGradient;
  opacity: number;
  borderRadius: number;
  borderColor?: string;
  borderWidth?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const REVEAL_DURATION = 1000; // intro draw-in length, in milliseconds (ECharts' default)
// NOTE: the intro is ECharts' RAW default pie entrance (`animationType: "expansion"`
// — sectors sweep out from the start angle). We only gate whether it plays; we do
// not customize its easing, matching the area chart's "raw default" policy.
const LOADING_ANIMATION_DURATION = 2000; // shimmer loop, in milliseconds
const LOADING_SECTORS = 5; // skeleton sector count — Recharts twin uses 5 equal sectors

const DEFAULT_INNER_RADIUS: number | string = 0;
const DEFAULT_OUTER_RADIUS: number | string = "80%";
const DEFAULT_CORNER_RADIUS = 0;
const DEFAULT_PADDING_ANGLE = 0;
const DEFAULT_START_ANGLE = 0;
const DEFAULT_END_ANGLE = 360;

const FALLBACK_COLOR = "rgba(120, 120, 120, 1)";

// Overlapping sectors (negative paddingAngle) get a background-colored border to
// separate the petals — the canvas analogue of the Recharts twin's
// `stroke="var(--background)" strokeWidth={5}`.
const OVERLAP_BORDER_WIDTH = 5;

// Selecting a sector pops it radially OUTWARD from the center — the offset-slice
// look from the official ECharts pie-pattern example. This is the pixel distance
// the chosen sector translates along its own bisector; deselecting returns it.
const SELECTED_OFFSET = 12;

// The selected sector stays fully opaque; the others recede to this dimmed
// opacity. Tuned to ~half the former 0.3 so the selected sector reads with more
// contrast against the dimmed ones — the analogue of the area chart's dim-fill
// halving (its dimmed fill went 0.2 → 0.1 while the selected state stays full).
const DIMMED_OPACITY = 0.15;

// Positive gaps between sectors are drawn as a CONSTANT-WIDTH background-colored
// border (px), NOT an angular padAngle. An angular pad tapers to a wedge toward
// the center; a border keeps every gap parallel-edged all the way from the rim to
// the center. The px width tracks the requested `paddingAngle` for familiar sizing.
function gapBorderWidth(paddingAngle: number): number {
  return Math.max(paddingAngle, 0);
}

// Resolves each sector's separator border. Negative paddingAngle keeps the
// overlapping-petal look (a real angular overlap plus a wide separator); positive
// paddingAngle becomes a constant-width gap; zero draws no border at all.
function sectorBorder(
  paddingAngle: number,
  background: string,
): { borderColor: string; borderWidth: number } | null {
  if (paddingAngle < 0) return { borderColor: background, borderWidth: OVERLAP_BORDER_WIDTH };
  const width = gapBorderWidth(paddingAngle);
  if (width > 0) return { borderColor: background, borderWidth: width };
  return null;
}

// Loading shimmer opacities (× the foreground token's own alpha). A sine-feathered
// window sweeps around the ring, brightening each sector from base → peak as it
// passes — the angular twin of the area chart's swept clip window, and a match for
// the Recharts twin's staggered sector pulse.
const LOADING_BASE_OPACITY = 0.15; // resting sector fill, × foreground alpha
const LOADING_PEAK_OPACITY = 0.5; // fill inside the sweep window, × foreground alpha
const LOADING_SHIMMER_BAND = 0.28; // window half-width, fraction of the ring (0..1)
const LOADING_SHIMMER_FEATHER = 0.22; // sine-eased edge softening of the window

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

// The pie has a single fill style — a per-sector color gradient. Kept as a named
// union for API parity with the Recharts twin (and room to grow).
export type PieVariant = "gradient";
// Where sector labels sit: "inside" draws value text on the sector (the default),
// "outside" moves the sector's name past the rim with a leader line, matching the
// classic ECharts pie (echarts.apache.org/examples/en/editor.html?c=pie-simple).
export type LabelPosition = "inside" | "outside";
// TooltipVariant, TooltipRoundness, TooltipPosition, LegendVariant, and ChartConfig
// now live in the shared @/registry/ui/echarts/* modules and are imported +
// re-exported at the top of this file.
export type BackgroundVariant =
  | "dots"
  | "grid"
  | "cross-hatch"
  | "diagonal-lines"
  | "plus"
  | "falling-triangles"
  | "4-pointed-star"
  | "tiny-checkers"
  | "overlapping-circles"
  | "wiggle-lines"
  | "bubbles";

export interface EChartsPieChartProps<TData extends Record<string, unknown>> {
  data: TData[]; // rows rendered by the chart — one sector each
  config: ChartConfig; // sector colors + labels, keyed by the sector name
  dataKey: keyof TData & string; // key holding each sector's numeric value
  nameKey: keyof TData & string; // key holding each sector's name
  className?: string; // extra classes for the chart container
  // Master switch for the intro draw-in. Not present on the Recharts twin (which
  // hardcodes its animation); added here as the canvas off-switch, mirroring the
  // ECharts area chart's `animation` prop. OS reduce-motion also disables it.
  animation?: boolean;
  defaultSelectedSector?: string | null; // sector selected on first render
  onSelectionChange?: (selection: { dataKey: string; value: number } | null) => void; // fires when the selected sector changes
  isLoading?: boolean; // shows the animated loading skeleton
  chartOptions?: Record<string, unknown>; // escape hatch merged over the built ECharts option
  children?: ReactNode; // declarative config — <Pie>, <Tooltip>, <Legend>, <Background>
}

// ─────────────────────────────────────────────────────────────────────────────
// Composible parts — DECLARATIVE CONFIG. Every part renders `null`; the root
// walks `children` by reference (child.type === Pie, …) to collect its props.
// Presence semantics mirror the Recharts twin: omit a child and that part does
// not render. These are never mounted into the tree — they only carry props.
// ─────────────────────────────────────────────────────────────────────────────

export interface PieProps {
  variant?: PieVariant; // fill style for the pie's sectors
  innerRadius?: number | string; // inner radius — set above 0 for a donut
  outerRadius?: number | string; // outer radius of the pie
  cornerRadius?: number; // border-radius of each sector in pixels
  paddingAngle?: number; // gap between sectors in degrees — negative overlaps them
  startAngle?: number; // angle the pie starts drawing from
  endAngle?: number; // angle the pie stops drawing at
  isClickable?: boolean; // lets sectors be selected by clicking them — the selected sector pops outward
  children?: ReactNode; // optional <Label> composition for sector labels
}

/**
 * The pie series. Declares its own shape (radii, angles, corner rounding,
 * padding) and clickability. Renders nothing — the root reads these props to
 * build the ECharts pie. When clickable, the selected sector pops radially
 * outward. Compose a <Label> inside it to draw labels on each sector.
 */
export const Pie: FC<PieProps> = () => null;

export interface LabelProps {
  dataKey?: string; // data key for the label text — defaults to the pie's value key
  position?: LabelPosition; // "inside" (value on the sector) or "outside" (name past the rim, with a leader line)
}

/** Declares per-sector labels for the enclosing <Pie>. Renders nothing. */
export const Label: FC<LabelProps> = () => null;

export interface TooltipProps {
  variant?: TooltipVariant; // visual style of the tooltip surface
  roundness?: TooltipRoundness; // border-radius of the tooltip
  defaultIndex?: number; // sector index shown by default with no hover
  position?: TooltipPosition; // "variable" follows the pointer (default); "fixed" pins the tooltip near the top and tracks the pointer's X
}

/** Presence enables the hover tooltip. Renders nothing. */
export const Tooltip: FC<TooltipProps> = () => null;

export interface LegendProps {
  variant?: LegendVariant; // visual style of the legend indicators
  align?: "left" | "center" | "right"; // horizontal placement
  verticalAlign?: "top" | "middle" | "bottom"; // vertical placement
  isClickable?: boolean; // lets each entry toggle selection of its sector
}

/** Presence enables the HTML legend overlay. Renders nothing. */
export const Legend: FC<LegendProps> = () => null;

export interface BackgroundProps {
  variant?: BackgroundVariant; // background pattern style
}

/** Presence draws a decorative SVG pattern behind the pie. Renders nothing. */
export const Background: FC<BackgroundProps> = () => null;

// ─────────────────────────────────────────────────────────────────────────────
// Children collection — walk the declarative config into plain objects the
// option builder consumes. <Label> is read from the <Pie>'s own children; a
// missing <Label> means sector labels do not render.
// ─────────────────────────────────────────────────────────────────────────────

type PieSlot = {
  variant: PieVariant;
  innerRadius: number | string;
  outerRadius: number | string;
  cornerRadius: number;
  paddingAngle: number;
  startAngle: number;
  endAngle: number;
  isClickable: boolean;
  labelDataKey: string | null; // null when no <Label> child is present
  labelPosition: LabelPosition; // where the <Label> sits — only meaningful when labelDataKey !== null
};

type TooltipSlot = {
  present: boolean;
  variant: TooltipVariant;
  roundness: TooltipRoundness;
  defaultIndex?: number;
  position: TooltipPosition;
};
type LegendSlot = {
  present: boolean;
  variant: LegendVariant;
  align: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  isClickable: boolean;
};
type BackgroundSlot = { present: boolean; variant: BackgroundVariant };

type CollectedConfig = {
  pie: PieSlot | null;
  tooltip: TooltipSlot;
  legend: LegendSlot;
  background: BackgroundSlot;
};

function collectConfig(children: ReactNode): CollectedConfig {
  let pie: PieSlot | null = null;
  let tooltip: TooltipSlot = {
    present: false,
    variant: "default",
    roundness: "lg",
    position: "variable",
  };
  // Pie legend defaults differ from the area chart's: centered along the bottom.
  let legend: LegendSlot = {
    present: false,
    variant: "rounded-square",
    align: "center",
    verticalAlign: "bottom",
    isClickable: false,
  };
  let background: BackgroundSlot = { present: false, variant: "dots" };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const type = child.type;

    if (type === Pie) {
      const props = child.props as PieProps;
      // A <Label> child (if any) declares per-sector labels.
      let labelDataKey: string | null = null;
      let labelPosition: LabelPosition = "inside";
      Children.forEach(props.children, (labelChild) => {
        if (!isValidElement(labelChild) || labelChild.type !== Label) return;
        const labelProps = labelChild.props as LabelProps;
        labelDataKey = labelProps.dataKey ?? "";
        labelPosition = labelProps.position ?? "inside";
      });
      pie = {
        variant: props.variant ?? "gradient",
        innerRadius: props.innerRadius ?? DEFAULT_INNER_RADIUS,
        outerRadius: props.outerRadius ?? DEFAULT_OUTER_RADIUS,
        cornerRadius: props.cornerRadius ?? DEFAULT_CORNER_RADIUS,
        paddingAngle: props.paddingAngle ?? DEFAULT_PADDING_ANGLE,
        startAngle: props.startAngle ?? DEFAULT_START_ANGLE,
        endAngle: props.endAngle ?? DEFAULT_END_ANGLE,
        isClickable: props.isClickable ?? false,
        labelDataKey,
        labelPosition,
      };
    } else if (type === Tooltip) {
      const props = child.props as TooltipProps;
      tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
        defaultIndex: props.defaultIndex,
        position: props.position ?? "variable",
      };
    } else if (type === Legend) {
      const props = child.props as LegendProps;
      legend = {
        present: true,
        variant: props.variant ?? "rounded-square",
        align: props.align ?? "center",
        verticalAlign: props.verticalAlign ?? "bottom",
        isClickable: props.isClickable ?? false,
      };
    } else if (type === Background) {
      const props = child.props as BackgroundProps;
      background = { present: true, variant: props.variant ?? "dots" };
    }
  });

  return { pie, tooltip, legend, background };
}

// Color plumbing (ChartConfig, getColorsCount, buildChartCss, withAlpha,
// ResolvedColors, resolveColors) now lives in @/registry/ui/echarts-chart and is
// imported at the top of this file. The pie keeps its own DIAGONAL sectorPaint
// below (the shared seriesPaint is a horizontal gradient).

// ─────────────────────────────────────────────────────────────────────────────
// Sector fill
// ─────────────────────────────────────────────────────────────────────────────

// Per-sector fill: a solid color for a single-color config, else a diagonal
// top-left → bottom-right gradient across the sector's own bounding box. This
// mirrors the Recharts twin's `RadialColorGradient` (a `linearGradient` with
// x1/y1 = 0 and x2/y2 = 1). ECharts gradients are bbox-relative by default —
// exactly what a per-sector gradient wants — so no `global` override is needed.
function sectorPaint(slots: string[]): string | echarts.graphic.LinearGradient {
  if (slots.length <= 1) return slots[0] ?? FALLBACK_COLOR;
  const stops = slots.map((color, i) => ({ offset: i / (slots.length - 1), color }));
  return new echarts.graphic.LinearGradient(0, 0, 1, 1, stops);
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton helpers
// ─────────────────────────────────────────────────────────────────────────────

// Per-sector shimmer alpha: a sine-feathered window centered on `center` (both
// values are ring fractions in [0, 1)). Sectors inside the window read at
// `LOADING_PEAK_OPACITY`, outside at `LOADING_BASE_OPACITY`, with a sine falloff
// across the feather so the sweep edge isn't a hard cut. Distance wraps around
// the ring — the highlight travels continuously, like the Recharts twin's pulse.
function loadingSectorAlpha(pos: number, center: number): number {
  const raw = Math.abs(pos - center);
  const dist = Math.min(raw, 1 - raw); // shortest way around the ring
  const half = LOADING_SHIMMER_BAND;
  const feather = LOADING_SHIMMER_FEATHER;

  if (dist >= half) return LOADING_BASE_OPACITY;
  if (dist <= half - feather) return LOADING_PEAK_OPACITY;
  // Sine-eased ramp — a linear one still reads as a hard cut.
  const t = 1 - (dist - (half - feather)) / feather;
  const eased = Math.sin((t * Math.PI) / 2);
  return LOADING_BASE_OPACITY + (LOADING_PEAK_OPACITY - LOADING_BASE_OPACITY) * eased;
}

// Tooltip styling (roundnessClass, tooltipVariantClass, tooltipRow,
// tooltipIndicatorHtml) and the legend overlay (LegendOverlay + its indicators)
// now live in @/registry/ui/echarts/{tooltip,legend} and are imported at the top
// of this file.

// ─────────────────────────────────────────────────────────────────────────────
// Background overlay (SVG) — the Recharts twin renders its decorative pattern in
// SVG, so we render the SAME SVG patterns as a layer BEHIND the transparent
// ECharts canvas. Copied verbatim from the repo's <ChartBackground> so this file
// depends on nothing outside `react`, `echarts`, and `motion`. The Tailwind
// `text-border` classes resolve in the DOM; the blur-masked rect fades the edges.
// ─────────────────────────────────────────────────────────────────────────────

type PatternProps = { id: string };

const BACKGROUND_PATTERNS: Record<BackgroundVariant, FC<PatternProps>> = {
  dots: ({ id }) => (
    <pattern id={id} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle className="text-border" cx="2" cy="2" r="1" fill="currentColor" />
    </pattern>
  ),
  grid: ({ id }) => (
    <pattern id={id} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <path
        className="text-border"
        d="M 20 0 L 0 0 0 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </pattern>
  ),
  "cross-hatch": ({ id }) => (
    <pattern id={id} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <path
        className="text-border/60 dark:text-border/50"
        d="M 0 0 L 20 20 M 20 0 L 0 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </pattern>
  ),
  "diagonal-lines": ({ id }) => (
    <pattern
      id={id}
      x="0"
      y="0"
      width="6"
      height="6"
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(45)"
    >
      <line
        className="text-border"
        x1="0"
        y1="0"
        x2="0"
        y2="6"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </pattern>
  ),
  plus: ({ id }) => (
    <pattern id={id} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
      <path
        className="text-border"
        d="M 8 4 L 8 12 M 4 8 L 12 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinecap="round"
      />
    </pattern>
  ),
  "falling-triangles": ({ id }) => (
    <pattern id={id} x="0" y="0" width="18" height="36" patternUnits="userSpaceOnUse">
      <path
        className="text-border"
        d="M2 6h12L8 18 2 6zm18 36h12l-6 12-6-12z"
        transform="scale(0.5)"
        fill="currentColor"
        fillOpacity="0.4"
      />
    </pattern>
  ),
  "4-pointed-star": ({ id }) => (
    <pattern id={id} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
      <polygon
        className="text-border"
        fillRule="evenodd"
        points="5 3 8 4 5 5 4 8 3 5 0 4 3 3 4 0 5 3"
        fill="currentColor"
        fillOpacity="0.4"
      />
    </pattern>
  ),
  "tiny-checkers": ({ id }) => (
    <pattern id={id} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
      <path
        className="text-border"
        fillRule="evenodd"
        d="M0 0h4v4H0V0zm4 4h4v4H4V4z"
        fill="currentColor"
        fillOpacity="0.2"
      />
    </pattern>
  ),
  "overlapping-circles": ({ id }) => (
    <pattern id={id} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <path
        className="text-border"
        fillRule="evenodd"
        d="M25 25c0-2.762 2.238-5 5-5s5 2.238 5 5-2.238 5-5 5c0 2.762-2.238 5-5 5s-5-2.238-5-5 2.238-5 5-5zM5 5c0-2.762 2.238-5 5-5s5 2.238 5 5-2.238 5-5 5c0 2.762-2.238 5-5 5S0 12.762 0 10s2.238-5 5-5zm5 4c2.209 0 4-1.791 4-4s-1.791-4-4-4-4 1.791-4 4 1.791 4 4 4zm20 20c2.209 0 4-1.791 4-4s-1.791-4-4-4-4 1.791-4 4 1.791 4 4 4z"
        fill="currentColor"
        fillOpacity="0.4"
      />
    </pattern>
  ),
  "wiggle-lines": ({ id }) => (
    <pattern
      id={id}
      x="0"
      y="0"
      width="52"
      height="26"
      patternUnits="userSpaceOnUse"
      patternTransform="scale(0.6)"
    >
      <path
        className="text-border"
        d="M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z"
        fill="currentColor"
        fillOpacity="0.4"
      />
    </pattern>
  ),
  bubbles: ({ id }) => (
    <pattern
      id={id}
      x="0"
      y="0"
      width="100"
      height="100"
      patternUnits="userSpaceOnUse"
      patternTransform="scale(0.6667)"
    >
      <path
        className="text-border"
        d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z"
        fill="currentColor"
        fillOpacity="0.4"
        fillRule="evenodd"
      />
    </pattern>
  ),
};

function BackgroundLayer({ variant }: { variant: BackgroundVariant }) {
  const baseId = useId().replace(/:/g, "");
  const patternId = `${baseId}-bg-${variant}`;
  const maskId = `${baseId}-bg-edge-fade`;
  const filterId = `${baseId}-bg-blur`;
  const PatternComponent = BACKGROUND_PATTERNS[variant];

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
      preserveAspectRatio="none"
    >
      <defs>
        <PatternComponent id={patternId} />
        {/* Gaussian blur for a soft edge fade — a slightly inset white rect blurred
            into a mask leaves smooth transparent edges. */}
        <filter id={filterId}>
          <feGaussianBlur stdDeviation="25" />
        </filter>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect x="8%" y="20%" width="85%" height="60%" fill="white" filter={`url(#${filterId})`} />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} mask={`url(#${maskId})`} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Option builders — pure functions from a snapshot context to ECharts option
// fragments. The component reads its refs ONCE per build into this context;
// nothing below touches React state or the chart instance.
// ─────────────────────────────────────────────────────────────────────────────

type OptionBuildContext = {
  data: Record<string, unknown>[];
  config: ChartConfig;
  nameKey: string;
  dataKey: string;
  pie: PieSlot | null;
  selectedSector: string | null;
  tooltipSlot: TooltipSlot;
  legendSlot: LegendSlot;
  isLoading: boolean;
  resolved: ResolvedColors;
};

// The pie's vertical centre reserves room for the HTML legend overlay: a legend
// along the bottom nudges the pie up, one along the top nudges it down. Kept as a
// percentage so it tracks the container size (the legend is fixed-height text).
function pieCenterY(legendSlot: LegendSlot): string {
  if (!legendSlot.present) return "50%";
  if (legendSlot.verticalAlign === "bottom") return "45%";
  if (legendSlot.verticalAlign === "top") return "55%";
  return "50%";
}

// Tooltip HTML builder, closed over the build context. The pie tooltip is
// item-triggered, so each hover surfaces exactly one sector — its indicator,
// label, and value, matching ChartTooltipContent with `hideLabel` (no header).
function createTooltipFormatter(ctx: OptionBuildContext) {
  const { config, selectedSector, tooltipSlot } = ctx;

  return (params: unknown): string => {
    const p = (Array.isArray(params) ? params[0] : params) as {
      name?: string;
      value?: number | string;
      seriesId?: string;
    } | null;
    // The loading skeleton is a `__`-prefixed series and never surfaces a tooltip.
    if (!p || String(p.seriesId ?? "").startsWith("__")) return "";

    const name = String(p.name ?? "");
    const item = config[name];
    const colorsCount = item ? getColorsCount(item) : 1;
    const labelText = typeof item?.label === "string" ? item.label : name;
    const value = typeof p.value === "number" ? p.value.toLocaleString() : String(p.value ?? "");
    const dimmed = selectedSector != null && selectedSector !== name ? " opacity-30" : "";

    // The row shape matches the area chart's indicator + label + value, so it
    // reuses the shared tooltipRow/tooltipIndicatorHtml. The pie tooltip is
    // item-triggered with NO header (hideLabel), so it keeps its own no-header
    // shell — built from the shared roundnessClass/tooltipVariantClass — rather
    // than the header-carrying tooltipShell.
    const row = tooltipRow({
      indicatorHtml: tooltipIndicatorHtml(name, colorsCount),
      labelText,
      valueText: value,
      dimmed,
    });

    return `<div class="grid min-w-32 items-start gap-1.5 border border-border/50 px-2.5 py-1.5 text-xs shadow-xl ${roundnessClass[tooltipSlot.roundness]} ${tooltipVariantClass[tooltipSlot.variant]}">
      <div class="grid gap-1.5">${row}</div>
    </div>`;
  };
}

function buildTooltipOption(ctx: OptionBuildContext): TooltipComponentOption {
  const { tooltipSlot, isLoading } = ctx;
  // The pie tooltip is item-triggered (no axis, no cursor line), so it can't use
  // the shared tooltipBaseOption (which is trigger:"axis" with an axisPointer).
  // It keeps its own item-tooltip fields and wires the position prop directly
  // through the shared resolveTooltipPosition — "variable" → undefined (default
  // follow-the-pointer behavior), "fixed" → pinned near the top, tracking X.
  return {
    show: tooltipSlot.present && !isLoading,
    trigger: "item",
    confine: true,
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    extraCssText: "box-shadow:none;",
    position: resolveTooltipPosition(tooltipSlot.position),
    formatter: createTooltipFormatter(ctx),
  };
}

// The pie series. Each row becomes a sector whose fill is its own color gradient,
// dimmed when another sector is selected, and separated from its neighbors by a
// constant-width background border (see sectorBorder). The selected sector pops
// radially outward via ECharts' native select state (selectedOffset).
function buildPieSeries(ctx: OptionBuildContext): PieSeriesOption[] {
  const { data, config, nameKey, dataKey, pie, selectedSector, legendSlot, resolved } = ctx;
  if (!pie) return [];
  const { tokens } = resolved;
  const hasSelection = selectedSector !== null;
  // Selection (dim + pop-out) is only meaningful on a clickable pie.
  const border = sectorBorder(pie.paddingAngle, tokens.background);

  const sectors = data.map((row) => {
    const name = String(row[nameKey]);
    const slots = resolved.series[name] ?? [FALLBACK_COLOR];
    // Only a clickable pie dims — a static one never has a selection to dim from.
    const isSelected = pie.isClickable && selectedSector === name;
    const isDimmed = pie.isClickable && hasSelection && selectedSector !== name;

    const itemStyle: PieItemStyle = {
      color: sectorPaint(slots),
      opacity: isDimmed ? DIMMED_OPACITY : 1,
      borderRadius: pie.cornerRadius,
    };
    // Constant-width background gap (positive paddingAngle) or overlap separator
    // (negative). Parallel-edged from rim to center — no wedge-shaped taper.
    if (border) {
      itemStyle.borderColor = border.borderColor;
      itemStyle.borderWidth = border.borderWidth;
    }

    // The `selected` flag drives the native offset — React selection is the single
    // source of truth, re-applied on every notMerge push so it survives rebuilds.
    return { name, value: Number(row[dataKey]) || 0, itemStyle, selected: isSelected };
  });

  const showLabel = pie.labelDataKey !== null;
  const isOutside = pie.labelPosition === "outside";
  // An explicit <Label dataKey> always wins. Otherwise inside labels show the
  // sector's value (Recharts parity) and outside labels show the sector's name/
  // config label — matching the classic ECharts pie-simple outer labels.
  const explicitKey = pie.labelDataKey ? pie.labelDataKey : null;
  const labelFormatter = (labelParams: { dataIndex: number; name?: string; value?: unknown }) => {
    if (explicitKey) return String(data[labelParams.dataIndex]?.[explicitKey] ?? "");
    if (isOutside) {
      const item = config[String(labelParams.name ?? "")];
      return typeof item?.label === "string" ? item.label : String(labelParams.name ?? "");
    }
    return String(data[labelParams.dataIndex]?.[dataKey] ?? labelParams.value ?? "");
  };

  const label = {
    show: showLabel,
    // Inner value labels sit on the colored sector (background-colored text);
    // outer name labels sit past the rim in muted-foreground with a leader.
    position: (isOutside ? "outside" : "inner") as "outside" | "inner",
    color: isOutside ? tokens.mutedForeground : tokens.background,
    fontSize: 12,
    fontWeight: 500,
    formatter: labelFormatter,
  };

  return [
    {
      id: "pie",
      type: "pie",
      center: ["50%", pieCenterY(legendSlot)],
      radius: [pie.innerRadius, pie.outerRadius],
      startAngle: pie.startAngle,
      endAngle: pie.endAngle,
      // Recharts sweeps counterclockwise from 3 o'clock; ECharts angles share that
      // orientation, so `clockwise: false` reproduces the twin's sector order.
      clockwise: false,
      // Only a NEGATIVE paddingAngle reaches padAngle (petal overlap). Positive
      // gaps are drawn as constant-width borders instead — an angular pad would
      // taper to a wedge toward the center.
      padAngle: Math.min(pie.paddingAngle, 0),
      cursor: pie.isClickable ? "pointer" : "default",
      // No hover scale on ANY variant — hovering only surfaces the tooltip. The
      // pop-out below is the sole selection affordance, never a hover effect.
      emphasis: { scale: false },
      // Native select state: the chosen sector translates SELECTED_OFFSET px along
      // its bisector, away from the center (the offset-slice pie-pattern look).
      // Driven by each datum's `selected` flag; deselecting returns it.
      selectedMode: pie.isClickable ? "single" : false,
      selectedOffset: SELECTED_OFFSET,
      // Neutralize any default select styling — the selected sector keeps its
      // normal paint (inherited via state merge) and only its position moves.
      select: { itemStyle: {} },
      label,
      labelLine: isOutside
        ? {
            show: true,
            length: 14,
            length2: 14,
            smooth: false,
            // Leader lines drawn in a muted token, matching the docs aesthetic.
            lineStyle: { color: withAlpha(tokens.mutedForeground, 0.45), width: 1 },
          }
        : { show: false },
      data: sectors,
    },
  ];
}

// Loading skeleton — ONE gray ring of equal sectors regardless of the real data
// (Recharts parity), swept by the shimmer rAF. Respects the pie's shape so a
// donut skeleton stays a donut. The per-sector color is a placeholder; the rAF
// loop retints each sector every frame.
function buildLoadingOption(ctx: OptionBuildContext): EChartsOption {
  const { pie, legendSlot, resolved } = ctx;
  const { tokens } = resolved;

  const innerRadius = pie?.innerRadius ?? DEFAULT_INNER_RADIUS;
  const outerRadius = pie?.outerRadius ?? DEFAULT_OUTER_RADIUS;
  const cornerRadius = pie?.cornerRadius ?? DEFAULT_CORNER_RADIUS;
  const paddingAngle = pie?.paddingAngle ?? DEFAULT_PADDING_ANGLE;
  const startAngle = pie?.startAngle ?? DEFAULT_START_ANGLE;
  const endAngle = pie?.endAngle ?? DEFAULT_END_ANGLE;

  const border = sectorBorder(paddingAngle, tokens.background);
  const sectors = Array.from({ length: LOADING_SECTORS }, (_, i) => {
    const itemStyle: PieItemStyle = {
      color: withAlpha(tokens.foreground, LOADING_BASE_OPACITY),
      opacity: 1,
      borderRadius: cornerRadius,
    };
    // Same constant-width gap / overlap separator as the real pie.
    if (border) {
      itemStyle.borderColor = border.borderColor;
      itemStyle.borderWidth = border.borderWidth;
    }
    return { name: `__loading-${i}`, value: 1, itemStyle };
  });

  return {
    animation: false,
    tooltip: { show: false },
    series: [
      {
        id: "__loading",
        type: "pie",
        center: ["50%", pieCenterY(legendSlot)],
        radius: [innerRadius, outerRadius],
        startAngle,
        endAngle,
        clockwise: false,
        padAngle: Math.min(paddingAngle, 0),
        silent: true,
        emphasis: { scale: false },
        label: { show: false },
        labelLine: { show: false },
        data: sectors,
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Live imperative state — everything the ECharts event handlers and rAF loops
// read or write OUTSIDE the React render cycle, grouped in one ref-stable object
// so the whole imperative surface is visible at a glance. None of it is render
// output, which is exactly why it is not React state.
// ─────────────────────────────────────────────────────────────────────────────

type LiveState = {
  resolved: ResolvedColors | null; // colors read off the live DOM — feeds builds and rAF loops
  hasRevealed: boolean; // the intro draw-in already played on this chart instance
  // Latest callbacks/flags for the imperative ECharts click handler.
  handlers: {
    isClickable: boolean;
    selectedSector: string | null;
    selectSector: (name: string | null) => void;
  };
  // Update-style re-push for paths that bypass React entirely (theme flips) —
  // set by the sync effect.
  repush: () => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apache ECharts port of the EvilCharts pie chart, exposing a compound-as-config
 * API so its JSX reads identically to the Recharts twin. The root owns the data,
 * config, selection state, loading skeleton, and intro reveal; every visual part —
 * `<Pie>`, `<Tooltip>`, `<Legend>`, `<Background>` — is composed as a declarative
 * child that renders nothing. The root walks those children by reference and
 * drives a single imperative ECharts instance. Fully self-contained: its only
 * dependencies are `react`, `echarts`, and `motion`.
 */
export function EChartsPieChart<TData extends Record<string, unknown>>({
  data,
  config,
  dataKey,
  nameKey,
  className,
  animation = true,
  defaultSelectedSector = null,
  onSelectionChange,
  isLoading = false,
  chartOptions,
  children,
}: EChartsPieChartProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<EChartsInstance | null>(null);

  // The single imperative surface (see LiveState). `resolved` lives here rather
  // than in state: as state it would force an extra render pass and an effect
  // whose only job is to trigger the option push. The object identity is stable
  // for the component's lifetime.
  const live = useRef<LiveState>({
    resolved: null,
    hasRevealed: false,
    handlers: {
      isClickable: false,
      selectedSector: defaultSelectedSector,
      selectSector: () => {},
    },
    repush: () => {},
  }).current;

  const shouldReduceMotion = useReducedMotion();

  const [selectedSector, setSelectedSector] = useState<string | null>(defaultSelectedSector);

  // ── Declarative config, collected from children by reference ─────────────────
  const collected = useMemo(() => collectConfig(children), [children]);
  const { pie, tooltip: tooltipSlot, legend: legendSlot, background: backgroundSlot } = collected;

  // Sector names in data order — the keys color resolution, the legend, and the
  // click handler all agree on. Config is keyed by these same names.
  const sectorKeys = useMemo(
    () => data.map((row) => String(row[nameKey as string])),
    [data, nameKey],
  );

  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);

  // Sets selection state and notifies the parent with the sector's value.
  const selectSector = useCallback(
    (name: string | null) => {
      setSelectedSector(name);
      if (name === null) {
        onSelectionChange?.(null);
        return;
      }
      const item = data.find((row) => String(row[nameKey as string]) === name);
      onSelectionChange?.(
        item ? { dataKey: name, value: Number(item[dataKey as string]) || 0 } : null,
      );
    },
    [data, dataKey, nameKey, onSelectionChange],
  );

  // Refresh the click handler's snapshot of the latest callbacks/flags every render.
  live.handlers = {
    isClickable: pie?.isClickable ?? false,
    selectedSector,
    selectSector,
  };

  // ── Option builder ───────────────────────────────────────────────────────────
  // Thin orchestrator over the pure builders above: snapshot the resolved colors
  // into an OptionBuildContext, then assemble.
  const buildOption = useCallback((): EChartsOption => {
    const resolved = live.resolved;
    if (!resolved) return {};

    const ctx: OptionBuildContext = {
      data,
      config,
      nameKey: nameKey as string,
      dataKey: dataKey as string,
      pie,
      selectedSector,
      tooltipSlot,
      legendSlot,
      isLoading,
      resolved,
    };

    if (isLoading) return buildLoadingOption(ctx);

    return {
      animation: false,
      tooltip: buildTooltipOption(ctx),
      series: buildPieSeries(ctx),
    };
  }, [
    live,
    data,
    config,
    nameKey,
    dataKey,
    pie,
    selectedSector,
    tooltipSlot,
    legendSlot,
    isLoading,
  ]);

  // ── Init + resize + theme observer (once) ────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    const container = containerRef.current;
    if (!mount || !container) return;

    const chart = echarts.init(mount);
    echartsRef.current = chart;

    const resizeObserver = new ResizeObserver(() => {
      // Observers always fire once right after observe(). Repushing on that no-op
      // fire would land one frame into the intro and stomp the reveal — only
      // react when the renderer size actually changed. The pie has no
      // renderer-sized textures, so a plain resize() (which re-lays the
      // percentage geometry) is all a size change needs.
      if (mount.clientWidth === chart.getWidth() && mount.clientHeight === chart.getHeight()) {
        return;
      }
      chart.resize();
    });
    resizeObserver.observe(mount);

    // Light/dark flips change no React state — re-resolve and push directly.
    const themeObserver = new MutationObserver(() => {
      live.repush();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    chart.on("click", (params) => {
      const { isClickable, selectedSector: selected, selectSector: select } = live.handlers;
      if (!isClickable) return;
      const p = params as { name?: string; seriesId?: string };
      // Ignore the loading skeleton's `__`-prefixed series.
      if (String(p.seriesId ?? "").startsWith("__")) return;
      const name = p.name;
      if (typeof name !== "string") return;
      // Clicking the selected sector clears the selection, otherwise selects it.
      select(selected === name ? null : name);
    });

    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
      chart.dispose();
      echartsRef.current = null;
      // The reveal guard belongs to the chart instance it guarded. Without this
      // reset, StrictMode's dev-only mount→unmount→remount plays the entrance on
      // the throwaway instance and the surviving one renders without it.
      live.hasRevealed = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync ECharts with props/theme/selection — resolve, build, push ────────────
  useEffect(() => {
    const chart = echartsRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;

    // Colors come from the <style> committed just before this effect ran — read
    // them here, right before the push, rather than round-tripping through state.
    live.resolved = resolveColors(container, config, sectorKeys);

    const push = (withEntrance: boolean) => {
      const option = buildOption();
      const merged = chartOptions ? { ...option, ...chartOptions } : option;
      Object.assign(merged, {
        animation: withEntrance,
        animationDuration: REVEAL_DURATION,
        animationDurationUpdate: 0,
      });
      // chartOptions is an untyped escape hatch — the spread erases the option's
      // shape, so re-assert it. The only cast in the file.
      chart.setOption(merged as EChartsOption, { notMerge: true });
    };

    // Intro reveal — ECharts' native pie expansion, enabled only for the first
    // real render. Every later push (selection, theme) applies instantly, since
    // notMerge would otherwise replay the entrance on each. A loading cycle
    // re-arms it: the Recharts twin remounts its sectors after loading and
    // replays the intro, so data → loading → data draws in again here too.
    if (isLoading) live.hasRevealed = false;
    const shouldReveal = !live.hasRevealed && !isLoading;
    if (shouldReveal) live.hasRevealed = true;
    const revealEnabled = animation && shouldReveal && !shouldReduceMotion;
    push(revealEnabled);

    // Theme flips re-enter here without touching React: re-read the tokens (the
    // .dark class changed) and push an update-style option.
    live.repush = () => {
      live.resolved = resolveColors(container, config, sectorKeys);
      push(false);
    };
  }, [
    live,
    buildOption,
    chartOptions,
    isLoading,
    animation,
    shouldReduceMotion,
    config,
    sectorKeys,
  ]);

  // ── Default tooltip index — show a sector's tooltip with no hover ─────────────
  useEffect(() => {
    const chart = echartsRef.current;
    if (!chart || isLoading || !tooltipSlot.present || tooltipSlot.defaultIndex == null) return;
    // Dispatch after paint so the sector geometry exists to anchor the tooltip.
    const raf = requestAnimationFrame(() => {
      chart.dispatchAction({
        type: "showTip",
        seriesIndex: 0,
        dataIndex: tooltipSlot.defaultIndex,
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [isLoading, tooltipSlot.present, tooltipSlot.defaultIndex]);

  // ── Loading shimmer — rAF sweeps a bright window around the ring ──────────────
  useEffect(() => {
    const chart = echartsRef.current;
    if (!chart || !isLoading) return;

    const cornerRadius = pie?.cornerRadius ?? DEFAULT_CORNER_RADIUS;
    const paddingAngle = pie?.paddingAngle ?? DEFAULT_PADDING_ANGLE;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const phase = ((((now - start) / LOADING_ANIMATION_DURATION) % 1) + 1) % 1;
      // Read tokens per frame, so a theme flip mid-loading retints the shimmer.
      const foreground = live.resolved?.tokens.foreground ?? FALLBACK_COLOR;
      const background = live.resolved?.tokens.background ?? FALLBACK_COLOR;

      // Rebuild the full itemStyle for each sector — setOption replaces a series'
      // data array wholesale, so a partial datum would drop the border/rounding.
      const border = sectorBorder(paddingAngle, background);
      const sectors = Array.from({ length: LOADING_SECTORS }, (_, i) => {
        const pos = (i + 0.5) / LOADING_SECTORS;
        const itemStyle: PieItemStyle = {
          color: withAlpha(foreground, loadingSectorAlpha(pos, phase)),
          opacity: 1,
          borderRadius: cornerRadius,
        };
        if (border) {
          itemStyle.borderColor = border.borderColor;
          itemStyle.borderWidth = border.borderWidth;
        }
        return { value: 1, itemStyle };
      });

      chart.setOption(
        { series: [{ id: "__loading", data: sectors }] },
        { silent: true, lazyUpdate: true },
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, isLoading, pie]);

  // ── Legend overlay position ──────────────────────────────────────────────────
  const legendStyle: CSSProperties = {
    position: "absolute",
    left: 16,
    right: 16,
    pointerEvents: "auto",
    ...(legendSlot.verticalAlign === "top"
      ? { top: 12 }
      : legendSlot.verticalAlign === "bottom"
        ? { bottom: 12 }
        : { top: "50%", transform: "translateY(-50%)" }),
  };

  return (
    <div
      ref={containerRef}
      data-chart={chartId}
      className={`relative flex flex-col text-xs ${className ?? ""}`}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="relative min-h-0 w-full flex-1">
        {backgroundSlot.present && !isLoading && (
          <BackgroundLayer variant={backgroundSlot.variant} />
        )}
        <div ref={mountRef} className="relative h-full min-h-0 w-full" />
      </div>

      {legendSlot.present && !isLoading && (
        <LegendOverlay
          seriesKeys={sectorKeys}
          config={config}
          variant={legendSlot.variant}
          align={legendSlot.align}
          verticalAlign={legendSlot.verticalAlign}
          selectedKey={selectedSector}
          hoveredKey={null}
          isClickable={legendSlot.isClickable}
          onToggle={(key) => selectSector(selectedSector === key ? null : key)}
          style={legendStyle}
        />
      )}

      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="text-primary bg-background flex items-center justify-center gap-2 rounded-md border px-2 py-0.5 text-sm"
          >
            <div className="border-border border-t-primary h-3 w-3 animate-spin rounded-full border" />
            <span>Loading</span>
          </motion.div>
        </div>
      )}
    </div>
  );
}

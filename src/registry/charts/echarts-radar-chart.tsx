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
import {
  RadarComponent,
  TooltipComponent,
  type RadarComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import { dotStyle, sampleGradient, type DotVariant } from "@/registry/ui/echarts-dot";
import { LegendOverlay, type LegendVariant } from "@/registry/ui/echarts-legend";
import { RadarChart, type RadarSeriesOption } from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

// Re-export the shared types that were previously declared inline here, so
// existing consumers/examples keep importing them from the chart module.
export type {
  ChartConfig,
  DotVariant,
  LegendVariant,
  TooltipPosition,
  TooltipRoundness,
  TooltipVariant,
};

// Modular registration keeps the bundle lean — only the pieces this chart needs.
// `RadarComponent` is the polar coordinate system (indicators, rings, spokes);
// `RadarChart` is the series that draws polygons inside it. No GraphicComponent —
// this chart has no zrender overlays (the recharts twin has no brush).
echarts.use([RadarChart, RadarComponent, TooltipComponent, CanvasRenderer]);

type EChartsInstance = ReturnType<typeof echarts.init>;

// The exact option surface this chart uses — radar series, the radar coordinate
// component, and the tooltip. Narrower than echarts' full EChartsOption, so a
// misspelled key fails the compile instead of silently reaching setOption. Radar
// has no cartesian axes, so unlike the area chart there are no derived x/y types.
type EChartsOption = ComposeOption<
  RadarSeriesOption | RadarComponentOption | TooltipComponentOption
>;

// Single-item view of the radar component's array-or-single field, used where a
// single radar coordinate system is built.
type ArrayItem<T> = T extends readonly (infer U)[] ? U : T;
type RadarOption = ArrayItem<NonNullable<EChartsOption["radar"]>>;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STROKE_WIDTH = 1;
const DEFAULT_FILL_OPACITY = 0.3; // resting fill opacity for a filled radar (twin default)
const LOADING_ANIMATION_DURATION = 2000; // shimmer loop, in milliseconds
const REVEAL_DURATION = 1000; // intro draw-in length, in milliseconds
// NOTE: the intro draw-in is DRIVEN BY DATA, not ECharts' native radar entrance.
// ECharts grows the polygon from the center but SNAPS the vertex symbols straight
// to their final positions (its RadarView reads `oldPoints` from the polyline
// AFTER `initProps` has already committed the target points, so every symbol
// starts and ends at the same place and never moves — verified empirically). That
// left the dots detached from the still-collapsing shape. Instead we disable the
// native entrance and ramp every series' VALUES from 0 (all vertices at the center)
// to their final magnitude over REVEAL_DURATION, re-pushing the data each frame.
// Because the symbols track their datum, they ride the polygon vertices out from
// the center and stay glued to the shape at every frame. Radar has no directional
// wipe like the area chart, so `animation` is the single master switch.
const LOADING_DEFAULT_POINTS = 6; // matches the recharts twin's LOADING_POINTS

// ─────────────────────────────────────────────────────────────────────────────
// Theme knobs — every neutral line in the chart draws from these. Base colors
// come from the consumer's CSS tokens (resolved from the live DOM), so only the
// opacity factors live here. Factors MULTIPLY the token's own alpha — a border
// token that is already 10%-white stays subtle. Tune here, not in the builder.
// ─────────────────────────────────────────────────────────────────────────────
// Recharts draws the polar grid at ~border/20, but SVG dashes render pixel-crisp
// while canvas at 2× DPR spreads a 1px line across device pixels — roughly halving
// perceived intensity. Using the border token's full alpha lands both engines at
// the same apparent brightness.
const GRID_LINE_OPACITY = 1; // dashed rings + radial spokes, × border alpha
// The skeleton is CLIPPED to a small sweeping window — only the polygon section
// inside it exists (stroke + fill), everything outside is fully transparent, like
// a clip-path sliding across the chart.
const LOADING_STROKE_OPACITY = 0.5; // outline inside the window, × foreground alpha
const LOADING_SHIMMER_MAX_OPACITY = 0.05; // fill inside the window, × foreground alpha
const LOADING_SHIMMER_BAND = 0.2; // window half-width, fraction of chart width
const LOADING_SHIMMER_FEATHER = 0.2; // eased edge softening of the clip window

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type RadarVariant = "filled" | "lines";
export type GridType = "polygon" | "circle";
// DotVariant, TooltipVariant, TooltipRoundness, TooltipPosition, LegendVariant,
// and ChartConfig now live in the shared @/registry/ui/echarts/* modules and are
// imported + re-exported at the top of this file.

export interface EChartsRadarChartProps<TData extends Record<string, unknown>> {
  data: TData[]; // rows rendered by the chart — each row is one angle-axis category
  config: ChartConfig; // series colors + labels
  className?: string; // extra classes for the chart container
  animation?: boolean; // master switch for the intro draw-in — false renders instantly
  defaultSelectedDataKey?: string | null; // series selected on first render
  onSelectionChange?: (key: string | null) => void; // fires when the selected series changes
  isLoading?: boolean; // shows the animated loading skeleton
  loadingPoints?: number; // number of points in the loading skeleton
  chartOptions?: Record<string, unknown>; // escape hatch merged over the built ECharts option
  children?: ReactNode; // declarative config — <Radar>, <PolarGrid>, <PolarAngleAxis>, …
}

// ─────────────────────────────────────────────────────────────────────────────
// Composible parts — DECLARATIVE CONFIG. Every part renders `null`; the root
// walks `children` by reference (child.type === Radar, …) to collect its props.
// Presence semantics mirror the Recharts twin: omit a child and that part does
// not render. These are never mounted into the tree — they only carry props.
// ─────────────────────────────────────────────────────────────────────────────

export interface RadarProps {
  dataKey: string; // series key — must exist on the data + config
  variant?: RadarVariant; // "filled" shows the fill, "lines" only the outline
  fillOpacity?: number; // opacity of the filled area when variant="filled"
  isClickable?: boolean; // lets this radar be selected by clicking it
  children?: ReactNode; // optional <Dot> and <ActiveDot> config
}

/**
 * A single radar series — one polygon over all angle-axis categories. Declares
 * its own fill/clickability and, optionally, resting/active vertex markers
 * via composed <Dot> / <ActiveDot>. Renders nothing — the root reads these props
 * to build the ECharts radar series.
 */
export const Radar: FC<RadarProps> = () => null;

export interface DotProps {
  variant?: DotVariant; // visual style of the vertex marker
}

/** Declares the resting vertex marker for the enclosing <Radar>. Renders nothing. */
export const Dot: FC<DotProps> = () => null;

/** Declares the hovered/active vertex marker for the enclosing <Radar>. Renders nothing. */
export const ActiveDot: FC<DotProps> = () => null;

export interface PolarGridProps {
  gridType?: GridType; // "polygon" (angular rings) or "circle" (circular rings)
}

/**
 * Presence draws the polar grid — the concentric rings and the radial spokes.
 * `gridType` picks the ring shape. Renders nothing.
 */
export const PolarGrid: FC<PolarGridProps> = () => null;

export interface PolarAngleAxisProps {
  dataKey?: string; // data key whose values label the perimeter — overrides auto-detect
}

/** Presence shows the angle-axis category labels around the perimeter. Renders nothing. */
export const PolarAngleAxis: FC<PolarAngleAxisProps> = () => null;

/** Presence shows the radial value scale running from the center outward. Renders nothing. */
export const PolarRadiusAxis: FC = () => null;

export interface TooltipProps {
  variant?: TooltipVariant; // visual style of the tooltip surface
  roundness?: TooltipRoundness; // border-radius of the tooltip
  position?: TooltipPosition; // "variable" follows the pointer (default); "fixed" pins the tooltip near the top and tracks the pointer's X
  // Data index shown by default with no hover. On canvas the radar tooltip is
  // item-triggered (per polygon), so this selects the DEFAULT SERIES to reveal
  // — see the note in the sync effect.
  defaultIndex?: number;
}

/** Presence enables the hover tooltip. Renders nothing. */
export const Tooltip: FC<TooltipProps> = () => null;

export interface LegendProps {
  variant?: LegendVariant; // visual style of the legend indicators
  align?: "left" | "center" | "right"; // horizontal placement
  verticalAlign?: "top" | "middle" | "bottom"; // vertical placement
  isClickable?: boolean; // lets each entry toggle selection of its series
}

/** Presence enables the HTML legend overlay. Renders nothing. */
export const Legend: FC<LegendProps> = () => null;

// ─────────────────────────────────────────────────────────────────────────────
// Children collection — walk the declarative config into plain objects the
// option builder consumes. <Dot> / <ActiveDot> are read from each <Radar>'s own
// children; a missing dot child means that marker does not render.
// ─────────────────────────────────────────────────────────────────────────────

type RadarSeriesConfig = {
  dataKey: string;
  variant: RadarVariant;
  fillOpacity: number;
  isClickable: boolean;
  dotVariant: DotVariant; // "none" when no <Dot> child is present
  activeDotVariant: DotVariant; // "none" when no <ActiveDot> child is present
};

type PolarGridSlot = { present: boolean; gridType: GridType };
type PolarAngleAxisSlot = { present: boolean; dataKey?: string };
type PolarRadiusAxisSlot = { present: boolean };
type TooltipSlot = {
  present: boolean;
  variant: TooltipVariant;
  roundness: TooltipRoundness;
  position: TooltipPosition;
  defaultIndex?: number;
};
type LegendSlot = {
  present: boolean;
  variant: LegendVariant;
  align: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  isClickable: boolean;
};

type CollectedConfig = {
  radars: RadarSeriesConfig[];
  grid: PolarGridSlot;
  angleAxis: PolarAngleAxisSlot;
  radiusAxis: PolarRadiusAxisSlot;
  tooltip: TooltipSlot;
  legend: LegendSlot;
};

function collectConfig(children: ReactNode): CollectedConfig {
  const radars: RadarSeriesConfig[] = [];
  let grid: PolarGridSlot = { present: false, gridType: "polygon" };
  let angleAxis: PolarAngleAxisSlot = { present: false };
  let radiusAxis: PolarRadiusAxisSlot = { present: false };
  let tooltip: TooltipSlot = {
    present: false,
    variant: "default",
    roundness: "lg",
    position: "variable",
  };
  let legend: LegendSlot = {
    present: false,
    variant: "rounded-square",
    align: "center",
    verticalAlign: "bottom",
    isClickable: false,
  };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const type = child.type;

    if (type === Radar) {
      const props = child.props as RadarProps;
      let dotVariant: DotVariant = "none";
      let activeDotVariant: DotVariant = "none";
      Children.forEach(props.children, (dotChild) => {
        if (!isValidElement(dotChild)) return;
        if (dotChild.type === Dot) {
          dotVariant = (dotChild.props as DotProps).variant ?? "default";
        } else if (dotChild.type === ActiveDot) {
          activeDotVariant = (dotChild.props as DotProps).variant ?? "default";
        }
      });
      radars.push({
        dataKey: props.dataKey,
        variant: props.variant ?? "filled",
        fillOpacity: props.fillOpacity ?? DEFAULT_FILL_OPACITY,
        isClickable: props.isClickable ?? false,
        dotVariant,
        activeDotVariant,
      });
    } else if (type === PolarGrid) {
      const props = child.props as PolarGridProps;
      grid = { present: true, gridType: props.gridType ?? "polygon" };
    } else if (type === PolarAngleAxis) {
      const props = child.props as PolarAngleAxisProps;
      angleAxis = { present: true, dataKey: props.dataKey };
    } else if (type === PolarRadiusAxis) {
      radiusAxis = { present: true };
    } else if (type === Tooltip) {
      const props = child.props as TooltipProps;
      tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
        position: props.position ?? "variable",
        defaultIndex: props.defaultIndex,
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
    }
  });

  return { radars, grid, angleAxis, radiusAxis, tooltip, legend };
}

// Color plumbing (ChartConfig, getColorsCount, distributeColors, buildChartCss,
// normalizeColor, withAlpha, ResolvedColors, resolveColors) now lives in the shared
// @/registry/ui/echarts-chart module, imported at the top of this file.

// ─────────────────────────────────────────────────────────────────────────────
// Radar paints — the ECharts analogue of the twin's SVG gradients.
// ─────────────────────────────────────────────────────────────────────────────

const GRAY = "rgba(120, 120, 120, 1)";

// Diagonal multi-stop stroke, mirroring the twin's StrokeGradient (x1,y1 → x2,y2
// = 0,0 → 1,1). A solid string when there is only one color. The gradient is
// bbox-relative, so each polygon vertex takes the color at its position — the
// canvas echo of the SVG stroke gradient clipping the polygon path.
function radarStrokePaint(slots: string[]): string | echarts.graphic.LinearGradient {
  if (slots.length <= 1) return slots[0] ?? GRAY;
  const stops = slots.map((color, i) => ({ offset: i / (slots.length - 1), color }));
  return new echarts.graphic.LinearGradient(0, 0, 1, 1, stops);
}

// Radial center→edge fill, mirroring the twin's FillGradient: first color at 0.8
// alpha in the middle fading to 0.3 at the rim. bbox-relative (global: false), so
// the gradient's center lands on the radar's center. The consumer's `fillOpacity`
// multiplies this via areaStyle.opacity, exactly like the twin's fillOpacity prop.
function radarFillPaint(slots: string[]): echarts.graphic.RadialGradient {
  if (slots.length <= 1) {
    const base = slots[0] ?? GRAY;
    return new echarts.graphic.RadialGradient(0.5, 0.5, 0.5, [
      { offset: 0, color: withAlpha(base, 0.8) },
      { offset: 1, color: withAlpha(base, 0.3) },
    ]);
  }
  return new echarts.graphic.RadialGradient(
    0.5,
    0.5,
    0.5,
    slots.map((color, i) => ({
      offset: i / (slots.length - 1),
      color: withAlpha(color, i === 0 ? 0.8 : 0.3),
    })),
  );
}

// Vertex dots (dotStyle/dotItemStyle/DOT_SIZES) and gradient sampling (sampleGradient)
// now live in the shared @/registry/ui/echarts-dot module, imported at the top of this
// file. A radar series is a SINGLE data item, so every vertex shares one itemStyle:
// multi-color radars give all dots one representative color via sampleGradient(slots,
// 0.5) rather than tinting each vertex individually.

// ─────────────────────────────────────────────────────────────────────────────
// Selection opacity — the twin only dims a CLICKABLE radar that isn't selected;
// a non-clickable radar keeps full opacity even when a sibling is selected.
// Split into stroke/fill/dot factors (mirroring the area chart's getOpacity): the
// base state keeps stroke and dots at full, and a dimmed radar's fill drops twice
// as far as its stroke/dots so the receding outline still reads.
// ─────────────────────────────────────────────────────────────────────────────

function selectionOpacity(
  selected: string | null,
  key: string,
  isClickable: boolean,
): { fill: number; stroke: number; dot: number } {
  const isSelected = selected === null || selected === key;
  if (!isClickable || isSelected) return { fill: 1, stroke: 1, dot: 1 };
  return { fill: 0.1, stroke: 0.2, dot: 0.2 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton helpers
// ─────────────────────────────────────────────────────────────────────────────

// Skeleton polygon as a smooth random walk in a comfortable band — reads like a
// resting radar instead of raw noise spikes. Values live in [0, LOADING_MAX].
const LOADING_MAX = 100;
function getLoadingData(points: number): number[] {
  const rows: number[] = [];
  let value = 45 + Math.random() * 25;
  for (let i = 0; i < points; i++) {
    value = Math.min(90, Math.max(35, value + (Math.random() - 0.5) * 35));
    rows.push(Math.round(value));
  }
  return rows;
}

// Gradient stops forming a hard clip window around `center`: full `peak` alpha
// inside, zero outside, with a small feather so the edge isn't aliased.
// `center` may run outside [0, 1] so the window fully enters and exits the frame.
function shimmerWindowStops(center: number, color: string, peak: number) {
  const half = LOADING_SHIMMER_BAND;
  const feather = LOADING_SHIMMER_FEATHER;

  const alphaAt = (x: number) => {
    const dist = Math.abs(x - center);
    if (dist <= half - feather) return peak;
    if (dist >= half) return 0;
    // Sine-eased falloff — a linear ramp still reads as a hard cut.
    return peak * Math.sin(((1 - (dist - (half - feather)) / feather) * Math.PI) / 2);
  };

  const offsets = [
    0,
    center - half,
    center - half + feather,
    center,
    center + half - feather,
    center + half,
    1,
  ]
    .filter((x) => x >= 0 && x <= 1)
    .sort((a, b) => a - b);

  const stops: { offset: number; color: string }[] = [];
  for (const offset of offsets) {
    if (stops.length === 0 || offset - stops[stops.length - 1].offset > 1e-4) {
      stops.push({ offset, color: withAlpha(color, alphaAt(offset)) });
    }
  }
  return stops;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip + legend HTML — the tooltip shell styling (roundnessClass,
// tooltipVariantClass, tooltipRow, tooltipIndicatorHtml) and the legend overlay
// (LegendOverlay + its indicators) now live in the shared
// @/registry/ui/echarts/{tooltip,legend} modules, imported at the top of this file.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Option builders — pure functions from a snapshot context to ECharts option
// fragments. The component reads its refs and props ONCE per build into this
// context; nothing below touches React state or the chart instance, so each
// fragment can be reasoned about (and tested) in isolation.
// ─────────────────────────────────────────────────────────────────────────────

type OptionBuildContext = {
  data: Record<string, unknown>[];
  config: ChartConfig;
  radars: RadarSeriesConfig[];
  seriesKeys: string[];
  selectedDataKey: string | null;
  hasSelection: boolean;
  gridSlot: PolarGridSlot;
  angleAxisSlot: PolarAngleAxisSlot;
  radiusAxisSlot: PolarRadiusAxisSlot;
  tooltipSlot: TooltipSlot;
  legendSlot: LegendSlot;
  isLoading: boolean;
  loadingData: () => number[];
  loadingPoints: number;
  resolved: ResolvedColors;
  categories: string[]; // angle-axis labels (indicator names)
  indicatorMax: number; // shared radius-axis max across every spoke
};

// The radar's vertical placement. When a legend rides the bottom (the default)
// the coordinate system floats up to leave room, mirroring the Recharts layout.
function radarCenterY(legendSlot: LegendSlot): string {
  if (!legendSlot.present) return "50%";
  if (legendSlot.verticalAlign === "bottom") return "46%";
  if (legendSlot.verticalAlign === "top") return "54%";
  return "50%";
}

// The radar coordinate system — indicators (one per category), rings, spokes, and
// the two label sets. Grid visibility is gated on <PolarGrid>, perimeter labels
// on <PolarAngleAxis>, and the radial scale on <PolarRadiusAxis>, matching the
// twin's presence semantics.
function buildRadarComponent(ctx: OptionBuildContext): RadarOption {
  const { gridSlot, angleAxisSlot, radiusAxisSlot, isLoading, categories, indicatorMax } = ctx;
  const { tokens } = ctx.resolved;
  const gridColor = withAlpha(tokens.border, GRID_LINE_OPACITY);

  return {
    center: ["50%", radarCenterY(ctx.legendSlot)],
    radius: "68%",
    // Recharts starts the first category at the top and reads clockwise; startAngle
    // 90 places the first indicator at the top to match.
    startAngle: 90,
    shape: gridSlot.gridType,
    splitNumber: 4,
    indicator: categories.map((name) => ({ name, max: indicatorMax })),
    // Perimeter category labels — the twin's <PolarAngleAxis>.
    axisName: {
      show: angleAxisSlot.present && !isLoading,
      color: tokens.mutedForeground,
      fontSize: 10,
    },
    // Radial spokes from the center — part of the twin's <PolarGrid>.
    axisLine: {
      show: gridSlot.present && !isLoading,
      lineStyle: { color: gridColor },
    },
    axisTick: { show: false },
    // Concentric rings — the other half of <PolarGrid>. Dashed [3, 4] mirrors the
    // twin's strokeDasharray. Hidden while loading so the skeleton floats clean.
    splitLine: {
      show: gridSlot.present && !isLoading,
      lineStyle: { color: gridColor, type: [3, 4] as [number, number] },
    },
    splitArea: { show: false },
    // Radial value scale — the twin's <PolarRadiusAxis>. Hidden while loading.
    axisLabel: {
      show: radiusAxisSlot.present && !isLoading,
      color: tokens.mutedForeground,
      fontSize: 10,
      showMinLabel: false, // the 0 at the dead center reads as clutter
    },
  };
}

// Tooltip HTML builder, closed over the build context. Radar tooltips are
// item-triggered (one polygon at a time), so — unlike the axis-triggered area
// chart — the hovered series is the header and its per-category values are the
// rows. Accepted deviation from the Recharts twin, which anchors on a category.
function createTooltipFormatter(ctx: OptionBuildContext) {
  const { config, selectedDataKey, tooltipSlot, categories } = ctx;

  return (params: unknown): string => {
    const param = (Array.isArray(params) ? params[0] : params) as {
      seriesId?: string;
      seriesName?: string;
      value?: number[];
    } | null;
    if (!param) return "";

    const key = param.seriesId ?? "";
    // The loading skeleton never surfaces in the tooltip.
    if (key.startsWith("__")) return "";

    const item = config[key];
    const colorsCount = item ? getColorsCount(item) : 1;
    const labelText = typeof item?.label === "string" ? item.label : (param.seriesName ?? key);
    const values = Array.isArray(param.value) ? param.value : [];
    const dimmed = selectedDataKey != null && selectedDataKey !== key ? " opacity-30" : "";

    // One row per angle-axis category. Radar rows share the area chart's
    // indicator + label + value shape, so they reuse the shared tooltipRow +
    // tooltipIndicatorHtml. dimmed is "" per row because a radar tooltip is a
    // single series — the dim is applied to the whole shell below instead.
    const body = categories
      .map((category, i) => {
        const raw = values[i];
        const value = typeof raw === "number" ? raw.toLocaleString() : String(raw ?? "");
        return tooltipRow({
          indicatorHtml: tooltipIndicatorHtml(key, colorsCount),
          labelText: category,
          valueText: value,
          dimmed: "",
        });
      })
      .join("");

    // Custom shell (not the shared tooltipShell): a radar tooltip dims the WHOLE
    // surface for a non-selected series and keeps a foreground-colored header (no
    // text-primary) — both byte-identical to the pre-refactor markup.
    return `<div class="grid min-w-32 items-start gap-1.5 border border-border/50 px-2.5 py-1.5 text-xs shadow-xl${dimmed} ${roundnessClass[tooltipSlot.roundness]} ${tooltipVariantClass[tooltipSlot.variant]}">
      <div class="font-medium">${labelText}</div>
      <div class="grid gap-1.5">${body}</div>
    </div>`;
  };
}

function buildTooltipOption(ctx: OptionBuildContext): TooltipComponentOption {
  const { tooltipSlot, isLoading } = ctx;

  return {
    show: tooltipSlot.present && !isLoading,
    // Radar tooltips are item-triggered (per polygon), so this chart does NOT use
    // the shared tooltipBaseOption (which builds an axis-triggered tooltip with an
    // axis pointer). It shares only resolveTooltipPosition to wire the position
    // prop: "variable" → default follow behavior, "fixed" → pinned near the top.
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

// One radar series per <Radar> — each carries a single polygon (one data item)
// over every category, so all of its styling lives at the series level.
function buildRadarSeries(ctx: OptionBuildContext): RadarSeriesOption[] {
  const { data, config, radars, selectedDataKey, hasSelection, categories, resolved } = ctx;

  return radars.map((radar) => {
    const key = radar.dataKey;
    const slots = resolved.series[key] ?? [GRAY];
    const strokePaint = radarStrokePaint(slots);
    // A radar series is one data item — every vertex shares one dot color (§sampleGradient).
    const dotColor = sampleGradient(slots, 0.5);
    const isSelected = selectedDataKey === null || selectedDataKey === key;
    const opacity = selectionOpacity(selectedDataKey, key, radar.isClickable);
    const isFilled = radar.variant === "filled";

    const restingVisible = radar.dotVariant !== "none";
    const activeVisible = radar.activeDotVariant !== "none";
    const restingDot = dotStyle(radar.dotVariant, dotColor, resolved.tokens.background);
    // The active marker falls back to "default" when only a resting dot is declared,
    // so hover always has a marker to promote to.
    const activeDot = dotStyle(
      radar.activeDotVariant === "none" ? "default" : radar.activeDotVariant,
      dotColor,
      resolved.tokens.background,
    );

    const value = categories.map((_, i) => Number(data[i]?.[key]) || 0);

    // ECharts radar has no per-state symbolSize and no numeric emphasis scale, so
    // the hover marker swaps STYLE (e.g. colored-border → solid) at the resting
    // size rather than growing — the twin's r3→r3 markers already match sizes.
    const symbol = restingVisible || activeVisible ? "circle" : "none";

    return {
      id: key,
      name: typeof config[key]?.label === "string" ? (config[key]?.label as string) : key,
      type: "radar",
      radarIndex: 0,
      data: [{ value }],
      symbol,
      symbolSize: restingVisible ? restingDot.size : activeDot.size,
      cursor: radar.isClickable ? "pointer" : "default",
      // The selected radar rides on top; while a selection is active the rest sink.
      z: isSelected ? 3 : hasSelection ? 1 : 2,
      lineStyle: { color: strokePaint, width: STROKE_WIDTH, opacity: opacity.stroke },
      areaStyle: isFilled
        ? { color: radarFillPaint(slots), opacity: radar.fillOpacity * opacity.fill }
        : undefined,
      // Resting dots invisible when only an <ActiveDot> is declared.
      itemStyle: restingVisible
        ? { ...restingDot.itemStyle, opacity: opacity.dot }
        : { ...activeDot.itemStyle, opacity: 0 },
      // While a click selection is active it owns the canvas: native hover
      // emphasis (the dot promotion) forces a dimmed radar's dot back to full
      // opacity, fighting the selection dim — so hover highlighting stops entirely
      // until the selection clears. The option rebuilds on every selection change,
      // so this is a build-time switch.
      emphasis: hasSelection
        ? { disabled: true }
        : {
            // Promote the resting marker to the active variant on hover; keep the
            // line and fill exactly as they rest so only the dot changes (twin parity).
            itemStyle: { ...activeDot.itemStyle, opacity: 1 },
            lineStyle: { color: strokePaint, width: STROKE_WIDTH, opacity: opacity.stroke },
            ...(isFilled
              ? {
                  areaStyle: {
                    color: radarFillPaint(slots),
                    opacity: radar.fillOpacity * opacity.fill,
                  },
                }
              : {}),
          },
    };
  });
}

// Loading skeleton — ONE gray polygon regardless of declared radars (Recharts
// parity: its skeleton is a single LoadingRadar), swept by the shimmer rAF. The
// radar coordinate system exists but every visual axis element is hidden, so the
// polygon floats on a clean canvas exactly like the twin (all its axis parts
// return null while loading).
function buildLoadingOption(ctx: OptionBuildContext): EChartsOption {
  const { tokens } = ctx.resolved;
  const points = ctx.loadingPoints;

  return {
    animation: false,
    radar: {
      center: ["50%", radarCenterY(ctx.legendSlot)],
      radius: "68%",
      startAngle: 90,
      shape: ctx.gridSlot.gridType,
      splitNumber: 4,
      indicator: Array.from({ length: points }, (_, i) => ({ name: `${i}`, max: LOADING_MAX })),
      axisName: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      splitArea: { show: false },
      axisLabel: { show: false },
    },
    tooltip: { show: false },
    series: [
      {
        id: "__loading",
        type: "radar",
        radarIndex: 0,
        silent: true,
        symbol: "none",
        data: [{ value: ctx.loadingData() }],
        // Invisible until the first shimmer tick positions the clip window.
        lineStyle: { color: withAlpha(tokens.foreground, 0), width: 2 },
        areaStyle: { color: withAlpha(tokens.foreground, 0) },
        z: 1,
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Live imperative state — everything the ECharts event handlers, rAF loops, and
// theme/resize repushes read or write OUTSIDE the React render cycle, grouped in
// one ref-stable object so the whole imperative surface is visible at a glance.
// None of it is render output, which is exactly why it is not React state.
// ─────────────────────────────────────────────────────────────────────────────

type LiveState = {
  resolved: ResolvedColors | null; // colors read off the live DOM — feeds builds and rAF loops
  hasRevealed: boolean; // the intro draw-in already played on this chart instance
  revealRaf: number; // rAF handle of the data-driven entrance ramp (0 when idle)
  loadingRows: number[] | null; // skeleton data, lazily rolled and re-rolled per shimmer sweep
  categories: string[]; // angle-axis labels of the last build, for the tooltip
  // Latest callbacks/flags for the imperative ECharts click handler.
  handlers: {
    onSelectionChange?: (key: string | null) => void;
    clickableKeys: Set<string>;
    selectedDataKey: string | null;
    seriesKeys: string[];
  };
  // Update-style re-push for paths that bypass React entirely (theme flips,
  // resizes) — set by the sync effect.
  repush: () => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apache ECharts port of the EvilCharts radar chart, exposing a compound-as-config
 * API so its JSX reads identically to the Recharts twin. The root owns the data,
 * config, selection state, loading skeleton, and intro reveal; every visual part
 * — `<Radar>`, `<PolarGrid>`, `<PolarAngleAxis>`, `<PolarRadiusAxis>`,
 * `<Tooltip>`, `<Legend>` — is composed as a declarative child that renders
 * nothing. The root walks those children by reference and drives a single
 * imperative ECharts instance. Fully self-contained: its only dependencies are
 * `react`, `echarts`, and `motion`.
 */
export function EChartsRadarChart<TData extends Record<string, unknown>>({
  data,
  config,
  className,
  animation = true,
  defaultSelectedDataKey = null,
  onSelectionChange,
  isLoading = false,
  loadingPoints = LOADING_DEFAULT_POINTS,
  chartOptions,
  children,
}: EChartsRadarChartProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<EChartsInstance | null>(null);

  // The single imperative surface (see LiveState). `resolved` lives here rather
  // than in state: as state it forced an extra render pass and an effect whose
  // only job was to trigger the option push — the "chain of computations"
  // react.dev/learn/you-might-not-need-an-effect warns about. The object
  // identity is stable for the component's lifetime.
  const live = useRef<LiveState>({
    resolved: null,
    hasRevealed: false,
    revealRaf: 0,
    loadingRows: null,
    categories: [],
    handlers: {
      onSelectionChange,
      clickableKeys: new Set<string>(),
      selectedDataKey: defaultSelectedDataKey,
      seriesKeys: [],
    },
    repush: () => {},
  }).current;

  // Skeleton rows roll lazily on first use — an impure useRef initializer would
  // re-roll Math.random() on every render.
  const loadingData = useCallback(
    () => (live.loadingRows ??= getLoadingData(loadingPoints)),
    [live, loadingPoints],
  );
  const shouldReduceMotion = useReducedMotion();

  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(defaultSelectedDataKey);

  // ── Declarative config, collected from children by reference ─────────────────
  const collected = useMemo(() => collectConfig(children), [children]);
  const {
    radars,
    grid: gridSlot,
    angleAxis: angleAxisSlot,
    radiusAxis: radiusAxisSlot,
    tooltip: tooltipSlot,
    legend: legendSlot,
  } = collected;

  const seriesKeys = useMemo(() => radars.map((radar) => radar.dataKey), [radars]);

  // angle category key: <PolarAngleAxis dataKey> → first data column no <Radar> claims.
  const angleKey = useMemo(() => {
    if (angleAxisSlot.dataKey) return angleAxisSlot.dataKey;
    const firstRow = data[0];
    if (firstRow) {
      const claimed = new Set(seriesKeys);
      const found = Object.keys(firstRow).find((key) => !claimed.has(key));
      if (found) return found;
    }
    return "";
  }, [angleAxisSlot.dataKey, data, seriesKeys]);

  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);

  const hasSelection = selectedDataKey !== null;

  // Which series may be clicked to toggle selection (consulted by the click handler).
  const clickableKeys = useMemo(
    () => new Set(radars.filter((radar) => radar.isClickable).map((radar) => radar.dataKey)),
    [radars],
  );

  // Refresh the handlers' snapshot of the latest callbacks/flags every render.
  live.handlers = {
    onSelectionChange,
    clickableKeys,
    selectedDataKey,
    seriesKeys,
  };

  const toggleSelection = useCallback(
    (key: string) => {
      setSelectedDataKey((prev) => {
        const next = prev === key ? null : key;
        onSelectionChange?.(next);
        return next;
      });
    },
    [onSelectionChange],
  );

  // ── Option builder ─────────────────────────────────────────────────────────
  // Thin orchestrator over the pure builders above: snapshot the imperative
  // surface (refs) into an OptionBuildContext, then assemble.
  const buildOption = useCallback((): EChartsOption => {
    const resolved = live.resolved;
    if (!resolved) return {};

    const categories = data.map((row) => String(row[angleKey]));
    live.categories = categories;

    // Every spoke shares one radius scale, so the largest value across all series
    // touches the outer ring — the recharts default domain.
    let indicatorMax = 0;
    for (const key of seriesKeys) {
      for (const row of data) indicatorMax = Math.max(indicatorMax, Number(row[key]) || 0);
    }
    indicatorMax = indicatorMax || 1;

    const ctx: OptionBuildContext = {
      data,
      config,
      radars,
      seriesKeys,
      selectedDataKey,
      hasSelection,
      gridSlot,
      angleAxisSlot,
      radiusAxisSlot,
      tooltipSlot,
      legendSlot,
      isLoading,
      loadingData,
      loadingPoints,
      resolved,
      categories,
      indicatorMax,
    };

    if (isLoading) return buildLoadingOption(ctx);

    return {
      animation: false,
      radar: buildRadarComponent(ctx),
      tooltip: buildTooltipOption(ctx),
      // The radar polygons — their seriesIndex feeds the click handler.
      series: buildRadarSeries(ctx),
    };
  }, [
    live,
    data,
    config,
    radars,
    seriesKeys,
    angleKey,
    selectedDataKey,
    hasSelection,
    gridSlot,
    angleAxisSlot,
    radiusAxisSlot,
    tooltipSlot,
    legendSlot,
    isLoading,
    loadingData,
    loadingPoints,
  ]);

  // ── Init + resize + theme observer (once) ────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    const container = containerRef.current;
    if (!mount || !container) return;

    const chart = echarts.init(mount);
    echartsRef.current = chart;

    const resizeObserver = new ResizeObserver(() => {
      // Observers always fire once right after observe(). Repushing on that
      // no-op fire would land one frame into the intro and stomp the radar's
      // reveal — only react when the renderer size actually changed.
      if (mount.clientWidth === chart.getWidth() && mount.clientHeight === chart.getHeight()) {
        return;
      }
      chart.resize();
      live.repush();
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
      const { clickableKeys: clickable, seriesKeys: keys } = live.handlers;
      const p = params as { seriesId?: string; seriesIndex?: number };
      // Symbol clicks carry seriesId; polygon clicks may only carry seriesIndex —
      // recover the key by position. Main radar series come first in the series
      // array (the loading skeleton is silent), so the index maps directly.
      const id =
        p.seriesId ?? (typeof p.seriesIndex === "number" ? keys[p.seriesIndex] : undefined);
      if (typeof id === "string" && clickable.has(id)) toggleSelection(id);
    });

    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
      if (live.revealRaf) {
        cancelAnimationFrame(live.revealRaf);
        live.revealRaf = 0;
      }
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
    live.resolved = resolveColors(container, config, seriesKeys);

    // A radar series carries one data item: `{ value: number[] }`. The entrance
    // ramp reads and rewrites just those magnitudes each frame.
    type RevealSeries = { id?: string; data?: { value?: number[] }[] };

    const cancelReveal = () => {
      if (live.revealRaf) {
        cancelAnimationFrame(live.revealRaf);
        live.revealRaf = 0;
      }
    };

    const buildMerged = (): EChartsOption => {
      const option = buildOption();
      const merged = chartOptions ? { ...option, ...chartOptions } : option;
      // Native animation stays off — the entrance is data-driven (see below), and
      // notMerge would otherwise replay a native entrance on every repush.
      Object.assign(merged, { animation: false, animationDurationUpdate: 0 });
      // chartOptions is an untyped escape hatch — the spread erases the option's
      // shape, so re-assert it.
      return merged as EChartsOption;
    };

    // Settled push — full-magnitude data, no entrance. Every non-first render
    // (selection, theme, resize) and the animation-off path lands here.
    const pushStatic = () => {
      cancelReveal();
      chart.setOption(buildMerged(), { notMerge: true });
    };

    // Entrance push — collapse every radar series to the center, then ramp the
    // values back out to full magnitude. Because each
    // vertex symbol tracks its datum, the dots ride the polygon out from the center
    // and stay glued to the shape at every frame — the fix for ECharts snapping
    // radar symbols straight to their final positions during its native entrance.
    const pushReveal = () => {
      cancelReveal();
      const merged = buildMerged();
      const series = (merged.series as unknown as RevealSeries[] | undefined) ?? [];
      const finals = series.map((s) => s.data?.[0]?.value ?? []);

      // First paint fully collapsed — no flash of the final shape before the ramp.
      chart.setOption(
        {
          ...merged,
          series: series.map((s, i) => ({ ...s, data: [{ value: finals[i].map(() => 0) }] })),
        } as EChartsOption,
        { notMerge: true },
      );

      const start = performance.now();
      const frame = (now: number) => {
        const t = Math.min((now - start) / REVEAL_DURATION, 1);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic — decelerate into place
        chart.setOption(
          {
            series: series.map((s, i) => ({
              id: s.id,
              data: [{ value: finals[i].map((v) => v * eased) }],
            })),
          },
          { silent: true, lazyUpdate: true },
        );
        live.revealRaf = t < 1 ? requestAnimationFrame(frame) : 0;
      };
      live.revealRaf = requestAnimationFrame(frame);
    };

    // Intro reveal — plays only on the first real render. A loading cycle re-arms
    // it: the Recharts twin remounts its <Radar>s while loading and replays the
    // intro on remount, so data → loading → data draws in again here too.
    if (isLoading) live.hasRevealed = false;
    const shouldReveal = !live.hasRevealed && !isLoading;
    if (shouldReveal) live.hasRevealed = true;
    const revealEnabled = animation && shouldReveal && !shouldReduceMotion;
    if (revealEnabled) pushReveal();
    else pushStatic();

    // Default tooltip. On canvas the radar tooltip is item-triggered per polygon,
    // so the twin's `defaultIndex` (a category index) is remapped to the DEFAULT
    // SERIES whose tooltip shows on load. Only fired on the reveal push, never on
    // theme/resize repushes (that would re-pop the tooltip on every flip).
    if (
      !isLoading &&
      tooltipSlot.present &&
      tooltipSlot.defaultIndex != null &&
      seriesKeys.length
    ) {
      const idx = Math.min(Math.max(tooltipSlot.defaultIndex, 0), seriesKeys.length - 1);
      chart.dispatchAction({ type: "showTip", seriesIndex: idx, dataIndex: 0 });
    }

    // Theme flips and resizes re-enter here without touching React: re-read the
    // tokens (the .dark class changed) and push a settled option, cancelling any
    // in-flight entrance ramp.
    live.repush = () => {
      live.resolved = resolveColors(container, config, seriesKeys);
      pushStatic();
    };
  }, [
    live,
    buildOption,
    chartOptions,
    isLoading,
    animation,
    shouldReduceMotion,
    config,
    seriesKeys,
    tooltipSlot.present,
    tooltipSlot.defaultIndex,
  ]);

  // ── Loading shimmer — rAF sweeps a bright band, regenerating data off-screen ─
  useEffect(() => {
    const chart = echartsRef.current;
    if (!chart || !isLoading) return;

    let raf = 0;
    let lastPhase = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const phase = ((((now - start) / LOADING_ANIMATION_DURATION) % 1) + 1) % 1;
      // Wrapped past 1 → the band is off-screen; swap in fresh random data.
      if (phase < lastPhase) live.loadingRows = getLoadingData(loadingPoints);
      lastPhase = phase;

      // Read tokens per frame, so a theme flip mid-loading retints the shimmer.
      const foreground = live.resolved?.tokens.foreground ?? GRAY;
      const w = chart.getWidth();
      const h = chart.getHeight();
      if (!w || !h) {
        raf = requestAnimationFrame(tick);
        return;
      }
      // Sweep the clip window from fully off-screen left to fully off-screen
      // right, leaned 45°. The gradient uses ABSOLUTE pixel coordinates shared by
      // stroke and fill so both reveal the same slice of the polygon at once.
      const maxT = (w + h) / (2 * w);
      const center = phase * (maxT + 2 * LOADING_SHIMMER_BAND) - LOADING_SHIMMER_BAND;
      const clip = (peak: number) =>
        new echarts.graphic.LinearGradient(
          0,
          0,
          w,
          w,
          shimmerWindowStops(center, foreground, peak),
          true,
        );
      chart.setOption(
        {
          series: [
            {
              id: "__loading",
              data: [{ value: loadingData() }],
              lineStyle: { color: clip(LOADING_STROKE_OPACITY), width: 2 },
              areaStyle: { color: clip(LOADING_SHIMMER_MAX_OPACITY) },
            },
          ],
        },
        { silent: true, lazyUpdate: true },
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, isLoading, loadingPoints, loadingData]);

  // ── Legend overlay position ──────────────────────────────────────────────────
  // Insets match the Recharts legend's breathing room inside the plot frame.
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
        <div ref={mountRef} className="h-full min-h-0 w-full" />
      </div>

      {legendSlot.present && !isLoading && (
        <LegendOverlay
          seriesKeys={seriesKeys}
          config={config}
          variant={legendSlot.variant}
          align={legendSlot.align}
          verticalAlign={legendSlot.verticalAlign}
          selectedKey={selectedDataKey}
          hoveredKey={null}
          isClickable={legendSlot.isClickable}
          onToggle={toggleSelection}
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

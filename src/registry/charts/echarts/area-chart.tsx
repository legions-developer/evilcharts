"use client";

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
  tooltipBaseOption,
  tooltipIndicatorHtml,
  tooltipRow,
  tooltipShell,
  type TooltipPosition,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/registry/ui/echarts/tooltip";
import {
  DataZoomComponent,
  GridComponent,
  TooltipComponent,
  type DataZoomComponentOption,
  type GridComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import {
  buildChartCss,
  flattenColor,
  getColorsCount,
  resolveColors,
  seriesPaint,
  withAlpha,
  type ChartConfig,
  type ResolvedColors,
} from "@/registry/ui/echarts/chart";
import {
  buildBrushDataZoom,
  syncBrushOverlay,
  type BrushGeometry,
  type BrushOverlayElements,
  type BrushRange,
} from "@/registry/ui/echarts/evil-brush";
import { dotItemStyle, dotStyle, sampleGradient, type DotVariant } from "@/registry/ui/echarts/dot";
import { LegendOverlay, type LegendVariant } from "@/registry/ui/echarts/legend";
import type { ComposeOption, ImagePatternObject } from "echarts/core";
import { LineChart, type LineSeriesOption } from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
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
// `DataZoomComponent` bundles both the slider (brush footer) and inside (wheel/drag)
// zoom. The brush's frame/handles/labels are raw zrender elements, not the
// graphic component — see syncBrushOverlay.
echarts.use([LineChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

type EChartsInstance = ReturnType<typeof echarts.init>;

// The exact option surface this chart uses — line series, grid, tooltip, and
// dataZoom, plus the axis options they pull in as dependencies. Narrower than
// echarts' full EChartsOption, so a misspelled key fails the compile instead of
// silently reaching setOption.
type EChartsOption = ComposeOption<
  LineSeriesOption | GridComponentOption | TooltipComponentOption | DataZoomComponentOption
>;

// Single-entry views of the composed option's array-or-single fields — the
// modular entry points don't export the axis option types directly.
type ArrayItem<T> = T extends readonly (infer U)[] ? U : T;
type XAxisOption = ArrayItem<NonNullable<EChartsOption["xAxis"]>>;
type YAxisOption = ArrayItem<NonNullable<EChartsOption["yAxis"]>>;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STROKE_WIDTH = 0.8;
const LOADING_ANIMATION_DURATION = 2000; // shimmer loop, in milliseconds
const REVEAL_DURATION = 1000; // intro draw-in length, in milliseconds
// NOTE: the intro draw-in runs ECharts' RAW default entrance animation. Custom
// easing was tried and abandoned — ECharts hardcodes the line-entrance clip to
// linear and ignores animationEasing at every level (verified empirically).
const LOADING_DEFAULT_POINTS = 14;

// ─────────────────────────────────────────────────────────────────────────────
// Theme knobs — every neutral line in the chart draws from these. Base colors
// come from the consumer's CSS tokens (resolved from the live DOM), so only the
// opacity factors live here. Factors MULTIPLY the token's own alpha — a border
// token that is already 10%-white stays subtle. Tune here, not in the builder.
// ─────────────────────────────────────────────────────────────────────────────
// Recharts draws its grid at border/50, but SVG dashes render pixel-crisp while
// canvas at 2× DPR spreads a 1px line across device pixels — roughly halving
// perceived intensity. Using the border token's full alpha lands both engines at
// the same apparent brightness.
const GRID_LINE_OPACITY = 1; // dashed y-axis split lines, × border alpha
const AXIS_POINTER_OPACITY = 1; // tooltip cursor line, × border alpha
// The skeleton is CLIPPED to a small sweeping window — only the wave section
// inside it exists (stroke + fill), everything outside is fully transparent,
// like a clip-path sliding across the chart.
const LOADING_STROKE_OPACITY = 0.5; // outline inside the window, × foreground alpha
const LOADING_SHIMMER_MAX_OPACITY = 0.03; // fill inside the window, × foreground alpha
const LOADING_SHIMMER_BAND = 0.2; // window half-width, fraction of chart width
const LOADING_SHIMMER_FEATHER = 0.2; // eased edge softening of the clip window
const BRUSH_STROKE_OPACITY = 0.5; // mini-chart series stroke
const BRUSH_FILL_OPACITY = 0.15; // mini-chart series fade, at the top stop
const BRUSH_FILLER_OPACITY = 0; // selected-range wash — evil-brush draws none

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type AreaVariant =
  | "gradient"
  | "gradient-reverse"
  | "solid"
  | "dotted"
  | "lines"
  | "hatched";
export type StrokeVariant = "solid" | "dashed" | "animated-dashed";
export type StackType = "default" | "stacked" | "expanded";
export type AreaAnimationType =
  | "none"
  | "left-to-right"
  | "right-to-left"
  | "center-out"
  | "edges-in";
export type CurveType =
  | "linear"
  | "smooth"
  | "bump"
  | "monotone"
  | "monotoneX"
  | "monotoneY"
  | "natural"
  | "step";
// DotVariant, TooltipVariant, TooltipRoundness, LegendVariant, and ChartConfig
// now live in the shared @/registry/ui/echarts/* modules and are imported +
// re-exported at the top of this file.

export interface EChartsAreaChartProps<TData extends Record<string, unknown>> {
  data: TData[]; // rows rendered by the chart
  config: ChartConfig; // series colors + labels
  xDataKey?: keyof TData & string; // x category key — falls back to the <XAxis> dataKey / first free column
  className?: string; // extra classes for the chart container
  curveType?: CurveType; // default curve interpolation each <Area> inherits
  stackType?: StackType; // how multiple areas combine
  animation?: boolean; // master switch for the intro draw-in — false renders instantly
  animationType?: AreaAnimationType; // default intro reveal (first <Area> overrides)
  enableHoverHighlight?: boolean; // hovering a series dims the others, like a temporary selection
  defaultSelectedDataKey?: string | null; // series selected on first render
  selectedDataKey?: string | null; // controlled selection — overrides internal state when set
  onSelectionChange?: (key: string | null) => void; // fires when the selected series changes
  isLoading?: boolean; // shows the animated loading skeleton
  loadingPoints?: number; // number of points in the loading skeleton
  showBrush?: boolean; // renders a zoom brush below the chart
  brushHeight?: number; // height of the brush preview in pixels
  brushFormatLabel?: (value: string, index: number) => string; // formats brush handle labels
  onBrushChange?: (range: { startIndex: number; endIndex: number }) => void; // brush range callback
  chartOptions?: Record<string, unknown>; // escape hatch merged over the built ECharts option
  children?: ReactNode; // declarative config — <Area>, <XAxis>, <Grid>, <Tooltip>, <Legend>, …
}

// ─────────────────────────────────────────────────────────────────────────────
// Composible parts — DECLARATIVE CONFIG. Every part renders `null`; the root
// walks `children` by reference (child.type === Area, …) to collect its props.
// Presence semantics mirror the Recharts twin: omit a child and that part does
// not render. These are never mounted into the tree — they only carry props.
// ─────────────────────────────────────────────────────────────────────────────

export interface AreaProps {
  dataKey: string; // series key — must exist on the data + config
  variant?: AreaVariant; // fill style for this area only
  strokeVariant?: StrokeVariant; // stroke style for this area
  curveType?: CurveType; // curve interpolation — falls back to the root curveType
  animationType?: AreaAnimationType; // intro reveal — first area drives the wrapper wipe
  connectNulls?: boolean; // join segments across null/missing values
  isClickable?: boolean; // lets this area be selected by clicking it
  children?: ReactNode; // optional <Dot> and <ActiveDot> config
}

/**
 * A single area series. Declares its own fill/stroke/curve/clickability and,
 * optionally, resting/active point markers via composed <Dot> / <ActiveDot>.
 * Renders nothing — the root reads these props to build the ECharts series.
 */
export const Area: FC<AreaProps> = () => null;

export interface DotProps {
  variant?: DotVariant; // visual style of the point marker
}

/** Declares the resting point marker for the enclosing <Area>. Renders nothing. */
export const Dot: FC<DotProps> = () => null;

/** Declares the hovered/active point marker for the enclosing <Area>. Renders nothing. */
export const ActiveDot: FC<DotProps> = () => null;

export interface XAxisProps {
  dataKey?: string; // x category key — overrides the root xDataKey
  // Category-axis values are always stringified, so the formatter sees a string —
  // letting examples share `(value) => value.substring(0, 3)` with the Recharts twin.
  tickFormatter?: (value: string, index: number) => string; // formats x tick labels
  label?: string; // axis title, centered below the tick labels
}

/** Presence shows the x-axis category labels. Renders nothing. */
export const XAxis: FC<XAxisProps> = () => null;

export interface YAxisProps {
  dataKey?: string; // reserved for parity with the Recharts twin
  tickFormatter?: (value: number, index: number) => string; // formats y tick labels
  label?: string; // axis title, rotated alongside the tick labels
}

/** Presence shows the y value axis. Renders nothing. */
export const YAxis: FC<YAxisProps> = () => null;

/** Presence shows the dashed horizontal split lines. Renders nothing. */
export const Grid: FC = () => null;

export interface TooltipProps {
  variant?: TooltipVariant; // visual style of the tooltip surface
  roundness?: TooltipRoundness; // border-radius of the tooltip
  cursor?: boolean; // whether the vertical cursor line follows the pointer
  position?: TooltipPosition; // "variable" follows both axes (default); "fixed" pins the tooltip near the top and tracks the pointer's X
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
// option builder consumes. <Dot> / <ActiveDot> are read from each <Area>'s own
// children; a missing dot child means that marker does not render.
// ─────────────────────────────────────────────────────────────────────────────

type AreaSeriesConfig = {
  dataKey: string;
  variant: AreaVariant;
  strokeVariant: StrokeVariant;
  curveType?: CurveType;
  animationType?: AreaAnimationType;
  connectNulls: boolean;
  isClickable: boolean;
  dotVariant: DotVariant; // "none" when no <Dot> child is present
  activeDotVariant: DotVariant; // "none" when no <ActiveDot> child is present
};

type XAxisSlot = {
  present: boolean;
  dataKey?: string;
  tickFormatter?: (value: string, index: number) => string;
  label?: string;
};
type YAxisSlot = {
  present: boolean;
  dataKey?: string;
  tickFormatter?: (value: number, index: number) => string;
  label?: string;
};
type TooltipSlot = {
  present: boolean;
  variant: TooltipVariant;
  roundness: TooltipRoundness;
  cursor: boolean;
  position: TooltipPosition;
};
type LegendSlot = {
  present: boolean;
  variant: LegendVariant;
  align: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  isClickable: boolean;
};

type CollectedConfig = {
  areas: AreaSeriesConfig[];
  xAxis: XAxisSlot;
  yAxis: YAxisSlot;
  showGrid: boolean;
  tooltip: TooltipSlot;
  legend: LegendSlot;
};

function collectConfig(children: ReactNode): CollectedConfig {
  const areas: AreaSeriesConfig[] = [];
  let xAxis: XAxisSlot = { present: false };
  let yAxis: YAxisSlot = { present: false };
  let showGrid = false;
  let tooltip: TooltipSlot = {
    present: false,
    variant: "default",
    roundness: "lg",
    cursor: true,
    position: "variable",
  };
  let legend: LegendSlot = {
    present: false,
    variant: "rounded-square",
    align: "right",
    verticalAlign: "top",
    isClickable: false,
  };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const type = child.type;

    if (type === Area) {
      const props = child.props as AreaProps;
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
      areas.push({
        dataKey: props.dataKey,
        variant: props.variant ?? "gradient",
        strokeVariant: props.strokeVariant ?? "dashed",
        curveType: props.curveType,
        animationType: props.animationType,
        connectNulls: props.connectNulls ?? false,
        isClickable: props.isClickable ?? false,
        dotVariant,
        activeDotVariant,
      });
    } else if (type === XAxis) {
      const props = child.props as XAxisProps;
      xAxis = {
        present: true,
        dataKey: props.dataKey,
        tickFormatter: props.tickFormatter,
        label: props.label,
      };
    } else if (type === YAxis) {
      const props = child.props as YAxisProps;
      yAxis = {
        present: true,
        dataKey: props.dataKey,
        tickFormatter: props.tickFormatter,
        label: props.label,
      };
    } else if (type === Grid) {
      showGrid = true;
    } else if (type === Tooltip) {
      const props = child.props as TooltipProps;
      tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
        cursor: props.cursor ?? true,
        position: props.position ?? "variable",
      };
    } else if (type === Legend) {
      const props = child.props as LegendProps;
      legend = {
        present: true,
        variant: props.variant ?? "rounded-square",
        align: props.align ?? "right",
        verticalAlign: props.verticalAlign ?? "top",
        isClickable: props.isClickable ?? false,
      };
    }
  });

  return { areas, xAxis, yAxis, showGrid, tooltip, legend };
}

// Color plumbing (ChartConfig, getColorsCount, distributeColors, buildChartCss,
// normalizeColor, withAlpha, ResolvedColors, resolveColors, seriesPaint) now
// lives in @/registry/ui/echarts/chart and is imported at the top of this file.

// ─────────────────────────────────────────────────────────────────────────────
// Fill paints — the ECharts analogue of the Recharts fill variants (§1.1).
// The first three are alpha fades; the last three are tiling canvas patterns.
// ─────────────────────────────────────────────────────────────────────────────

// Tiling texture fills, tinted with the series' first color. Stripes are drawn
// STRAIGHT (trivially seamless) and the pattern itself is rotated — zrender
// applies pattern transforms the same way ECharts decals do. Baking a diagonal
// into a square tile clips the stroke at the corners, which reads as periodic
// gaps once tiled. Tiles render at devicePixelRatio and scale back down so the
// texture stays crisp on retina canvases.
function patternFill(
  kind: "dotted" | "lines" | "hatched" | "stripe",
  color: string,
): ImagePatternObject | null {
  if (typeof document === "undefined") return null;
  const dpr = Math.max(window.devicePixelRatio || 1, 1);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const size = (width: number, height: number) => {
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  };
  const pattern = (rotation = 0): ImagePatternObject => ({
    image: canvas,
    repeat: "repeat",
    rotation,
    scaleX: 1 / dpr,
    scaleY: 1 / dpr,
  });

  if (kind === "dotted") {
    size(6, 6);
    ctx.fillStyle = withAlpha(color, 0.5);
    ctx.beginPath();
    ctx.arc(3, 3, 0.6, 0, Math.PI * 2);
    ctx.fill();
    return pattern();
  }

  if (kind === "lines" || kind === "stripe") {
    // Vertical 1px line every 5px, rotated 45° by the pattern transform.
    size(5, 5);
    ctx.strokeStyle = withAlpha(color, 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(2.5, -1);
    ctx.lineTo(2.5, 6);
    ctx.stroke();
    return pattern(-Math.PI / 4);
  }

  // hatched: bold two-tone stripes leaning ~20°, echoing the Recharts
  // gradient-edged stripe fill.
  size(20, 20);
  ctx.fillStyle = withAlpha(color, 0.06);
  ctx.fillRect(0, 0, 10, 20);
  ctx.fillStyle = withAlpha(color, 0.22);
  ctx.fillRect(10, 0, 10, 20);
  return pattern((20 * Math.PI) / 180);
}

// Canvas can't express "multi-stop color horizontally × alpha fade vertically"
// as one gradient, so multi-color fills composite the two on an offscreen canvas
// sized to the chart: paint the horizontal color run, then mask it with a
// vertical alpha ramp via destination-in. Regenerated on resize (patterns anchor
// to the renderer's origin at natural pixel size).
function gradientFillTexture(
  slots: string[],
  width: number,
  height: number,
  reverse: boolean,
): HTMLCanvasElement | null {
  if (typeof document === "undefined" || width < 1 || height < 1) return null;

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width);
  canvas.height = Math.ceil(height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const colors = ctx.createLinearGradient(0, 0, canvas.width, 0);
  slots.forEach((color, i) => colors.addColorStop(i / (slots.length - 1), color));
  ctx.fillStyle = colors;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const fade = ctx.createLinearGradient(0, 0, 0, canvas.height);
  fade.addColorStop(0, `rgba(0, 0, 0, ${reverse ? 0 : 0.1})`);
  fade.addColorStop(1, `rgba(0, 0, 0, ${reverse ? 0.1 : 0})`);
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return canvas;
}

// Resolves the area fill for a variant into an ECharts color value. `size` is the
// full renderer size, used to bake 2D gradients for multi-color series.
function fillPaint(
  variant: AreaVariant,
  showUnselected: boolean,
  slots: string[],
  size: { width: number; height: number },
): string | echarts.graphic.LinearGradient | ImagePatternObject {
  const base = slots[0] ?? "rgba(120, 120, 120, 1)";
  const multi = slots.length > 1;

  // A non-selected area in a clickable chart recedes as a 45° stripe texture.
  if (showUnselected) {
    return patternFill("stripe", base) ?? withAlpha(base, 0.1);
  }

  switch (variant) {
    case "gradient":
    case "gradient-reverse": {
      const reverse = variant === "gradient-reverse";
      if (multi) {
        const texture = gradientFillTexture(slots, size.width, size.height, reverse);
        if (texture) return { image: texture, repeat: "no-repeat" };
      }
      return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: withAlpha(base, reverse ? 0 : 0.1) },
        { offset: 1, color: withAlpha(base, reverse ? 0.1 : 0) },
      ]);
    }
    case "solid": {
      // Uniform alpha, so the horizontal color run survives as one gradient.
      if (multi) {
        return new echarts.graphic.LinearGradient(
          0,
          0,
          1,
          0,
          slots.map((color, i) => ({
            offset: i / (slots.length - 1),
            color: withAlpha(color, 0.1),
          })),
        );
      }
      return withAlpha(base, 0.1);
    }
    case "dotted":
    case "lines":
    case "hatched":
      return patternFill(variant, base) ?? withAlpha(base, 0.1);
    default:
      return withAlpha(base, 0.1);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Curve mapping — linear → straight, step → step:"end", everything else → smooth.
// ─────────────────────────────────────────────────────────────────────────────

function curveConfig(curveType: CurveType): { smooth: boolean; step: "middle" | false } {
  // Recharts "step" is d3's curveStep: the transition happens at the MIDPOINT
  // between points, so each dot sits centered on its plateau.
  if (curveType === "step") return { smooth: false, step: "middle" };
  if (curveType === "linear") return { smooth: false, step: false };
  return { smooth: true, step: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// Selection opacities (§4.3) — dims a series only when another one is selected.
// ─────────────────────────────────────────────────────────────────────────────

function getOpacity(selected: string | null, key: string) {
  if (selected === null || selected === key) return { fill: 0.8, stroke: 1, dot: 1 };
  return { fill: 0.1, stroke: 0.3, dot: 0.3 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton helpers
// ─────────────────────────────────────────────────────────────────────────────

// Skeleton data as a smooth random walk in a comfortable band — reads like a
// resting chart instead of raw noise spikes.
function getLoadingData(points: number): number[] {
  const rows: number[] = [];
  let value = 30 + Math.random() * 20;
  for (let i = 0; i < points; i++) {
    value = Math.min(58, Math.max(16, value + (Math.random() - 0.5) * 16));
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
// Option builders — pure functions from a snapshot context to ECharts option
// fragments. The component reads its refs and renderer size ONCE per build into
// this context; nothing below touches React state or the chart instance, so
// each fragment can be reasoned about (and tested) in isolation.
// ─────────────────────────────────────────────────────────────────────────────

type OptionBuildContext = {
  data: Record<string, unknown>[];
  config: ChartConfig;
  areas: AreaSeriesConfig[];
  seriesKeys: string[];
  curveType: CurveType;
  isStacked: boolean;
  isExpanded: boolean;
  selectedDataKey: string | null;
  hasSelection: boolean;
  showGrid: boolean;
  xAxisSlot: XAxisSlot;
  yAxisSlot: YAxisSlot;
  tooltipSlot: TooltipSlot;
  legendSlot: LegendSlot;
  isLoading: boolean;
  loadingData: () => number[];
  showBrush: boolean;
  brushHeight: number;
  enableHoverHighlight: boolean;
  resolved: ResolvedColors;
  rendererSize: { width: number; height: number }; // 2D gradient textures bake at renderer size
  categories: string[];
  brushRange: BrushRange; // zoom window carried through rebuilds
  getHoveredKey: () => string | null; // read per tooltip render — hover never repushes the option
};

// Grid insets plus the footer band reserved for the brush. ECharts 6 contains
// axis labels automatically (the legacy `containLabel` flag now only triggers a
// deprecation warning).
function buildChartLayout({ legendSlot, xAxisSlot, showBrush, brushHeight }: OptionBuildContext): {
  grid: GridComponentOption;
  brushBottom: number;
} {
  const legendTop = legendSlot.present && legendSlot.verticalAlign === "top";
  const legendBottom = legendSlot.present && legendSlot.verticalAlign === "bottom";
  // Clearance covers the x-axis labels plus the same breathing room the
  // Recharts twin leaves between them and the brush. An x-axis TITLE renders
  // below the labels (nameGap), so it needs its own band above the brush frame.
  const brushGap = showBrush ? brushHeight + 30 + (xAxisSlot.label ? 22 : 0) : 0;

  return {
    grid: {
      left: 8,
      right: 8,
      top: legendTop ? 42 : 16,
      bottom: 8 + brushGap + (legendBottom ? 34 : 0),
    },
    brushBottom: legendBottom ? 34 : 6,
  };
}

function buildMainAxes(ctx: OptionBuildContext): { xAxis: XAxisOption; yAxis: YAxisOption } {
  const { xAxisSlot, yAxisSlot, showGrid, isLoading, isExpanded, categories, loadingData } = ctx;
  const { tokens } = ctx.resolved;

  const axisLabelColor = tokens.mutedForeground;
  const splitLineColor = withAlpha(tokens.border, GRID_LINE_OPACITY);
  // Gridline gray as an opaque color — see flattenColor.
  const tickDotColor = flattenColor(splitLineColor, tokens.background);

  const xTickFormatter = xAxisSlot.tickFormatter;
  const yTickFormatter = yAxisSlot.tickFormatter;

  const xAxis: XAxisOption = {
    type: "category",
    boundaryGap: false,
    show: true,
    data: isLoading ? loadingData().map((_, i) => i) : categories,
    // Axis title — same size/color as the tick labels, pushed clear of them.
    name: isLoading ? undefined : xAxisSlot.label,
    nameLocation: "middle",
    nameGap: 30,
    nameTextStyle: { color: axisLabelColor, fontSize: 10 },
    axisLine: { show: false },
    // Tick DOTS: a near-zero-length tick whose round caps form a true circle,
    // in the gridline gray (flattened opaque so the caps don't stack).
    axisTick: {
      show: !isLoading && xAxisSlot.present,
      length: 0.5,
      lineStyle: { color: tickDotColor, width: 3, cap: "round" },
    },
    splitLine: { show: false },
    axisLabel: {
      show: !isLoading && xAxisSlot.present,
      color: axisLabelColor,
      fontSize: 10,
      margin: 8,
      formatter: xTickFormatter
        ? (value: string, index: number) => xTickFormatter(value, index)
        : undefined,
    },
  };

  // An ECharts axis with `show: false` hides its splitLines too, but Recharts'
  // <CartesianGrid> draws with or without a visible <YAxis>. Keep the axis on
  // whenever <Grid/> is present and gate the LABELS on <YAxis/> instead.
  const yAxis: YAxisOption = {
    type: "value",
    show: yAxisSlot.present || showGrid,
    max: isExpanded ? 1 : undefined,
    // Axis title — rendered rotated alongside the tick labels, same styling.
    name: isLoading ? undefined : yAxisSlot.label,
    nameLocation: "middle",
    nameGap: 38,
    nameTextStyle: { color: axisLabelColor, fontSize: 10 },
    axisLine: { show: false },
    // Same tick dots as the x-axis, beside each value label.
    axisTick: {
      show: yAxisSlot.present && !isLoading,
      length: 0.5,
      lineStyle: { color: tickDotColor, width: 3, cap: "round" },
    },
    splitLine: {
      // Hidden while loading — the skeleton floats on a clean canvas.
      show: showGrid && !isLoading,
      lineStyle: { color: splitLineColor, type: [3, 3] as [number, number], width: 1 },
    },
    axisLabel: {
      // Hidden while loading — skeleton values are meaningless, and the
      // Recharts YAxis unmounts during loading too.
      show: yAxisSlot.present && !isLoading,
      color: axisLabelColor,
      fontSize: 10,
      margin: 8,
      formatter: isExpanded
        ? (value: number) => `${Math.round(value * 100)}%`
        : yTickFormatter
          ? (value: number, index: number) => yTickFormatter(value, index)
          : undefined,
    },
  };

  return { xAxis, yAxis };
}

// Tooltip HTML builder, closed over the build context. `getHoveredKey` is read
// per invocation — ECharts calls the formatter at hover time, and syncing hover
// through an option push instead would reset the native blur state mid-hover.
function createTooltipFormatter(ctx: OptionBuildContext) {
  const { config, selectedDataKey, tooltipSlot, getHoveredKey } = ctx;

  return (params: unknown): string => {
    const rows = Array.isArray(params) ? params : [params];
    if (!rows.length) return "";

    const first = rows[0] as { axisValue?: string | number; name?: string };
    // Label shows the RAW axis value — matches ChartTooltipContent (no tick formatter).
    const axisValue = first.axisValue ?? first.name ?? "";
    const label = String(axisValue);

    const body = rows
      .map((param) => {
        const p = param as {
          seriesId?: string;
          seriesName?: string;
          value?: number | string;
        };
        // Internal series (the brush's mini chart, the loading skeleton) never
        // surface in the tooltip.
        if (String(p.seriesId ?? "").startsWith("__")) return "";
        const key = p.seriesId ?? p.seriesName ?? "";
        const item = config[key];
        const colorsCount = item ? getColorsCount(item) : 1;
        const labelText = typeof item?.label === "string" ? item.label : (p.seriesName ?? key);
        const hovered = getHoveredKey();
        const dimmed =
          (selectedDataKey != null && selectedDataKey !== key) ||
          (hovered != null && hovered !== key)
            ? " opacity-30"
            : "";
        const value =
          typeof p.value === "number" ? p.value.toLocaleString() : String(p.value ?? "");

        return tooltipRow({
          indicatorHtml: tooltipIndicatorHtml(key, colorsCount),
          labelText,
          valueText: value,
          dimmed,
        });
      })
      .join("");

    return tooltipShell({
      label,
      body,
      roundness: tooltipSlot.roundness,
      variant: tooltipSlot.variant,
    });
  };
}

function buildTooltipOption(ctx: OptionBuildContext): TooltipComponentOption {
  const { tooltipSlot, isLoading } = ctx;
  const { tokens } = ctx.resolved;

  return {
    ...tooltipBaseOption({
      present: tooltipSlot.present && !isLoading,
      cursor: tooltipSlot.cursor,
      tokens,
      position: tooltipSlot.position,
      axisPointerColor: withAlpha(tokens.border, AXIS_POINTER_OPACITY),
      strokeWidth: STROKE_WIDTH,
    }),
    formatter: createTooltipFormatter(ctx),
  };
}

// ── Brush — the evil-brush look, canvas-style: a real mini chart of the full
// data in a second grid, with a transparent slider dataZoom laid over it. Both
// zoom entries target only the MAIN x-axis, so the mini chart never filters
// itself. Only called when `showBrush` is set.
function buildBrushOption(
  ctx: OptionBuildContext,
  brushBottom: number,
): {
  miniGrid: GridComponentOption;
  miniXAxis: XAxisOption;
  miniYAxis: YAxisOption;
  miniSeries: LineSeriesOption[];
  dataZoom: DataZoomComponentOption[];
} {
  const { data, areas, curveType, isStacked, selectedDataKey, brushHeight, categories } = ctx;
  const { tokens } = ctx.resolved;

  const miniGrid: GridComponentOption = {
    left: 8,
    right: 8,
    bottom: brushBottom,
    height: brushHeight,
    // No visible axes here — opt out of label containment so the mini chart
    // spans the full brush frame.
    outerBoundsMode: "none",
  };

  const miniXAxis: XAxisOption = {
    type: "category",
    gridIndex: 1,
    boundaryGap: false,
    show: false,
    data: categories,
    axisPointer: { show: false },
  };

  const miniYAxis: YAxisOption = { type: "value", gridIndex: 1, show: false };

  const miniSeries: LineSeriesOption[] = areas.map((area) => {
    const key = area.dataKey;
    const base = (ctx.resolved.series[key] ?? [])[0] ?? "rgba(120, 120, 120, 1)";
    const curve = curveConfig(area.curveType ?? curveType);

    // The mini chart mirrors the click selection: unselected series recede
    // by the same ratios as the main plot.
    // Dim ratios normalize against the base opacities (stroke 1, fill 0.8).
    const opacity = getOpacity(selectedDataKey, key);
    const strokeDim = opacity.stroke;
    const fillDim = opacity.fill / 0.8;

    return {
      id: `__mini-${key}`,
      type: "line",
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: data.map((row) => Number(row[key]) || 0),
      stack: isStacked ? "__mini-total" : undefined,
      smooth: curve.smooth,
      step: curve.step,
      connectNulls: area.connectNulls,
      silent: true,
      showSymbol: false,
      emphasis: { disabled: true },
      tooltip: { show: false },
      lineStyle: { color: base, width: 1, opacity: BRUSH_STROKE_OPACITY * strokeDim },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: withAlpha(base, BRUSH_FILL_OPACITY * fillDim) },
          { offset: 1, color: withAlpha(base, 0) },
        ]),
      },
      z: 0,
    };
  });

  const dataZoom = buildBrushDataZoom({
    brushBottom,
    brushHeight,
    brushRange: ctx.brushRange,
    fillerColor: withAlpha(tokens.foreground, BRUSH_FILLER_OPACITY),
  });

  return { miniGrid, miniXAxis, miniYAxis, miniSeries, dataZoom };
}

// Loading skeleton — ONE gray wave regardless of declared areas (Recharts
// parity: its skeleton is a single LoadingArea), swept by the shimmer rAF.
function buildLoadingOption(
  ctx: OptionBuildContext,
  frame: { grid: GridComponentOption; xAxis: XAxisOption; yAxis: YAxisOption },
): EChartsOption {
  const { tokens } = ctx.resolved;
  const curve = curveConfig(ctx.curveType);

  return {
    animation: false,
    grid: frame.grid,
    xAxis: frame.xAxis,
    yAxis: frame.yAxis,
    tooltip: { show: false },
    series: [
      {
        id: "__loading",
        type: "line",
        data: ctx.loadingData(),
        smooth: curve.smooth,
        step: curve.step,
        showSymbol: false,
        silent: true,
        // Invisible until the first shimmer tick positions the clip window.
        lineStyle: { color: withAlpha(tokens.foreground, 0), width: 1 },
        areaStyle: { color: withAlpha(tokens.foreground, 0) },
        z: 1,
      },
    ],
  };
}

function buildAreaSeries(ctx: OptionBuildContext): LineSeriesOption[] {
  const {
    data,
    config,
    areas,
    seriesKeys,
    curveType,
    isStacked,
    isExpanded,
    selectedDataKey,
    hasSelection,
    enableHoverHighlight,
    resolved,
    rendererSize,
  } = ctx;

  // Optional per-row normalization for the expanded (100%) stack.
  const rowTotals = isExpanded
    ? data.map((row) => seriesKeys.reduce((sum, key) => sum + (Number(row[key]) || 0), 0))
    : [];

  return areas.map((area) => {
    const key = area.dataKey;
    const slots = resolved.series[key] ?? ["rgba(120, 120, 120, 1)"];
    const paint = seriesPaint(slots);
    const isSelected = selectedDataKey === key;
    const showUnselected = hasSelection && !isSelected;
    const opacity = getOpacity(selectedDataKey, key);
    const curve = curveConfig(area.curveType ?? curveType);

    const values = data.map((row, i) => {
      const value = Number(row[key]) || 0;
      if (!isExpanded) return value;
      const total = rowTotals[i];
      return total ? value / total : 0;
    });

    const restingDot = dotStyle(area.dotVariant, paint, resolved.tokens.background);
    const activeDot = dotStyle(area.activeDotVariant, paint, resolved.tokens.background);
    const restingVisible = area.dotVariant !== "none";
    const dotOpacity = opacity.dot;
    const multiColor = slots.length > 1;

    // Multi-color series tint each symbol with the gradient's color at its own
    // x-position (per-datum itemStyle), like the Recharts dots. The line/area
    // keep the full gradient.
    const dataPoints = !multiColor
      ? values
      : values.map((value, i) => {
          const t = values.length > 1 ? i / (values.length - 1) : 0;
          const pointColor = sampleGradient(slots, t);
          return {
            value,
            itemStyle: {
              ...dotItemStyle(
                restingVisible ? area.dotVariant : area.activeDotVariant,
                pointColor,
                resolved.tokens.background,
              ),
              opacity: dotOpacity,
            },
            emphasis: {
              itemStyle: {
                ...dotItemStyle(
                  area.activeDotVariant === "none" ? "default" : area.activeDotVariant,
                  pointColor,
                  resolved.tokens.background,
                ),
                opacity: 1,
              },
            },
          };
        });

    return {
      id: key,
      name: typeof config[key]?.label === "string" ? config[key]?.label : key,
      type: "line",
      data: dataPoints,
      stack: isStacked ? "total" : undefined,
      smooth: curve.smooth,
      step: curve.step,
      connectNulls: area.connectNulls,
      cursor: area.isClickable ? "pointer" : "default",
      // By default ECharts only fires mouse events on the symbols — this makes
      // the line AND the filled area clickable, like the Recharts <Area>.
      triggerLineEvent: area.isClickable,
      showSymbol: restingVisible,
      symbol: "circle",
      symbolSize: restingVisible ? restingDot.size : activeDot.size,
      z: isSelected ? 3 : hasSelection ? 1 : 2,
      lineStyle: {
        color: paint,
        width: STROKE_WIDTH,
        opacity: opacity.stroke,
        type: area.strokeVariant === "solid" ? "solid" : ([3, 3] as [number, number]),
        dashOffset: 0,
      },
      itemStyle: multiColor
        ? { opacity: dotOpacity }
        : {
            ...(restingVisible ? restingDot.itemStyle : activeDot.itemStyle),
            opacity: dotOpacity,
          },
      areaStyle: {
        color: fillPaint(area.variant, showUnselected, slots, rendererSize),
        opacity: opacity.fill,
      },
      emphasis: {
        // focus "series" blurs every other series in this grid while one is
        // hovered — the hover twin of the click selection. Suppressed entirely
        // while a series is click-selected: the selection dim owns the canvas,
        // so hover highlighting stops until the selection clears (the option
        // rebuilds on selection change, making this a build-time conditional).
        focus: enableHoverHighlight && !hasSelection ? "series" : "none",
        scale: restingVisible ? activeDot.size / Math.max(restingDot.size, 1) : 1,
        ...(multiColor ? {} : { itemStyle: { ...activeDot.itemStyle, opacity: 1 } }),
      },
      // Blur styling mirrors the click-selection dim (fill 0.1 / stroke 0.3 / dot 0.3).
      blur: {
        lineStyle: { opacity: 0.3 },
        areaStyle: { opacity: 0.1 },
        itemStyle: { opacity: 0.3 },
      },
    };
  });
}

// Per-series PLOTTED top value per category index — expanded normalization and
// stack accumulation applied — so pointer hit-testing can reason in data space.
function computePlottedTops(ctx: OptionBuildContext): Record<string, number[]> {
  const { data, areas, seriesKeys, isStacked, isExpanded } = ctx;
  const rowTotals = isExpanded
    ? data.map((row) => seriesKeys.reduce((sum, key) => sum + (Number(row[key]) || 0), 0))
    : [];
  const running = new Array(data.length).fill(0);
  const tops: Record<string, number[]> = {};
  for (const area of areas) {
    const key = area.dataKey;
    tops[key] = data.map((row, i) => {
      let value = Number(row[key]) || 0;
      if (isExpanded) value = rowTotals[i] ? value / rowTotals[i] : 0;
      return isStacked ? (running[i] += value) : value;
    });
  }
  return tops;
}

// Overlapping area polygons all contain the same pixel, so ECharts' native hit
// test lands on whichever series drew topmost — not the band the user SEES.
// Resolve the intended series geometrically: a plotted line within grab
// distance of the pointer wins outright; otherwise the point belongs to the
// nearest line ABOVE it (the boundary of the band the pointer is inside).
// Returns null when the pointer is outside the grid or above every line.
function resolveAreaAtPixel(
  chart: EChartsInstance,
  tops: Record<string, number[]>,
  keys: string[],
  x: number,
  y: number,
): string | null {
  if (keys.length < 2) return null;
  if (!chart.containPixel({ gridIndex: 0 }, [x, y])) return null;
  const [rawIndex] = chart.convertFromPixel({ gridIndex: 0 }, [x, y]);
  const index = Math.round(rawIndex);

  let nearest: string | null = null;
  let nearestDist = Infinity;
  let above: string | null = null;
  let abovePixelY = -Infinity;
  for (const key of keys) {
    const value = tops[key]?.[index];
    if (value === undefined) continue;
    const pixelY = chart.convertToPixel({ gridIndex: 0 }, [index, value])[1];
    const dist = Math.abs(pixelY - y);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = key;
    }
    // Pixel y grows downward: a line above the pointer has the larger pixelY
    // among those ≤ the pointer's.
    if (pixelY <= y && pixelY > abovePixelY) {
      abovePixelY = pixelY;
      above = key;
    }
  }
  return nearestDist <= 10 ? nearest : above;
}

// ─────────────────────────────────────────────────────────────────────────────
// Live imperative state — everything the ECharts event handlers, rAF loops, and
// theme/resize repushes read or write OUTSIDE the React render cycle, grouped in
// one ref-stable object so the whole imperative surface is visible at a glance.
// None of it is render output, which is exactly why it is not React state.
// ─────────────────────────────────────────────────────────────────────────────

type LiveState = {
  resolved: ResolvedColors | null; // colors read off the live DOM — feeds builds and rAF loops
  hoveredKey: string | null; // tooltip's view of hover — the legend's twin lives in React state
  hasRevealed: boolean; // the intro draw-in already played on this chart instance
  revealEndsAt: number; // performance.now() timestamp when the entrance settles
  loadingRows: number[] | null; // skeleton data, lazily rolled and re-rolled per shimmer sweep
  categories: string[]; // x labels of the last build, for the brush label pills
  dataLength: number; // row count, for the datazoom index math
  plottedTops: Record<string, number[]>; // per-series plotted line value per index, for pointer hit-testing
  brushRange: BrushRange; // live zoom window — carried through every rebuild
  brushGeom: BrushGeometry | null; // brush footer layout of the last build
  brushOverlay: BrushOverlayElements | null; // zrender elements, owned by syncBrushOverlay
  brushHover: { inside: boolean; left: boolean; right: boolean };
  // Latest callbacks/flags for the imperative ECharts event handlers.
  handlers: {
    onBrushChange?: (range: { startIndex: number; endIndex: number }) => void;
    onSelectionChange?: (key: string | null) => void;
    clickableKeys: Set<string>;
    selectedDataKey: string | null;
    brushFormatLabel?: (value: string, index: number) => string;
    seriesKeys: string[];
    enableHoverHighlight: boolean;
  };
  // Update-style re-push for paths that bypass React entirely (theme flips,
  // resizes) — set by the sync effect.
  repush: () => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apache ECharts port of the EvilCharts area chart, exposing a compound-as-config
 * API so its JSX reads identically to the Recharts twin. The root owns the data,
 * config, selection state, loading skeleton, intro reveal, and optional zoom
 * brush; every visual part — `<Area>`, `<XAxis>`, `<YAxis>`, `<Grid>`,
 * `<Tooltip>`, `<Legend>` — is composed as a declarative child that renders
 * nothing. The root walks those children by reference and drives a single
 * imperative ECharts instance. Fully self-contained: its only dependencies are
 * `react` and `echarts`.
 */
export function EChartsAreaChart<TData extends Record<string, unknown>>({
  data,
  config,
  xDataKey,
  className,
  curveType = "linear",
  stackType = "default",
  animation = true,
  animationType = "left-to-right",
  enableHoverHighlight = false,
  defaultSelectedDataKey = null,
  selectedDataKey: selectedDataKeyProp,
  onSelectionChange,
  isLoading = false,
  loadingPoints = LOADING_DEFAULT_POINTS,
  showBrush = false,
  brushHeight = 56,
  brushFormatLabel,
  onBrushChange,
  chartOptions,
  children,
}: EChartsAreaChartProps<TData>) {
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
    hoveredKey: null,
    hasRevealed: false,
    revealEndsAt: 0,
    loadingRows: null,
    categories: [],
    dataLength: 0,
    plottedTops: {},
    brushRange: { start: 0, end: 100 },
    brushGeom: null,
    brushOverlay: null,
    brushHover: { inside: false, left: false, right: false },
    handlers: {
      onBrushChange,
      onSelectionChange,
      clickableKeys: new Set<string>(),
      selectedDataKey: defaultSelectedDataKey,
      brushFormatLabel,
      seriesKeys: [],
      enableHoverHighlight,
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

  // Selection is controlled when the `selectedDataKey` prop is provided;
  // otherwise the internal state (seeded by defaultSelectedDataKey) drives it.
  const [internalSelectedKey, setSelectedDataKey] = useState<string | null>(defaultSelectedDataKey);
  const selectedDataKey =
    selectedDataKeyProp !== undefined ? selectedDataKeyProp : internalSelectedKey;

  // Hover-highlight mirrors into the legend (React state) and tooltip
  // (live.hoveredKey — its formatter runs on every hover, and pushing an option
  // to sync it would reset ECharts' blur state mid-hover).
  const [hoveredDataKey, setHoveredDataKey] = useState<string | null>(null);

  // ── Declarative config, collected from children by reference ─────────────────
  const collected = useMemo(() => collectConfig(children), [children]);
  const {
    areas,
    xAxis: xAxisSlot,
    yAxis: yAxisSlot,
    showGrid,
    tooltip: tooltipSlot,
    legend: legendSlot,
  } = collected;

  const seriesKeys = useMemo(() => areas.map((area) => area.dataKey), [areas]);

  // x category key: <XAxis dataKey> → root xDataKey → first data column no <Area> claims.
  const xCategoryKey = useMemo(() => {
    if (xAxisSlot.dataKey) return xAxisSlot.dataKey;
    if (xDataKey) return xDataKey as string;
    const firstRow = data[0];
    if (firstRow) {
      const claimed = new Set(seriesKeys);
      const found = Object.keys(firstRow).find((key) => !claimed.has(key));
      if (found) return found;
    }
    return "";
  }, [xAxisSlot.dataKey, xDataKey, data, seriesKeys]);

  // The intro draw-in follows the first area's setting, falling back to the root default.
  const effectiveAnimation = areas[0]?.animationType ?? animationType;

  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);

  const hasSelection = selectedDataKey !== null;
  const isExpanded = stackType === "expanded";
  const isStacked = stackType === "stacked" || isExpanded;

  // Which series may be clicked to toggle selection (consulted by the click handler).
  const clickableKeys = useMemo(
    () => new Set(areas.filter((area) => area.isClickable).map((area) => area.dataKey)),
    [areas],
  );

  // Refresh the handlers' snapshot of the latest callbacks/flags every render.
  live.handlers = {
    onBrushChange,
    onSelectionChange,
    clickableKeys,
    selectedDataKey,
    brushFormatLabel,
    seriesKeys,
    enableHoverHighlight,
  };
  live.dataLength = data.length;

  // Reads the CURRENT selection through live.handlers so the identity stays
  // stable for the init effect's click closure, and stays correct when the
  // selection is controlled from outside.
  const toggleSelection = useCallback(
    (key: string) => {
      const next = live.handlers.selectedDataKey === key ? null : key;
      // Making a selection hands the canvas to the selection dim — clear any
      // active hover highlight at that moment so it doesn't linger in the
      // legend/tooltip or fight the notMerge rebuild that follows.
      if (next !== null && live.hoveredKey !== null) {
        const previous = live.hoveredKey;
        live.hoveredKey = null;
        setHoveredDataKey(null);
        echartsRef.current?.dispatchAction({
          type: "downplay",
          seriesIndex: live.handlers.seriesKeys.indexOf(previous),
        });
      }
      setSelectedDataKey(next);
      live.handlers.onSelectionChange?.(next);
    },
    [live],
  );

  // Reposition the brush overlays from the live refs — safe to call from drag
  // events, hover tracking, and pushes alike, since it never touches setOption.
  const syncBrushOverlayNow = useCallback(() => {
    const chart = echartsRef.current;
    if (!chart) return;

    const geom = live.brushGeom;
    const tokens = live.resolved?.tokens;
    if (!geom || !tokens) {
      syncBrushOverlay(chart, live, null);
      return;
    }

    const range = live.brushRange;
    const categories = live.categories;
    const format = live.handlers.brushFormatLabel;
    const lastIndex = Math.max(categories.length - 1, 0);
    const startIndex = Math.round((range.start / 100) * lastIndex);
    const endIndex = Math.round((range.end / 100) * lastIndex);
    const labels =
      format && categories.length
        ? {
            start: format(categories[startIndex] ?? "", startIndex),
            end: format(categories[endIndex] ?? "", endIndex),
          }
        : null;

    syncBrushOverlay(chart, live, {
      range,
      geom,
      size: { width: chart.getWidth(), height: chart.getHeight() },
      tokens,
      labels,
      showLabels: live.brushHover.inside,
      hover: live.brushHover,
    });
  }, [live]);

  // ── Option builder ─────────────────────────────────────────────────────────
  // Thin orchestrator over the pure builders above: snapshot the imperative
  // surface (refs, renderer size) into an OptionBuildContext, then assemble.
  const buildOption = useCallback((): EChartsOption => {
    const resolved = live.resolved;
    if (!resolved) return {};

    const categories = data.map((row) => String(row[xCategoryKey]));
    live.categories = categories;

    const ctx: OptionBuildContext = {
      data,
      config,
      areas,
      seriesKeys,
      curveType,
      isStacked,
      isExpanded,
      selectedDataKey,
      hasSelection,
      showGrid,
      xAxisSlot,
      yAxisSlot,
      tooltipSlot,
      legendSlot,
      isLoading,
      loadingData,
      showBrush,
      brushHeight,
      enableHoverHighlight,
      resolved,
      rendererSize: {
        width: echartsRef.current?.getWidth() ?? mountRef.current?.clientWidth ?? 0,
        height: echartsRef.current?.getHeight() ?? mountRef.current?.clientHeight ?? 0,
      },
      categories,
      brushRange: live.brushRange,
      getHoveredKey: () => live.hoveredKey,
    };

    live.plottedTops = computePlottedTops(ctx);

    const { grid, brushBottom } = buildChartLayout(ctx);
    live.brushGeom = showBrush ? { bottom: brushBottom, height: brushHeight } : null;

    const { xAxis, yAxis } = buildMainAxes(ctx);

    if (isLoading) return buildLoadingOption(ctx, { grid, xAxis, yAxis });

    const brush = showBrush ? buildBrushOption(ctx, brushBottom) : null;

    return {
      animation: false,
      grid: brush ? [grid, brush.miniGrid] : grid,
      xAxis: brush ? [xAxis, brush.miniXAxis] : xAxis,
      yAxis: brush ? [yAxis, brush.miniYAxis] : yAxis,
      tooltip: buildTooltipOption(ctx),
      dataZoom: brush?.dataZoom,
      series: [...buildAreaSeries(ctx), ...(brush?.miniSeries ?? [])],
    };
  }, [
    live,
    data,
    config,
    areas,
    seriesKeys,
    xCategoryKey,
    curveType,
    isStacked,
    isExpanded,
    selectedDataKey,
    hasSelection,
    showGrid,
    xAxisSlot,
    yAxisSlot,
    tooltipSlot,
    legendSlot,
    isLoading,
    loadingData,
    showBrush,
    brushHeight,
    enableHoverHighlight,
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
      // no-op fire would land one frame into the intro and stomp the line's
      // reveal clip — only react when the renderer size actually changed.
      if (mount.clientWidth === chart.getWidth() && mount.clientHeight === chart.getHeight()) {
        return;
      }
      chart.resize();
      // 2D gradient textures are baked at renderer size — rebuild them to fit.
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
      const p = params as {
        seriesId?: string;
        seriesIndex?: number;
        event?: { offsetX?: number; offsetY?: number };
      };
      // Symbol clicks carry seriesId; area-polygon clicks (triggerLineEvent)
      // only carry seriesIndex — recover the key by position. Main series come
      // first in the series array, so the index maps directly.
      let id = p.seriesId ?? (typeof p.seriesIndex === "number" ? keys[p.seriesIndex] : undefined);
      // Overlapping polygons: the native hit is the topmost series, not the
      // band the pointer is visually inside — resolve geometrically.
      if (typeof p.event?.offsetX === "number" && typeof p.event?.offsetY === "number") {
        const resolved = resolveAreaAtPixel(
          chart,
          live.plottedTops,
          keys,
          p.event.offsetX,
          p.event.offsetY,
        );
        if (resolved) id = resolved;
      }
      if (typeof id === "string" && clickable.has(id)) toggleSelection(id);
    });

    // Hover-highlight is POINTER-driven, not series-mouseover-driven:
    // overlapping polygons would pin the native hover on the topmost series and
    // never re-fire while the pointer moves within it. A zrender mousemove
    // tracker resolves the visually-hovered band, drives the canvas emphasis
    // via dispatchAction, and mirrors into the HTML legend (React state) and
    // tooltip (live.hoveredKey — its formatter runs per pointer move).
    const applyHoverKey = (key: string | null) => {
      if (live.hoveredKey === key) return;
      const keys = live.handlers.seriesKeys;
      const previous = live.hoveredKey;
      live.hoveredKey = key;
      setHoveredDataKey(key);
      if (previous) chart.dispatchAction({ type: "downplay", seriesIndex: keys.indexOf(previous) });
      if (key) chart.dispatchAction({ type: "highlight", seriesIndex: keys.indexOf(key) });
    };
    const zrHover = chart.getZr();
    const onZrHoverMove = (event: { offsetX?: number; offsetY?: number }) => {
      if (!live.handlers.enableHoverHighlight) return;
      // A click selection owns the canvas dim — hover highlighting stops
      // entirely while one exists and resumes once it clears.
      if (live.handlers.selectedDataKey !== null) return;
      applyHoverKey(
        resolveAreaAtPixel(
          chart,
          live.plottedTops,
          live.handlers.seriesKeys,
          event.offsetX ?? -1,
          event.offsetY ?? -1,
        ),
      );
    };
    const onZrHoverOut = () => {
      if (live.handlers.enableHoverHighlight) applyHoverKey(null);
    };
    zrHover.on("mousemove", onZrHoverMove);
    zrHover.on("globalout", onZrHoverOut);

    // The native hover still emphasizes whichever element the pointer entered —
    // cancel it whenever it disagrees with the tracker's resolved key.
    chart.on("mouseover", (params) => {
      const { enableHoverHighlight: hoverOn, seriesKeys: keys } = live.handlers;
      if (!hoverOn) return;
      // While a selection is active, hover highlighting is disabled — never
      // dispatch emphasis/downplay so the selection dim is the only dimming.
      if (live.handlers.selectedDataKey !== null) return;
      const p = params as { seriesIndex?: number; componentType?: string };
      if (p.componentType !== "series" || typeof p.seriesIndex !== "number") return;
      const key = keys[p.seriesIndex];
      if (!key || key.startsWith("__")) return;
      if (key !== live.hoveredKey) {
        chart.dispatchAction({ type: "downplay", seriesIndex: p.seriesIndex });
        if (live.hoveredKey) {
          chart.dispatchAction({ type: "highlight", seriesIndex: keys.indexOf(live.hoveredKey) });
        }
      }
    });

    chart.on("datazoom", () => {
      const option = chart.getOption() as { dataZoom?: { start?: number; end?: number }[] };
      const zoom = option.dataZoom?.[0];
      if (!zoom) return;

      // Ride the selection — pure zrender updates, so the drag stays 1:1.
      live.brushRange = { start: zoom.start ?? 0, end: zoom.end ?? 100 };
      syncBrushOverlayNow();

      const { onBrushChange: onChange } = live.handlers;
      if (!onChange) return;
      const len = live.dataLength;
      const startIndex = Math.round(((zoom.start ?? 0) / 100) * (len - 1));
      const endIndex = Math.round(((zoom.end ?? 100) / 100) * (len - 1));
      onChange({ startIndex, endIndex });
    });

    // Hover tracking for the overlay: labels show while the pointer is over the
    // brush, and each pill brightens when the pointer is near its edge.
    const zr = chart.getZr();
    const applyHover = (next: { inside: boolean; left: boolean; right: boolean }) => {
      const prev = live.brushHover;
      if (prev.inside === next.inside && prev.left === next.left && prev.right === next.right) {
        return;
      }
      live.brushHover = next;
      syncBrushOverlayNow();
    };
    const onZrMove = (event: { offsetX?: number; offsetY?: number }) => {
      const geom = live.brushGeom;
      if (!geom) return;
      const x = event.offsetX ?? -1;
      const y = event.offsetY ?? -1;
      const top = chart.getHeight() - geom.bottom - geom.height;
      const inside = y >= top - 4 && y <= top + geom.height + 4;
      const trackLeft = 8;
      const trackWidth = Math.max(chart.getWidth() - 16, 1);
      const { start, end } = live.brushRange;
      const selectionLeft = trackLeft + (trackWidth * start) / 100;
      const selectionRight = trackLeft + (trackWidth * end) / 100;
      applyHover({
        inside,
        left: inside && Math.abs(x - selectionLeft) <= 8,
        right: inside && Math.abs(x - selectionRight) <= 8,
      });
    };
    const onZrOut = () => applyHover({ inside: false, left: false, right: false });
    zr.on("mousemove", onZrMove);
    zr.on("globalout", onZrOut);

    return () => {
      zrHover.off("mousemove", onZrHoverMove);
      zrHover.off("globalout", onZrHoverOut);
      zr.off("mousemove", onZrMove);
      zr.off("globalout", onZrOut);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      chart.dispose();
      echartsRef.current = null;
      // The overlay elements died with the zrender instance.
      live.brushOverlay = null;
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
      // Overlays live outside the option — reposition them after every push.
      syncBrushOverlayNow();
    };

    // Intro reveal — ECharts' native progressive draw, enabled only for the first
    // real render: the line traces in, dots pop up as its front passes. Every
    // later push (selection, theme, zoom) applies instantly, since notMerge would
    // otherwise replay the entrance on each of them. A loading cycle re-arms it:
    // the Recharts twin unmounts its <Area>s while loading and replays the intro
    // on remount, so data → loading → data draws in again here too.
    if (isLoading) live.hasRevealed = false;
    const shouldReveal = !live.hasRevealed && !isLoading;
    if (shouldReveal) live.hasRevealed = true;
    const revealEnabled =
      animation && shouldReveal && effectiveAnimation !== "none" && !shouldReduceMotion;
    if (revealEnabled) live.revealEndsAt = performance.now() + REVEAL_DURATION;
    push(revealEnabled);

    // Theme flips and resizes re-enter here without touching React: re-read the
    // tokens (the .dark class changed, or textures need renderer-sized rebakes)
    // and push an update-style option.
    live.repush = () => {
      live.resolved = resolveColors(container, config, seriesKeys);
      push(false);
    };
  }, [
    live,
    buildOption,
    chartOptions,
    isLoading,
    animation,
    effectiveAnimation,
    shouldReduceMotion,
    config,
    seriesKeys,
    syncBrushOverlayNow,
  ]);

  // ── Animated dashed stroke — rAF sweeps the dash offset while unselected ─────
  useEffect(() => {
    const chart = echartsRef.current;
    if (!chart || isLoading) return;
    const animatedKeys = areas
      .filter((area) => area.strokeVariant === "animated-dashed")
      .map((area) => area.dataKey);
    if (animatedKeys.length === 0 || hasSelection) return;

    let raf = 0;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    const begin = () => {
      const loopStart = performance.now();
      const tick = (now: number) => {
        const offset = -(((now - loopStart) / 1000) % 1) * 6; // 0 → -6 per second
        chart.setOption(
          { series: animatedKeys.map((id) => ({ id, lineStyle: { dashOffset: offset } })) },
          { silent: true, lazyUpdate: true },
        );
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    // Per-frame setOption churn fights the intro draw-in (each update pass
    // recomputes the reveal clip, crawling it to a standstill) — hold the dash
    // sweep until the entrance has finished.
    const delay = Math.max(0, live.revealEndsAt - performance.now());
    if (delay > 0) delayTimer = setTimeout(begin, delay + 50);
    else begin();

    return () => {
      if (delayTimer !== undefined) clearTimeout(delayTimer);
      cancelAnimationFrame(raf);
    };
  }, [live, areas, hasSelection, isLoading]);

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
      const foreground = live.resolved?.tokens.foreground ?? "rgba(120, 120, 120, 1)";
      // Sweep the clip window from fully off-screen left to fully off-screen
      // right, leaned 45°. The gradient uses ABSOLUTE pixel coordinates shared
      // by stroke and fill — bbox-relative coords put the window at different
      // positions for the line vs the area polygon (their bounding boxes
      // differ), which made the line trail the fill near the sweep's end.
      const w = chart.getWidth();
      const h = chart.getHeight();
      if (!w || !h) {
        raf = requestAnimationFrame(tick);
        return;
      }
      // Farthest plot corner projected onto the 45° axis — keeps the sweep
      // tight instead of dawdling off-plot at the end of each loop.
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
              data: loadingData(),
              lineStyle: { color: clip(LOADING_STROKE_OPACITY), width: 1 },
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
        ? { bottom: showBrush ? brushHeight + 16 : 12 }
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
          hoveredKey={hoveredDataKey}
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

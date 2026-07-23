"use client";

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
  flattenColor,
  getColorsCount,
  resolveColors,
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
import { LegendOverlay, type LegendVariant } from "@/registry/ui/echarts/legend";
import type { ComposeOption, ImagePatternObject } from "echarts/core";
import { BarChart, type BarSeriesOption } from "echarts/charts";
import { sampleGradient } from "@/registry/ui/echarts/dot";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import * as echarts from "echarts/core";

// Re-export the shared types that were previously declared inline here, so
// existing consumers/examples keep importing them from the chart module.
export type { ChartConfig, LegendVariant, TooltipPosition, TooltipRoundness, TooltipVariant };

// Modular registration keeps the bundle lean — only the pieces this chart needs.
// `DataZoomComponent` bundles both the slider (brush footer) and inside (wheel/drag)
// zoom. The brush's frame/handles/labels are raw zrender elements, not the
// graphic component — see syncBrushOverlay. No LineChart: the main plot, the
// loading skeleton, and the brush mini chart are ALL bar series.
echarts.use([BarChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

type EChartsInstance = ReturnType<typeof echarts.init>;

// The exact option surface this chart uses — bar series, grid, tooltip, and
// dataZoom, plus the axis options they pull in as dependencies. Narrower than
// echarts' full EChartsOption, so a misspelled key fails the compile instead of
// silently reaching setOption.
type EChartsOption = ComposeOption<
  BarSeriesOption | GridComponentOption | TooltipComponentOption | DataZoomComponentOption
>;

// Single-entry views of the composed option's array-or-single fields — the
// modular entry points don't export the axis option types directly.
type ArrayItem<T> = T extends readonly (infer U)[] ? U : T;
type XAxisOption = ArrayItem<NonNullable<EChartsOption["xAxis"]>>;
type YAxisOption = ArrayItem<NonNullable<EChartsOption["yAxis"]>>;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_BAR_RADIUS = 2;
const STROKE_WIDTH = 1; // buffer-bar outline width
const LOADING_ANIMATION_DURATION = 2000; // shimmer loop, in milliseconds
const BAR_GROW_DURATION = 500; // per-bar grow-in length, in milliseconds
const BAR_STAGGER = 50; // delay between consecutive bars in the reveal, in milliseconds
const LOADING_DEFAULT_BARS = 12;
// `revealEndsAt` marks when the intro grow-in finishes. The stripped-cap post-layout
// correction (a notMerge repush) waits for it so it never lands mid-entrance and
// stomps the grow — the same reason the area chart tracks this timestamp.
const SELECTION_DIM = 0.3; // opacity of an unselected series while a selection is active
const HOVER_BLUR = 0.3; // opacity of the non-hovered bars while hover-highlight is on
// Soft outer glow — the canvas analogue of the Recharts feGaussianBlur filter
// (stdDeviation 8, alpha 0.5). A generous shadowBlur keeps the halo soft with no
// hard rim; the shadowColor is sampled PER BAR so a multi-stop gradient series
// glows in its own colors across the plot instead of one flat tint.
const GLOW_BLUR = 18; // shadowBlur radius, in device-independent pixels
const GLOW_OPACITY = 0.65; // per-datum shadowColor alpha, × the sampled series color

// The `stripped` variant caps each bar with a small BRIGHT pill of CONSTANT pixel
// height (Recharts draws a fixed ~2px strip on top of a dimmed body, identical on
// tall and short bars). The cap is expressed PER DATUM as a fraction of that bar's
// own pixel height, so a fixed pixel height maps to a shrinking fraction as the bar
// grows — the fraction is derived at runtime from the measured value-axis
// pixels-per-unit (see measureValuePxPerUnit). A canvas gradient alone can't do
// this: its bright band is a fraction of the bounding box, so it would scale with
// bar length (the bug this replaced).
const STRIPPED_CAP_HEIGHT = 4; // bright cap height, in device-independent pixels
const STRIPPED_BODY_ALPHA = 0.2; // dimmed bar body below the cap, × series color
const STRIPPED_CAP_MAX_FRACTION = 0.85; // cap never swallows a whole (very short) bar
const STRIPPED_FALLBACK_FRACTION = 0.12; // used before the axis geometry is measured

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
const GRID_LINE_OPACITY = 1; // dashed value-axis split lines, × border alpha
// The skeleton is CLIPPED to a small sweeping window — only the bars inside it
// exist, everything outside is fully transparent, like a spotlight sliding across.
const LOADING_SHIMMER_MAX_OPACITY = 0.22; // gray bar fill inside the window, × foreground alpha
const LOADING_SHIMMER_BAND = 0.2; // window half-width, fraction of the 45° sweep axis
const LOADING_SHIMMER_FEATHER = 0.2; // eased edge softening of the clip window
const BRUSH_FILL_OPACITY = 0.5; // mini-chart bar fill
const BRUSH_FILLER_OPACITY = 0; // selected-range wash — evil-brush draws none

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type BarVariant =
  | "default"
  | "hatched"
  | "duotone"
  | "duotone-reverse"
  | "gradient"
  | "stripped";
export type StackType = "default" | "stacked" | "percent";
export type BarLayout = "vertical" | "horizontal";
export type BarAnimationType =
  | "none"
  | "left-to-right"
  | "right-to-left"
  | "center-out"
  | "edges-in";
// TooltipVariant, TooltipRoundness, LegendVariant, and ChartConfig now live in
// the shared @/registry/ui/echarts/* modules and are imported + re-exported at
// the top of this file.

export interface EChartsBarChartProps<TData extends Record<string, unknown>> {
  data: TData[]; // rows rendered by the chart
  config: ChartConfig; // series colors + labels
  xDataKey?: keyof TData & string; // category key — falls back to the axis dataKey / first free column
  className?: string; // extra classes for the chart container
  stackType?: StackType; // how multiple bars combine
  layout?: BarLayout; // orientation of the bars
  barRadius?: number; // default corner radius every <Bar> inherits
  animation?: boolean; // master switch for the intro grow-in — false renders instantly
  animationType?: BarAnimationType; // default grow-in order each <Bar> inherits
  barGap?: number; // gap between bars within the same category, in pixels
  barCategoryGap?: number; // gap between categories of bars, in pixels
  defaultSelectedDataKey?: string | null; // series selected on first render
  onSelectionChange?: (key: string | null) => void; // fires when the selected series changes
  isLoading?: boolean; // shows the animated loading skeleton
  loadingBars?: number; // number of bars in the loading skeleton
  showBrush?: boolean; // renders a zoom brush below the chart (vertical layout only)
  brushHeight?: number; // height of the brush preview in pixels
  brushFormatLabel?: (value: string, index: number) => string; // formats brush handle labels
  onBrushChange?: (range: { startIndex: number; endIndex: number }) => void; // brush range callback
  chartOptions?: Record<string, unknown>; // escape hatch merged over the built ECharts option
  children?: ReactNode; // declarative config — <Bar>, <XAxis>, <YAxis>, <Grid>, <Tooltip>, <Legend>
}

// ─────────────────────────────────────────────────────────────────────────────
// Composible parts — DECLARATIVE CONFIG. Every part renders `null`; the root
// walks `children` by reference (child.type === Bar, …) to collect its props.
// Presence semantics mirror the Recharts twin: omit a child and that part does
// not render. These are never mounted into the tree — they only carry props.
// ─────────────────────────────────────────────────────────────────────────────

export interface BarProps {
  dataKey: string; // series key — must exist on the data + config
  variant?: BarVariant; // fill style for this bar only
  radius?: number; // corner radius — falls back to the root barRadius
  animationType?: BarAnimationType; // grow-in order — falls back to the root animationType
  isClickable?: boolean; // lets this bar be selected by clicking it
  enableHoverHighlight?: boolean; // dims the other bars while one is hovered
  glowing?: boolean; // applies a soft outer glow to this bar
  bufferBar?: boolean; // renders the last data point as a hatched "buffer" bar
}

/**
 * A single bar series. Declares its own fill variant, radius, glow, buffer, and
 * clickability. Renders nothing — the root reads these props to build the
 * ECharts series.
 */
export const Bar: FC<BarProps> = () => null;

export interface XAxisProps {
  dataKey?: string; // category key — overrides the root xDataKey (vertical layout)
  // Category values are stringified, so the formatter always sees a string —
  // letting examples share `(value) => value.substring(0, 3)` with the Recharts twin.
  tickFormatter?: (value: string, index: number) => string; // formats x tick labels
  label?: string; // axis title, centered below the x-position tick labels
}

/**
 * The x-axis. Category axis in the default (vertical) layout, value axis when
 * `layout="horizontal"`. Presence shows its tick labels. Renders nothing.
 */
export const XAxis: FC<XAxisProps> = () => null;

export interface YAxisProps {
  dataKey?: string; // category key — overrides the root xDataKey (horizontal layout)
  tickFormatter?: (value: string, index: number) => string; // formats y tick labels
  label?: string; // axis title, rotated alongside the y-position tick labels
}

/**
 * The y-axis. Value axis in the default (vertical) layout, category axis when
 * `layout="horizontal"`. Presence shows its tick labels. Renders nothing.
 */
export const YAxis: FC<YAxisProps> = () => null;

/** Presence shows the dashed split lines on the value axis. Renders nothing. */
export const Grid: FC = () => null;

export interface TooltipProps {
  variant?: TooltipVariant; // visual style of the tooltip surface
  roundness?: TooltipRoundness; // border-radius of the tooltip
  defaultIndex?: number; // data index the tooltip shows by default, with no hover
  position?: TooltipPosition; // "variable" follows the pointer (default); "fixed" pins the tooltip near the top and only tracks the pointer's X
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
// option builder consumes.
// ─────────────────────────────────────────────────────────────────────────────

type BarSeriesConfig = {
  dataKey: string;
  variant: BarVariant;
  radius?: number;
  animationType?: BarAnimationType;
  isClickable: boolean;
  enableHoverHighlight: boolean;
  glowing: boolean;
  bufferBar: boolean;
};

type AxisSlot = {
  present: boolean;
  dataKey?: string;
  tickFormatter?: (value: string, index: number) => string;
  label?: string;
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

type CollectedConfig = {
  bars: BarSeriesConfig[];
  xAxis: AxisSlot;
  yAxis: AxisSlot;
  showGrid: boolean;
  tooltip: TooltipSlot;
  legend: LegendSlot;
};

function collectConfig(children: ReactNode): CollectedConfig {
  const bars: BarSeriesConfig[] = [];
  let xAxis: AxisSlot = { present: false };
  let yAxis: AxisSlot = { present: false };
  let showGrid = false;
  let tooltip: TooltipSlot = {
    present: false,
    variant: "default",
    roundness: "lg",
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

    if (type === Bar) {
      const props = child.props as BarProps;
      bars.push({
        dataKey: props.dataKey,
        variant: props.variant ?? "default",
        radius: props.radius,
        animationType: props.animationType,
        isClickable: props.isClickable ?? false,
        enableHoverHighlight: props.enableHoverHighlight ?? false,
        glowing: props.glowing ?? false,
        bufferBar: props.bufferBar ?? false,
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
        defaultIndex: props.defaultIndex,
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

  return { bars, xAxis, yAxis, showGrid, tooltip, legend };
}

// Color plumbing (ChartConfig, getColorsCount, distributeColors, buildChartCss,
// normalizeColor, withAlpha, ResolvedColors, resolveColors, flattenColor) plus
// the theme keys now live in @/registry/ui/echarts/chart and are imported at the
// top of this file.

// ─────────────────────────────────────────────────────────────────────────────
// Fill paints — the ECharts analogue of the Recharts bar fill variants. Unlike
// the area chart's fills (which run the color gradient HORIZONTALLY), a bar's
// base color gradient runs VERTICALLY top→bottom (Recharts `ColorGradient` uses
// x1=x2=0), so each bar shows the full multi-stop gradient in its own box.
// ─────────────────────────────────────────────────────────────────────────────

const GRAY = "rgba(120, 120, 120, 1)";

// sampleGradient (the color the series gradient shows at t ∈ [0, 1]) now lives in
// @/registry/ui/echarts/dot and is imported at the top of this file.

// Solid vertical top→bottom color for a series — a plain string when there is
// one color, else a vertical multi-stop LinearGradient in each bar's own box.
// The `default` variant paints from this at full alpha.
function solidVerticalPaint(
  slots: string[],
  alpha: number,
): string | echarts.graphic.LinearGradient {
  if (slots.length <= 1) {
    const base = slots[0] ?? GRAY;
    return alpha === 1 ? base : withAlpha(base, alpha);
  }
  const stops = slots.map((color, i) => ({
    offset: i / (slots.length - 1),
    color: withAlpha(color, alpha),
  }));
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, stops);
}

// The `gradient` variant: the vertical color gradient faded from solid at the
// top to clear at the bottom. Recharts masks with white@1 at 20% → white@0 at
// 90%, so the alpha holds full through the top fifth and vanishes by 90%.
function verticalFadePaint(slots: string[]): echarts.graphic.LinearGradient {
  const offsets = [0, 0.2, 0.45, 0.7, 0.9, 1];
  const alphaAt = (t: number) => (t <= 0.2 ? 1 : t >= 0.9 ? 0 : 1 - (t - 0.2) / 0.7);
  const stops = offsets.map((t) => ({
    offset: t,
    color: withAlpha(sampleGradient(slots, t), alphaAt(t)),
  }));
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, stops);
}

// The `duotone` family: a hard alpha split across the bar's short axis (its width
// for vertical bars, its height for horizontal). Recharts splits at 50% via an
// objectBoundingBox mask — exact for single-color series; multi-color duotone
// falls back to the base color (an accepted approximation, matching the twin's
// single-color examples).
function duotoneSplitPaint(
  base: string,
  leftAlpha: number,
  rightAlpha: number,
  isHorizontal: boolean,
): echarts.graphic.LinearGradient {
  const stops = [
    { offset: 0, color: withAlpha(base, leftAlpha) },
    { offset: 0.5, color: withAlpha(base, leftAlpha) },
    { offset: 0.5, color: withAlpha(base, rightAlpha) },
    { offset: 1, color: withAlpha(base, rightAlpha) },
  ];
  // Split across the cross-axis: horizontal (0→1 in x) for vertical bars, and
  // vertical (0→1 in y) for horizontal bars, so it always reads across the bar.
  return isHorizontal
    ? new echarts.graphic.LinearGradient(0, 0, 0, 1, stops)
    : new echarts.graphic.LinearGradient(1, 0, 0, 0, stops);
}

// The `stripped` variant: a small BRIGHT cap sitting on top of a dimmed (20%) body
// — the canvas twin of Recharts' fixed strip. The cap is baked into a per-datum
// vertical gradient whose bright band spans exactly `capFraction` of the bar
// (offset 0 = the tip). Because `capFraction` is passed in as
// STRIPPED_CAP_HEIGHT / barPixelHeight (see strippedCapFraction), the cap reads the
// SAME pixel height on every bar — the fraction shrinks as the bar grows. A hard
// two-stop edge (coincident offsets at `capFraction`) keeps the cap a crisp pill
// rather than a fade, and the bar's rounded top corners round the cap's top. The
// cap sits at the tip: the top for vertical bars, the value end (right) for
// horizontal.
function strippedDatumPaint(
  slots: string[],
  isHorizontal: boolean,
  capFraction: number,
): echarts.graphic.LinearGradient {
  const f = Math.min(Math.max(capFraction, 0), 1);
  const cap = withAlpha(sampleGradient(slots, 0), 1);
  const bodyTop = withAlpha(sampleGradient(slots, f), STRIPPED_BODY_ALPHA);
  const bodyEnd = withAlpha(sampleGradient(slots, 1), STRIPPED_BODY_ALPHA);
  const stops = [
    { offset: 0, color: cap },
    { offset: f, color: cap },
    { offset: f, color: bodyTop },
    { offset: 1, color: bodyEnd },
  ];
  // Tip at offset 0: top (y 0→1) for vertical bars, right (x 1→0) for horizontal.
  return isHorizontal
    ? new echarts.graphic.LinearGradient(1, 0, 0, 0, stops)
    : new echarts.graphic.LinearGradient(0, 0, 0, 1, stops);
}

// The gradient fraction that renders a STRIPPED_CAP_HEIGHT-pixel cap on a bar whose
// value-axis magnitude is `value`, given the measured pixels-per-unit. Falls back to
// a small constant before the coordinate system has been measured (the very first
// paint, corrected right after layout).
function strippedCapFraction(value: number, valuePxPerUnit: number | null): number {
  if (valuePxPerUnit == null) return STRIPPED_FALLBACK_FRACTION;
  const barPx = Math.abs(value) * valuePxPerUnit;
  if (!(barPx > 0)) return STRIPPED_FALLBACK_FRACTION;
  return Math.min(STRIPPED_CAP_HEIGHT / barPx, STRIPPED_CAP_MAX_FRACTION);
}

// Pixels per one value-axis unit, read straight off the live coordinate system.
// Returns null before the first layout (no coordinate system yet) — callers fall
// back then. Turns the stripped cap's fixed pixel height into a per-bar gradient
// fraction, so the cap stays constant as the value axis rescales on resize/zoom.
function measureValuePxPerUnit(chart: EChartsInstance, isHorizontal: boolean): number | null {
  const finder = isHorizontal ? { xAxisIndex: 0 } : { yAxisIndex: 0 };
  // convertToPixel throws before the first setOption (no coordinate system yet) and
  // whenever the value axis isn't laid out — treat any failure as "not measurable".
  try {
    const p0 = chart.convertToPixel(finder, 0);
    const p1 = chart.convertToPixel(finder, 1);
    if (typeof p0 !== "number" || typeof p1 !== "number") return null;
    const delta = Math.abs(p1 - p0);
    return Number.isFinite(delta) && delta > 0 ? delta : null;
  } catch {
    return null;
  }
}

// Tiling texture fills tinted with the series' first color. Stripes are drawn
// STRAIGHT (trivially seamless) and the pattern itself is rotated — zrender
// applies pattern transforms the same way ECharts decals do. Baking a diagonal
// into a square tile clips the stroke at the corners, which reads as periodic
// gaps once tiled. Tiles render at devicePixelRatio and scale back down so the
// texture stays crisp on retina canvases.
function patternFill(kind: "hatched" | "buffer", color: string): ImagePatternObject | null {
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

  if (kind === "hatched") {
    // Recharts hatched: the color shown at 0.3 everywhere, punched to full along
    // a 1.5px stripe every 5px, leaning -45°.
    size(5, 5);
    ctx.fillStyle = withAlpha(color, 0.3);
    ctx.fillRect(0, 0, 5, 5);
    ctx.fillStyle = withAlpha(color, 1);
    ctx.fillRect(0, 0, 1.5, 5);
    return pattern(-Math.PI / 4);
  }

  // buffer: bare diagonal lines on a transparent ground (no body fill), for the
  // last "projected" bar.
  size(5, 5);
  ctx.fillStyle = withAlpha(color, 1);
  ctx.fillRect(0, 0, 1, 5);
  return pattern(-Math.PI / 4);
}

// Resolves a bar variant into an ECharts fill for its series. `base` is the
// first color slot; `slots` the full vertical color run.
function barFillPaint(
  variant: BarVariant,
  slots: string[],
  isHorizontal: boolean,
): string | echarts.graphic.LinearGradient | ImagePatternObject {
  const base = slots[0] ?? GRAY;
  switch (variant) {
    case "gradient":
      return verticalFadePaint(slots);
    case "duotone":
      return duotoneSplitPaint(base, 0.4, 1, isHorizontal);
    case "duotone-reverse":
      return duotoneSplitPaint(base, 1, 0.4, isHorizontal);
    case "hatched":
      return patternFill("hatched", base) ?? solidVerticalPaint(slots, 1);
    case "stripped":
      // Series-level fallback only; buildBarSeries overrides every stripped datum
      // with its own fixed-pixel cap fraction.
      return strippedDatumPaint(slots, isHorizontal, STRIPPED_FALLBACK_FRACTION);
    default:
      return solidVerticalPaint(slots, 1);
  }
}

// Border radius per variant/layout. Non-stripped bars round every corner
// (Recharts passes a plain number); stripped rounds only the tip corners — the
// top for vertical bars, the right end for horizontal.
function barBorderRadius(
  radius: number,
  variant: BarVariant,
  isHorizontal: boolean,
): number | number[] {
  if (variant !== "stripped") return radius;
  // ECharts corner order: [top-left, top-right, bottom-right, bottom-left].
  return isHorizontal ? [0, radius, radius, 0] : [radius, radius, 0, 0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Selection + entrance helpers
// ─────────────────────────────────────────────────────────────────────────────

// A bar dims to SELECTION_DIM only when a DIFFERENT series is selected.
function selectionOpacity(selected: string | null, key: string): number {
  return selected === null || selected === key ? 1 : SELECTION_DIM;
}

// How many stagger steps a bar at `index` waits before it grows in — the order
// encoded by `animationType`. Bars are independent rectangles, so unlike the
// area chart's single left-to-right clip, the direction values are honored here
// via a per-datum `animationDelay`.
function barStaggerDelay(type: BarAnimationType, index: number, count: number): number {
  if (type === "none" || count <= 0) return 0;
  const last = count - 1;
  const center = last / 2;
  let step: number;
  switch (type) {
    case "right-to-left":
      step = last - index;
      break;
    case "center-out":
      step = Math.abs(index - center);
      break;
    case "edges-in":
      step = center - Math.abs(index - center);
      break;
    default: // left-to-right
      step = index;
  }
  return step * BAR_STAGGER;
}

// The brush overlay primitives (BrushRange, BrushGeometry, BrushOverlayElements,
// syncBrushOverlay) and the dataZoom builder (buildBrushDataZoom) now live in
// @/registry/ui/echarts/evil-brush and are imported at the top of this file. The
// tooltip shell/row/styling (roundnessClass, tooltipVariantClass,
// tooltipShell/tooltipRow/tooltipIndicatorHtml), the legend indicators
// (LegendIndicator/LegendOverlay + fill/outline styles), and indicatorBackground
// likewise live in the shared tooltip/legend/chart modules.

// ─────────────────────────────────────────────────────────────────────────────
// Option builders — pure functions from a snapshot context to ECharts option
// fragments. The component reads its refs ONCE per build into this context;
// nothing below touches React state or the chart instance, so each fragment can
// be reasoned about in isolation.
// ─────────────────────────────────────────────────────────────────────────────

type OptionBuildContext = {
  data: Record<string, unknown>[];
  config: ChartConfig;
  bars: BarSeriesConfig[];
  seriesKeys: string[];
  animationType: BarAnimationType;
  barRadius: number;
  isHorizontal: boolean;
  isStacked: boolean;
  isPercent: boolean;
  selectedDataKey: string | null;
  hasSelection: boolean;
  showGrid: boolean;
  // Category axis is x (vertical layout) or y (horizontal); value axis the other.
  categorySlot: AxisSlot;
  valueSlot: AxisSlot;
  tooltipSlot: TooltipSlot;
  legendSlot: LegendSlot;
  isLoading: boolean;
  loadingData: () => number[];
  showBrush: boolean;
  brushHeight: number;
  barGap?: number;
  barCategoryGap?: number;
  resolved: ResolvedColors;
  categories: string[];
  brushRange: BrushRange; // zoom window carried through rebuilds
  valuePxPerUnit: number | null; // measured value-axis pixels-per-unit (null pre-layout)
};

// Grid insets plus the footer band reserved for the brush. ECharts 6 contains
// axis labels automatically (the legacy `containLabel` flag now only triggers a
// deprecation warning).
function buildChartLayout({
  legendSlot,
  showBrush,
  brushHeight,
  isHorizontal,
  categorySlot,
  valueSlot,
}: OptionBuildContext): {
  grid: GridComponentOption;
  brushBottom: number;
} {
  const legendTop = legendSlot.present && legendSlot.verticalAlign === "top";
  const legendBottom = legendSlot.present && legendSlot.verticalAlign === "bottom";
  // Clearance covers the axis labels plus the same breathing room the Recharts
  // twin leaves between them and the brush. A bottom-axis TITLE renders below the
  // labels (nameGap), so it needs its own band above the brush frame. The brush
  // is vertical-layout only, where the bottom (x-position) axis is the category axis.
  const bottomAxisLabel = isHorizontal ? valueSlot.label : categorySlot.label;
  const brushGap = showBrush ? brushHeight + 30 + (bottomAxisLabel ? 22 : 0) : 0;

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

// The category + value axes, laid onto x/y per layout. Vertical bars → x is
// category, y is value; horizontal bars → x is value, y is category.
function buildMainAxes(ctx: OptionBuildContext): { xAxis: XAxisOption; yAxis: YAxisOption } {
  const {
    isHorizontal,
    showGrid,
    isLoading,
    isPercent,
    categories,
    loadingData,
    categorySlot,
    valueSlot,
  } = ctx;
  const { tokens } = ctx.resolved;

  const axisLabelColor = tokens.mutedForeground;
  const splitLineColor = withAlpha(tokens.border, GRID_LINE_OPACITY);
  // Gridline gray as an opaque color — see flattenColor.
  const tickDotColor = flattenColor(splitLineColor, tokens.background);
  const catData = isLoading ? loadingData().map((_, i) => i) : categories;
  const catFormatter = categorySlot.tickFormatter;
  const valFormatter = valueSlot.tickFormatter;

  // The axis title (name) follows the axis PART, not its category/value role: the
  // category axis wears whichever <XAxis>/<YAxis> child renders it per layout, and
  // its label sits at that child's physical position. nameGap is 30 for the bottom
  // (x-position) axis and 38 for the side (y-position) one, so it swaps with the
  // layout alongside the axisLabel styling.
  const categoryNameGap = isHorizontal ? 38 : 30;
  const valueNameGap = isHorizontal ? 30 : 38;

  // NOTE: these are left un-annotated so their inferred literal type stays free
  // of an axis-specific `position` — the layout swap below assigns the category
  // axis to y (and the value axis to x) for horizontal bars, and XAxisOption vs
  // YAxisOption disagree on `position`, so a fixed annotation would reject one
  // branch. `type` is pinned with `as const` to satisfy the axis-kind union.
  const categoryAxis = {
    type: "category" as const,
    // Bars sit BETWEEN ticks — the opposite of the area chart's boundaryGap:false.
    boundaryGap: true,
    show: true,
    // The Recharts YAxis lists its first category at the TOP; ECharts' y category
    // axis defaults to bottom-up, so flip it when the category axis is on y.
    inverse: isHorizontal,
    data: catData,
    // Axis title — same size/color as the tick labels, pushed clear of them. The
    // category axis carries the label of whichever <XAxis>/<YAxis> child renders it.
    name: isLoading ? undefined : categorySlot.label,
    nameLocation: "middle" as const,
    nameGap: categoryNameGap,
    nameTextStyle: { color: axisLabelColor, fontSize: 10 },
    axisLine: { show: false },
    // Tick DOTS: a near-zero-length tick whose round caps form a true circle, in
    // the gridline gray (flattened opaque so the caps don't stack).
    axisTick: {
      show: !isLoading && categorySlot.present,
      length: 0.5,
      lineStyle: { color: tickDotColor, width: 3, cap: "round" as const },
    },
    splitLine: { show: false },
    axisLabel: {
      show: !isLoading && categorySlot.present,
      color: axisLabelColor,
      fontSize: 10,
      margin: 8,
      formatter: catFormatter
        ? (value: string, index: number) => catFormatter(value, index)
        : undefined,
    },
  };

  // An ECharts axis with `show: false` hides its splitLines too, but Recharts'
  // <CartesianGrid> draws with or without a visible value axis. Keep the axis on
  // whenever <Grid/> is present and gate the LABELS on the slot instead.
  const valueAxis = {
    type: "value" as const,
    show: valueSlot.present || showGrid,
    max: isPercent ? 1 : undefined,
    // Axis title — same styling as the category axis; the value axis carries the
    // label of the other of the two <XAxis>/<YAxis> children.
    name: isLoading ? undefined : valueSlot.label,
    nameLocation: "middle" as const,
    nameGap: valueNameGap,
    nameTextStyle: { color: axisLabelColor, fontSize: 10 },
    axisLine: { show: false },
    // Same tick dots as the category axis, beside each value label.
    axisTick: {
      show: valueSlot.present && !isLoading,
      length: 0.5,
      lineStyle: { color: tickDotColor, width: 3, cap: "round" as const },
    },
    splitLine: {
      // Hidden while loading — the skeleton floats on a clean canvas.
      show: showGrid && !isLoading,
      lineStyle: { color: splitLineColor, type: [3, 3] as [number, number], width: 1 },
    },
    axisLabel: {
      // Hidden while loading — skeleton values are meaningless, and the Recharts
      // axes unmount during loading too.
      show: valueSlot.present && !isLoading,
      color: axisLabelColor,
      fontSize: 10,
      margin: 8,
      formatter: isPercent
        ? (value: number) => `${Math.round(value * 100)}%`
        : valFormatter
          ? (value: number, index: number) => valFormatter(String(value), index)
          : undefined,
    },
  };

  return isHorizontal
    ? { xAxis: valueAxis, yAxis: categoryAxis }
    : { xAxis: categoryAxis, yAxis: valueAxis };
}

// Tooltip HTML builder, closed over the build context. Dims by the click
// selection only — the Recharts twin passes `cursor={false}`, so there is no
// axis-pointer line and hover-highlight never touches the tooltip.
function createTooltipFormatter(ctx: OptionBuildContext) {
  const { config, selectedDataKey, tooltipSlot } = ctx;

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
        const dimmed = selectedDataKey != null && selectedDataKey !== key ? " opacity-30" : "";
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
      // The twin disables the cursor (`cursor={false}`) — no shadow, no line —
      // so the axisPointer color/width below go unused; only `position` applies.
      cursor: false,
      tokens,
      position: tooltipSlot.position,
      axisPointerColor: tokens.border,
      strokeWidth: STROKE_WIDTH,
    }),
    formatter: createTooltipFormatter(ctx),
  };
}

// ── Brush — the evil-brush "bar" look, canvas-style: a real mini chart of the
// full data in a second grid, with a transparent slider dataZoom laid over it.
// Both zoom entries target only the MAIN x-axis, so the mini chart never filters
// itself. Only called for the vertical layout, where the category axis is x.
function buildBrushOption(
  ctx: OptionBuildContext,
  brushBottom: number,
): {
  miniGrid: GridComponentOption;
  miniXAxis: XAxisOption;
  miniYAxis: YAxisOption;
  miniSeries: BarSeriesOption[];
  dataZoom: DataZoomComponentOption[];
} {
  const { data, bars, isStacked, selectedDataKey, hasSelection, brushHeight, categories } = ctx;
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
    boundaryGap: true,
    show: false,
    data: categories,
    axisPointer: { show: false },
  };

  const miniYAxis: YAxisOption = { type: "value", gridIndex: 1, show: false };

  const miniSeries: BarSeriesOption[] = bars.map((bar) => {
    const key = bar.dataKey;
    const base = (ctx.resolved.series[key] ?? [])[0] ?? GRAY;
    // The mini chart mirrors the click selection: unselected series recede.
    const dim = hasSelection && selectedDataKey !== key ? SELECTION_DIM : 1;

    return {
      id: `__mini-${key}`,
      type: "bar",
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: data.map((row) => Number(row[key]) || 0),
      stack: isStacked ? "__mini-total" : undefined,
      silent: true,
      barCategoryGap: "20%",
      emphasis: { disabled: true },
      tooltip: { show: false },
      itemStyle: { color: base, opacity: BRUSH_FILL_OPACITY * dim, borderRadius: 1 },
      z: 0,
      animation: false,
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

// Loading skeleton — ONE gray row of bars regardless of declared series (Recharts
// parity: its skeleton is a single LoadingBar), swept by the shimmer rAF.
function buildLoadingOption(
  ctx: OptionBuildContext,
  frame: { grid: GridComponentOption; xAxis: XAxisOption; yAxis: YAxisOption },
): EChartsOption {
  const { tokens } = ctx.resolved;

  return {
    animation: false,
    grid: frame.grid,
    xAxis: frame.xAxis,
    yAxis: frame.yAxis,
    tooltip: { show: false },
    series: [
      {
        id: "__loading",
        type: "bar",
        data: ctx.loadingData(),
        barCategoryGap: "30%",
        silent: true,
        // Invisible until the first shimmer tick positions the clip window.
        itemStyle: {
          color: withAlpha(tokens.foreground, 0),
          borderRadius: barBorderRadius(DEFAULT_BAR_RADIUS, "default", ctx.isHorizontal),
        },
        z: 1,
      },
    ],
  };
}

function buildBarSeries(ctx: OptionBuildContext): BarSeriesOption[] {
  const {
    data,
    config,
    bars,
    seriesKeys,
    animationType,
    isHorizontal,
    isStacked,
    isPercent,
    selectedDataKey,
    hasSelection,
    barGap,
    barCategoryGap,
    resolved,
  } = ctx;

  const lastIndex = data.length - 1;

  // Optional per-row normalization for the percent (100%) stack.
  const rowTotals = isPercent
    ? data.map((row) => seriesKeys.reduce((sum, key) => sum + (Number(row[key]) || 0), 0))
    : [];

  return bars.map((bar) => {
    const key = bar.dataKey;
    const slots = resolved.series[key] ?? [GRAY];
    const base = slots[0] ?? GRAY;
    const isSelected = selectedDataKey === key;
    const dim = selectionOpacity(selectedDataKey, key);
    const resolvedRadius = bar.radius ?? ctx.barRadius;
    const borderRadius = barBorderRadius(resolvedRadius, bar.variant, isHorizontal);
    const fill = barFillPaint(bar.variant, slots, isHorizontal);
    const barAnim = bar.animationType ?? animationType;
    const isStripped = bar.variant === "stripped";

    const values = data.map((row, i) => {
      const value = Number(row[key]) || 0;
      if (!isPercent) return value;
      const total = rowTotals[i];
      return total ? value / total : 0;
    });

    // Buffer bar: the last datum becomes a bare hatched rectangle with a
    // series-colored outline, marking projected/incomplete data.
    const bufferStyle = bar.bufferBar
      ? {
          color: patternFill("buffer", base) ?? "transparent",
          borderColor: base,
          borderWidth: STROKE_WIDTH,
          borderRadius,
        }
      : null;

    // Per-bar glow shadow — the shadowColor is sampled from the series gradient
    // at each bar's horizontal position, so a multi-stop series glows in its own
    // colors across the plot instead of one flat tint (a single shadowColor was
    // the bug). A canvas shape carries only one shadow, so the sample is per bar,
    // not within a bar; the wide, soft shadowBlur reads as the Recharts blur's
    // colored halo with no hard rim.
    const glowFor = bar.glowing
      ? (i: number) => ({
          shadowBlur: GLOW_BLUR,
          shadowColor: withAlpha(
            sampleGradient(slots, values.length > 1 ? i / (values.length - 1) : 0),
            GLOW_OPACITY,
          ),
        })
      : null;

    // Only wrap a datum in an object when it needs per-point overrides (stripped
    // cap, buffer tip, or glow); otherwise keep the bare number so the series
    // itemStyle applies untouched. Stripped and glow touch every datum; buffer only
    // the last one.
    const dataPoints =
      isStripped || glowFor || (bufferStyle && lastIndex >= 0)
        ? values.map((value, i) => {
            const isBuffer = !!bufferStyle && i === lastIndex;
            if (!isBuffer && !glowFor && !isStripped) return value;
            return {
              value,
              itemStyle: {
                // The stripped cap is per datum: its fixed pixel height becomes a
                // fraction of THIS bar's own height, so the cap is a constant pixel
                // height across bars. The buffer tip (bare hatched) still wins on
                // the last datum.
                ...(isStripped && !isBuffer
                  ? {
                      color: strippedDatumPaint(
                        slots,
                        isHorizontal,
                        strippedCapFraction(value, ctx.valuePxPerUnit),
                      ),
                    }
                  : {}),
                ...(isBuffer && bufferStyle ? bufferStyle : {}),
                ...(glowFor ? glowFor(i) : {}),
              },
            };
          })
        : values;

    return {
      id: key,
      name: typeof config[key]?.label === "string" ? config[key]?.label : key,
      type: "bar",
      data: dataPoints,
      stack: isStacked ? "total" : undefined,
      barGap,
      barCategoryGap,
      cursor: bar.isClickable ? "pointer" : "default",
      // Selected series ride on top; when a selection is active the rest sink below.
      z: isSelected ? 3 : hasSelection ? 1 : 2,
      itemStyle: {
        color: fill,
        borderRadius,
        opacity: dim,
        // The glow lives on each datum's itemStyle (per-bar sampled shadowColor),
        // not here — a single series-level shadowColor can't follow a gradient.
      },
      // Hover-highlight uses ECharts-native focus/blur: `self` keeps only the
      // hovered bar lit and dims every other, matching the twin's per-bar dim.
      // A click-selection OWNS the dim while it is active, so hover highlighting
      // switches off entirely whenever a selection exists (this option rebuilds on
      // every selection change, and the notMerge push clears any live blur) and
      // resumes once the selection clears. Otherwise emphasis is disabled so
      // hovering leaves the bar untouched.
      emphasis:
        bar.enableHoverHighlight && !hasSelection
          ? { focus: "self", blurScope: "coordinateSystem" }
          : { disabled: true },
      blur:
        bar.enableHoverHighlight && !hasSelection
          ? { itemStyle: { opacity: HOVER_BLUR } }
          : undefined,
      // The grow-in envelope. Only takes effect on the reveal push (top-level
      // `animation: true`); every later push sends `animation: false`, so the
      // per-datum stagger is dormant then.
      animationDuration: BAR_GROW_DURATION,
      animationEasing: "cubicOut",
      animationDelay: (idx: number) => barStaggerDelay(barAnim, idx, data.length),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Live imperative state — everything the ECharts event handlers, rAF loops, and
// theme/resize repushes read or write OUTSIDE the React render cycle, grouped in
// one ref-stable object. None of it is render output, which is exactly why it is
// not React state.
// ─────────────────────────────────────────────────────────────────────────────

type LiveState = {
  resolved: ResolvedColors | null; // colors read off the live DOM — feeds builds and rAF loops
  hasRevealed: boolean; // the intro grow-in already played on this chart instance
  revealEndsAt: number; // performance.now() the entrance settles — gates the stripped-cap correction
  valuePxPerUnit: number | null; // measured value-axis pixels-per-unit — sizes the stripped cap
  loadingRows: number[] | null; // skeleton data, lazily rolled and re-rolled per shimmer sweep
  categories: string[]; // x labels of the last build, for the brush label pills
  dataLength: number; // row count, for the datazoom index math
  brushRange: BrushRange; // live zoom window — carried through every rebuild
  brushGeom: BrushGeometry | null; // brush footer layout of the last build
  brushOverlay: BrushOverlayElements | null; // zrender elements, owned by syncBrushOverlay
  brushHover: { inside: boolean; left: boolean; right: boolean };
  // Latest callbacks/flags for the imperative ECharts event handlers.
  handlers: {
    onBrushChange?: (range: { startIndex: number; endIndex: number }) => void;
    clickableKeys: Set<string>;
    brushFormatLabel?: (value: string, index: number) => string;
    seriesKeys: string[];
    hasStripped: boolean; // any visible stripped bar → run the post-layout cap correction
    isHorizontal: boolean; // layout, for measuring the value axis in the finished handler
  };
  // Update-style re-push for paths that bypass React entirely (theme flips,
  // resizes) — set by the sync effect.
  repush: () => void;
  // Rebuilds ONLY the stripped bar series (fresh per-datum cap fractions) and
  // merges them with a silent lazyUpdate — never notMerge, so it leaves the
  // dataZoom drag anchor and the running entrance untouched. Set by the sync effect.
  patchStrippedCaps: () => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apache ECharts port of the EvilCharts bar chart, exposing a compound-as-config
 * API so its JSX reads identically to the Recharts twin. The root owns the data,
 * config, selection state, loading skeleton, intro grow-in, and optional zoom
 * brush; every visual part — `<Bar>`, `<XAxis>`, `<YAxis>`, `<Grid>`,
 * `<Tooltip>`, `<Legend>` — is composed as a declarative child that renders
 * nothing. The root walks those children by reference and drives a single
 * imperative ECharts instance. Fully self-contained: its only dependencies are
 * `react`, `echarts`, and `motion`.
 */
export function EChartsBarChart<TData extends Record<string, unknown>>({
  data,
  config,
  xDataKey,
  className,
  stackType = "default",
  layout = "vertical",
  barRadius = DEFAULT_BAR_RADIUS,
  animation = true,
  animationType = "left-to-right",
  barGap,
  barCategoryGap,
  defaultSelectedDataKey = null,
  onSelectionChange,
  isLoading = false,
  loadingBars = LOADING_DEFAULT_BARS,
  showBrush = false,
  brushHeight = 56,
  brushFormatLabel,
  onBrushChange,
  chartOptions,
  children,
}: EChartsBarChartProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<EChartsInstance | null>(null);

  // The single imperative surface (see LiveState). `resolved` lives here rather
  // than in state: as state it forced an extra render pass and an effect whose
  // only job was to trigger the option push. The object identity is stable for
  // the component's lifetime.
  const live = useRef<LiveState>({
    resolved: null,
    hasRevealed: false,
    revealEndsAt: 0,
    valuePxPerUnit: null,
    loadingRows: null,
    categories: [],
    dataLength: 0,
    brushRange: { start: 0, end: 100 },
    brushGeom: null,
    brushOverlay: null,
    brushHover: { inside: false, left: false, right: false },
    handlers: {
      onBrushChange,
      clickableKeys: new Set<string>(),
      brushFormatLabel,
      seriesKeys: [],
      hasStripped: false,
      isHorizontal: false,
    },
    repush: () => {},
    patchStrippedCaps: () => {},
  }).current;

  // Skeleton rows roll lazily on first use — an impure useRef initializer would
  // re-roll Math.random() on every render.
  const loadingData = useCallback(
    () => (live.loadingRows ??= getLoadingBarData(loadingBars)),
    [live, loadingBars],
  );
  const shouldReduceMotion = useReducedMotion();

  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(defaultSelectedDataKey);

  // ── Declarative config, collected from children by reference ─────────────────
  const collected = useMemo(() => collectConfig(children), [children]);
  const {
    bars,
    xAxis: xAxisSlot,
    yAxis: yAxisSlot,
    showGrid,
    tooltip: tooltipSlot,
    legend: legendSlot,
  } = collected;

  const isHorizontal = layout === "horizontal";
  const isPercent = stackType === "percent";
  const isStacked = stackType === "stacked" || isPercent;

  // Category axis is x when vertical, y when horizontal; value axis the other.
  const categorySlot = isHorizontal ? yAxisSlot : xAxisSlot;
  const valueSlot = isHorizontal ? xAxisSlot : yAxisSlot;

  const seriesKeys = useMemo(() => bars.map((bar) => bar.dataKey), [bars]);

  // category key: category axis dataKey → root xDataKey → first data column no <Bar> claims.
  const categoryKey = useMemo(() => {
    if (categorySlot.dataKey) return categorySlot.dataKey;
    if (xDataKey) return xDataKey as string;
    const firstRow = data[0];
    if (firstRow) {
      const claimed = new Set(seriesKeys);
      const found = Object.keys(firstRow).find((key) => !claimed.has(key));
      if (found) return found;
    }
    return "";
  }, [categorySlot.dataKey, xDataKey, data, seriesKeys]);

  // The intro grow-in follows the first bar's setting, falling back to the root default.
  const effectiveAnimation = bars[0]?.animationType ?? animationType;

  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);

  const hasSelection = selectedDataKey !== null;

  // Which series may be clicked to toggle selection (consulted by the click handler).
  const clickableKeys = useMemo(
    () => new Set(bars.filter((bar) => bar.isClickable).map((bar) => bar.dataKey)),
    [bars],
  );

  // Any visible stripped bar? (never while loading — the skeleton has no stripped
  // series.) Gates the post-layout cap correction in the `finished` handler.
  const hasStrippedBars = !isLoading && bars.some((bar) => bar.variant === "stripped");

  // Refresh the handlers' snapshot of the latest callbacks/flags every render.
  live.handlers = {
    onBrushChange,
    clickableKeys,
    brushFormatLabel,
    seriesKeys,
    hasStripped: hasStrippedBars,
    isHorizontal,
  };
  live.dataLength = data.length;

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

  // The brush is meaningful only when the category axis is on x (vertical layout).
  const brushEnabled = showBrush && !isHorizontal;

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
  const buildOption = useCallback((): EChartsOption => {
    const resolved = live.resolved;
    if (!resolved) return {};

    const categories = data.map((row) => String(row[categoryKey]));
    live.categories = categories;

    const ctx: OptionBuildContext = {
      data,
      config,
      bars,
      seriesKeys,
      animationType,
      barRadius,
      isHorizontal,
      isStacked,
      isPercent,
      selectedDataKey,
      hasSelection,
      showGrid,
      categorySlot,
      valueSlot,
      tooltipSlot,
      legendSlot,
      isLoading,
      loadingData,
      showBrush: brushEnabled,
      brushHeight,
      barGap,
      barCategoryGap,
      resolved,
      categories,
      brushRange: live.brushRange,
      valuePxPerUnit: live.valuePxPerUnit,
    };

    const { grid, brushBottom } = buildChartLayout(ctx);
    live.brushGeom = brushEnabled ? { bottom: brushBottom, height: brushHeight } : null;

    const { xAxis, yAxis } = buildMainAxes(ctx);

    if (isLoading) return buildLoadingOption(ctx, { grid, xAxis, yAxis });

    const brush = brushEnabled ? buildBrushOption(ctx, brushBottom) : null;

    return {
      animation: false,
      grid: brush ? [grid, brush.miniGrid] : grid,
      xAxis: brush ? [xAxis, brush.miniXAxis] : xAxis,
      yAxis: brush ? [yAxis, brush.miniYAxis] : yAxis,
      tooltip: buildTooltipOption(ctx),
      dataZoom: brush?.dataZoom,
      series: [...buildBarSeries(ctx), ...(brush?.miniSeries ?? [])],
    };
  }, [
    live,
    data,
    config,
    bars,
    seriesKeys,
    categoryKey,
    animationType,
    barRadius,
    isHorizontal,
    isStacked,
    isPercent,
    selectedDataKey,
    hasSelection,
    showGrid,
    categorySlot,
    valueSlot,
    tooltipSlot,
    legendSlot,
    isLoading,
    loadingData,
    brushEnabled,
    brushHeight,
    barGap,
    barCategoryGap,
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
      // no-op fire would land one frame into the intro and stomp the grow-in —
      // only react when the renderer size actually changed.
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
      // Bar clicks carry seriesId; keep the seriesIndex fallback for safety. Main
      // series come first in the series array, so the index maps directly.
      const id =
        p.seriesId ?? (typeof p.seriesIndex === "number" ? keys[p.seriesIndex] : undefined);
      if (typeof id === "string" && clickable.has(id)) toggleSelection(id);
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

    // The stripped cap needs the value-axis pixel scale, which only exists AFTER a
    // layout. Once rendering settles — the first paint, a zoom that rescaled the
    // axis — measure it and, if it moved, correct the caps. The correction is a
    // SILENT series-only merge (patchStrippedCaps), so it can't reset a dataZoom
    // drag. Held off until the entrance finishes (revealEndsAt) so it never lands
    // mid-grow; guarded by an epsilon so a stable measurement doesn't loop.
    chart.on("finished", () => {
      const { hasStripped, isHorizontal: horiz } = live.handlers;
      if (!hasStripped || performance.now() < live.revealEndsAt) return;
      const measured = measureValuePxPerUnit(chart, horiz);
      if (measured == null) return;
      if (live.valuePxPerUnit != null && Math.abs(measured - live.valuePxPerUnit) < 0.5) return;
      live.valuePxPerUnit = measured;
      live.patchStrippedCaps();
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
      // Refresh the value-axis pixel scale before building, so stripped caps get the
      // right per-bar fraction on this same push (after a resize the coordinate
      // system is already updated here). Null before the very first push — the
      // `finished` handler corrects that first paint once the axis exists.
      const measured = measureValuePxPerUnit(chart, isHorizontal);
      if (measured != null) live.valuePxPerUnit = measured;

      const option = buildOption();
      const merged = chartOptions ? { ...option, ...chartOptions } : option;
      Object.assign(merged, {
        animation: withEntrance,
        animationDuration: BAR_GROW_DURATION,
        animationDurationUpdate: 0,
      });
      // chartOptions is an untyped escape hatch — the spread erases the option's
      // shape, so re-assert it. The only cast in the file.
      chart.setOption(merged as EChartsOption, { notMerge: true });
      // Mark when the entrance settles, so the stripped-cap correction holds off
      // until the grow finishes (0 = nothing animating, correct immediately).
      const maxStagger = data.length > 1 ? (data.length - 1) * BAR_STAGGER : 0;
      live.revealEndsAt = withEntrance ? performance.now() + BAR_GROW_DURATION + maxStagger : 0;
      // Overlays live outside the option — reposition them after every push.
      syncBrushOverlayNow();
    };

    // A stripped-cap correction that never disturbs the entrance or a brush drag:
    // rebuild only the stripped series with fresh per-datum cap fractions (the just
    // -measured live.valuePxPerUnit) and merge them silently.
    live.patchStrippedCaps = () => {
      const option = buildOption();
      const series = Array.isArray(option.series)
        ? option.series
        : option.series
          ? [option.series]
          : [];
      const strippedKeys = new Set(
        bars.filter((bar) => bar.variant === "stripped").map((bar) => bar.dataKey),
      );
      const patch = series.filter(
        (s): s is BarSeriesOption => typeof s?.id === "string" && strippedKeys.has(s.id),
      );
      if (patch.length) chart.setOption({ series: patch }, { silent: true, lazyUpdate: true });
    };

    // Intro grow-in — ECharts' native bar entrance (bars rise from the baseline),
    // staggered per-datum by animationType, enabled only for the first real
    // render: every later push (selection, theme, zoom) applies instantly, since
    // notMerge would otherwise replay the entrance on each. A loading cycle
    // re-arms it: the Recharts twin remounts its <Bar>s while loading and replays
    // the intro, so data → loading → data grows in again here too.
    if (isLoading) live.hasRevealed = false;
    const shouldReveal = !live.hasRevealed && !isLoading;
    if (shouldReveal) live.hasRevealed = true;
    const revealEnabled =
      animation && shouldReveal && effectiveAnimation !== "none" && !shouldReduceMotion;
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
    data.length,
    bars,
    isHorizontal,
    syncBrushOverlayNow,
  ]);

  // ── Default tooltip — show the tooltip at `defaultIndex` with no hover ────────
  // Recharts' `defaultIndex` keeps a tooltip open on load; ECharts has no static
  // equivalent, so dispatch `showTip` once the layout has settled.
  useEffect(() => {
    const chart = echartsRef.current;
    const index = tooltipSlot.defaultIndex;
    if (!chart || isLoading || !tooltipSlot.present || index == null) return;
    const timer = setTimeout(() => {
      chart.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex: index });
    }, 300);
    return () => clearTimeout(timer);
  }, [tooltipSlot.present, tooltipSlot.defaultIndex, isLoading, data.length, seriesKeys.length]);

  // ── Loading shimmer — rAF sweeps a bright band across the gray bars ──────────
  useEffect(() => {
    const chart = echartsRef.current;
    if (!chart || !isLoading) return;

    let raf = 0;
    let lastPhase = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const phase = ((((now - start) / LOADING_ANIMATION_DURATION) % 1) + 1) % 1;
      // Wrapped past 1 → the band is off-screen; swap in fresh random heights.
      if (phase < lastPhase) live.loadingRows = getLoadingBarData(loadingBars);
      lastPhase = phase;

      // Read tokens per frame, so a theme flip mid-loading retints the shimmer.
      const foreground = live.resolved?.tokens.foreground ?? GRAY;
      const w = chart.getWidth();
      const h = chart.getHeight();
      if (!w || !h) {
        raf = requestAnimationFrame(tick);
        return;
      }
      // Sweep the clip window from fully off-screen to fully off-screen, leaned
      // 45°. The gradient runs on ABSOLUTE pixel coordinates (0,0)→(w,w) shared
      // by every bar — the whole skeleton lives in one coordinate frame, so each
      // bar brightens as the diagonal band passes diagonally over it, the same
      // sweep language as the area chart's loading shimmer. `maxT` is the farthest
      // plot corner projected onto the 45° axis, keeping the sweep tight instead
      // of dawdling off-plot at the end of each loop.
      const maxT = (w + h) / (2 * w);
      const center = phase * (maxT + 2 * LOADING_SHIMMER_BAND) - LOADING_SHIMMER_BAND;
      const fill = new echarts.graphic.LinearGradient(
        0,
        0,
        w,
        w,
        shimmerWindowStops(center, foreground, LOADING_SHIMMER_MAX_OPACITY),
        true,
      );
      chart.setOption(
        { series: [{ id: "__loading", data: loadingData(), itemStyle: { color: fill } }] },
        { silent: true, lazyUpdate: true },
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, isLoading, loadingBars, loadingData]);

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
        ? { bottom: brushEnabled ? brushHeight + 16 : 12 }
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

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton helpers
// ─────────────────────────────────────────────────────────────────────────────

// Skeleton bar heights as a smooth random walk in a comfortable band — reads
// like a resting chart instead of raw noise spikes.
function getLoadingBarData(bars: number): number[] {
  const rows: number[] = [];
  let value = 40 + Math.random() * 25;
  for (let i = 0; i < bars; i++) {
    value = Math.min(85, Math.max(20, value + (Math.random() - 0.5) * 30));
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

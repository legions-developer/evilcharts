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
  type ComponentType,
  type CSSProperties,
  type FC,
  type ReactNode,
} from "react";
import {
  DataZoomComponent,
  GridComponent,
  TooltipComponent,
  type DataZoomComponentOption,
  type GridComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import { LineChart, type LineSeriesOption } from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

// Modular registration keeps the bundle lean — only the pieces this chart needs.
// `DataZoomComponent` bundles both the slider (brush footer) and inside (wheel/drag)
// zoom. The brush's frame/handles/labels are raw zrender elements, not the
// graphic component — see syncBrushOverlay. No GraphicComponent is registered.
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

// Dot marker paint — structurally assignable to BOTH the series-level and the
// per-datum itemStyle (the per-datum variant forbids callback color paints, so
// the broader LineSeriesOption["itemStyle"] cannot be reused for it).
type DotItemStyleOption = {
  color?: string | echarts.graphic.LinearGradient;
  borderColor?: string | echarts.graphic.LinearGradient;
  borderWidth?: number;
  opacity?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STROKE_WIDTH = 0.8;
const LOADING_ANIMATION_DURATION = 2000; // shimmer loop, in milliseconds
const REVEAL_DURATION = 1000; // intro draw-in length, in milliseconds
// NOTE: the intro draw-in runs ECharts' RAW default entrance animation. Custom
// easing was tried and abandoned in the area twin — ECharts hardcodes the
// line-entrance clip to linear and ignores animationEasing at every level.
const LOADING_DEFAULT_POINTS = 14;
// Buffer line: the last segment renders as this dash while the rest stays solid,
// echoing the Recharts twin's 4px dash / 3px gap forecast tail.
const BUFFER_DASH: [number, number] = [4, 3];

// <Line glowing> glow. Canvas has no SVG blur filter, so the glow is a stack of
// SILENT, symbol-free copies of the line laid UNDER the real one: same gradient
// paint, growing width, shrinking low opacity. Wide low-alpha gradient strokes
// pool into a soft halo that follows the series' own color along its whole
// length — the way the Recharts twin's feGaussianBlur wraps the entire line. A
// single shadowColor tint (the old approach) flattened a multi-stop gradient to
// one hue and barely reached past the dots. Widest & faintest last; `symbolPad`
// grows the glow disc under each visible dot so haloed markers bloom too.
const GLOW_LAYERS: { width: number; opacity: number; symbolPad: number }[] = [
  { width: 4, opacity: 0.3, symbolPad: 2 },
  { width: 9, opacity: 0.15, symbolPad: 7 },
  { width: 16, opacity: 0.07, symbolPad: 14 },
];

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
// The skeleton is CLIPPED to a small sweeping window — only the stroke section
// inside it exists, everything outside is fully transparent, like a clip-path
// sliding across the chart.
const LOADING_STROKE_OPACITY = 0.5; // outline inside the window, × foreground alpha
const LOADING_SHIMMER_BAND = 0.2; // window half-width, fraction of chart width
const LOADING_SHIMMER_FEATHER = 0.2; // eased edge softening of the clip window
const BRUSH_STROKE_OPACITY = 0.5; // mini-chart series stroke (evil-brush "line" variant)
const BRUSH_BORDER_OPACITY = 1; // brush frame, × border alpha (evil-brush uses the full token)
const BRUSH_FILLER_OPACITY = 0; // selected-range wash — evil-brush draws none

// Theme selectors mirror the repo's <ChartStyle>: light is the bare root, dark is `.dark`.
const THEMES = { light: "", dark: ".dark" } as const;
type ThemeKey = keyof typeof THEMES;
const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type StrokeVariant = "solid" | "dashed" | "animated-dashed";
export type LineAnimationType =
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
export type DotVariant = "none" | "default" | "border" | "colored-border";
export type TooltipVariant = "default" | "frosted-glass";
export type TooltipRoundness = "sm" | "md" | "lg" | "xl";
export type LegendVariant =
  | "square"
  | "circle"
  | "circle-outline"
  | "rounded-square"
  | "rounded-square-outline"
  | "vertical-bar"
  | "horizontal-bar";

// Require at least one theme key — identical constraint to the repo's ChartConfig.
type AtLeastOneThemeColor =
  | { light: string[]; dark?: string[] }
  | { light?: string[]; dark: string[] };

export type ChartConfig = Record<
  string,
  {
    label?: ReactNode;
    icon?: ComponentType;
    colors?: AtLeastOneThemeColor;
  }
>;

export interface EChartsLineChartProps<TData extends Record<string, unknown>> {
  data: TData[]; // rows rendered by the chart
  config: ChartConfig; // series colors + labels
  xDataKey?: keyof TData & string; // x category key — falls back to the <XAxis> dataKey / first free column
  className?: string; // extra classes for the chart container
  curveType?: CurveType; // default curve interpolation each <Line> inherits
  animation?: boolean; // master switch for the intro draw-in — false renders instantly
  animationType?: LineAnimationType; // default intro reveal (first <Line> overrides)
  enableHoverHighlight?: boolean; // hovering a series dims the others, like a temporary selection
  defaultSelectedDataKey?: string | null; // series selected on first render
  onSelectionChange?: (key: string | null) => void; // fires when the selected series changes
  isLoading?: boolean; // shows the animated loading skeleton
  loadingPoints?: number; // number of points in the loading skeleton
  showBrush?: boolean; // renders a zoom brush below the chart
  brushHeight?: number; // height of the brush preview in pixels
  brushFormatLabel?: (value: string, index: number) => string; // formats brush handle labels
  onBrushChange?: (range: { startIndex: number; endIndex: number }) => void; // brush range callback
  chartOptions?: Record<string, unknown>; // escape hatch merged over the built ECharts option
  children?: ReactNode; // declarative config — <Line>, <XAxis>, <Grid>, <Tooltip>, <Legend>, …
}

// ─────────────────────────────────────────────────────────────────────────────
// Composible parts — DECLARATIVE CONFIG. Every part renders `null`; the root
// walks `children` by reference (child.type === Line, …) to collect its props.
// Presence semantics mirror the Recharts twin: omit a child and that part does
// not render. These are never mounted into the tree — they only carry props.
// ─────────────────────────────────────────────────────────────────────────────

export interface LineProps {
  dataKey: string; // series key — must exist on the data + config
  strokeVariant?: StrokeVariant; // stroke style for this line
  curveType?: CurveType; // curve interpolation — falls back to the root curveType
  animationType?: LineAnimationType; // intro reveal — first line drives the wrapper wipe
  connectNulls?: boolean; // join segments across null/missing values
  isClickable?: boolean; // lets this line be selected by clicking it
  glowing?: boolean; // applies a soft outer glow to this line
  enableBufferLine?: boolean; // renders this line's last segment as a dashed buffer
  children?: ReactNode; // optional <Dot> and <ActiveDot> config
}

/**
 * A single line series. Declares its own stroke/curve/glow/clickability and,
 * optionally, resting/active point markers via composed <Dot> / <ActiveDot>.
 * Renders nothing — the root reads these props to build the ECharts series.
 */
export const Line: FC<LineProps> = () => null;

export interface DotProps {
  variant?: DotVariant; // visual style of the point marker
}

/** Declares the resting point marker for the enclosing <Line>. Renders nothing. */
export const Dot: FC<DotProps> = () => null;

/** Declares the hovered/active point marker for the enclosing <Line>. Renders nothing. */
export const ActiveDot: FC<DotProps> = () => null;

export interface XAxisProps {
  dataKey?: string; // x category key — overrides the root xDataKey
  // Category-axis values are always stringified, so the formatter sees a string —
  // letting examples share `(value) => value.substring(0, 3)` with the Recharts twin.
  tickFormatter?: (value: string, index: number) => string; // formats x tick labels
}

/** Presence shows the x-axis category labels. Renders nothing. */
export const XAxis: FC<XAxisProps> = () => null;

export interface YAxisProps {
  dataKey?: string; // reserved for parity with the Recharts twin
  tickFormatter?: (value: number, index: number) => string; // formats y tick labels
}

/** Presence shows the y value axis. Renders nothing. */
export const YAxis: FC<YAxisProps> = () => null;

/** Presence shows the dashed horizontal split lines. Renders nothing. */
export const Grid: FC = () => null;

export interface TooltipProps {
  variant?: TooltipVariant; // visual style of the tooltip surface
  roundness?: TooltipRoundness; // border-radius of the tooltip
  cursor?: boolean; // whether the vertical cursor line follows the pointer
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
// option builder consumes. <Dot> / <ActiveDot> are read from each <Line>'s own
// children; a missing dot child means that marker does not render.
// ─────────────────────────────────────────────────────────────────────────────

type LineSeriesConfig = {
  dataKey: string;
  strokeVariant: StrokeVariant;
  curveType?: CurveType;
  animationType?: LineAnimationType;
  connectNulls: boolean;
  isClickable: boolean;
  glowing: boolean;
  enableBufferLine: boolean;
  dotVariant: DotVariant; // "none" when no <Dot> child is present
  activeDotVariant: DotVariant; // "none" when no <ActiveDot> child is present
};

type XAxisSlot = {
  present: boolean;
  dataKey?: string;
  tickFormatter?: (value: string, index: number) => string;
};
type YAxisSlot = {
  present: boolean;
  dataKey?: string;
  tickFormatter?: (value: number, index: number) => string;
};
type TooltipSlot = {
  present: boolean;
  variant: TooltipVariant;
  roundness: TooltipRoundness;
  cursor: boolean;
};
type LegendSlot = {
  present: boolean;
  variant: LegendVariant;
  align: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  isClickable: boolean;
};

type CollectedConfig = {
  lines: LineSeriesConfig[];
  xAxis: XAxisSlot;
  yAxis: YAxisSlot;
  showGrid: boolean;
  tooltip: TooltipSlot;
  legend: LegendSlot;
};

function collectConfig(children: ReactNode): CollectedConfig {
  const lines: LineSeriesConfig[] = [];
  let xAxis: XAxisSlot = { present: false };
  let yAxis: YAxisSlot = { present: false };
  let showGrid = false;
  let tooltip: TooltipSlot = {
    present: false,
    variant: "default",
    roundness: "lg",
    cursor: true,
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

    if (type === Line) {
      const props = child.props as LineProps;
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
      lines.push({
        dataKey: props.dataKey,
        // The Recharts twin defaults a <Line> to a solid stroke (its <Area>
        // defaults to dashed — a divergence intentionally preserved here).
        strokeVariant: props.strokeVariant ?? "solid",
        curveType: props.curveType,
        animationType: props.animationType,
        connectNulls: props.connectNulls ?? false,
        isClickable: props.isClickable ?? false,
        glowing: props.glowing ?? false,
        enableBufferLine: props.enableBufferLine ?? false,
        dotVariant,
        activeDotVariant,
      });
    } else if (type === XAxis) {
      const props = child.props as XAxisProps;
      xAxis = { present: true, dataKey: props.dataKey, tickFormatter: props.tickFormatter };
    } else if (type === YAxis) {
      const props = child.props as YAxisProps;
      yAxis = { present: true, dataKey: props.dataKey, tickFormatter: props.tickFormatter };
    } else if (type === Grid) {
      showGrid = true;
    } else if (type === Tooltip) {
      const props = child.props as TooltipProps;
      tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
        cursor: props.cursor ?? true,
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

  return { lines, xAxis, yAxis, showGrid, tooltip, legend };
}

// ─────────────────────────────────────────────────────────────────────────────
// Color plumbing — replicated from the repo's <ChartStyle> so this file stays
// self-contained (no @/registry/ui imports).
// ─────────────────────────────────────────────────────────────────────────────

// Max slots a key needs = longest color array across themes (min 1). Both themes
// always emit the same number of `--color-{key}-{n}` vars.
function getColorsCount(item: ChartConfig[string]): number {
  if (!item.colors) return 1;
  const counts = THEME_KEYS.map((theme) => item.colors?.[theme]?.length ?? 0);
  return Math.max(...counts, 1);
}

// Distribute colors evenly across slots; extra slots go to the LAST color(s).
// 2 colors / 4 slots → [c0, c0, c1, c1]; 3 colors / 4 slots → [c0, c1, c2, c2].
function distributeColors(colors: string[], maxCount: number): string[] {
  const available = colors.length;
  if (available >= maxCount) return colors.slice(0, maxCount);

  const result: string[] = [];
  const baseSlots = Math.floor(maxCount / available);
  const extraSlots = maxCount % available;

  for (let i = 0; i < available; i++) {
    const isExtra = i >= available - extraSlots;
    const slots = baseSlots + (isExtra ? 1 : 0);
    for (let j = 0; j < slots; j++) result.push(colors[i]);
  }

  return result;
}

// Emits the same CSS <ChartStyle> would: `--color-{key}-{n}` scoped to
// `[data-chart={id}]` (light) and `.dark [data-chart={id}]` (dark).
function buildChartCss(id: string, config: ChartConfig): string {
  const colorConfig = Object.entries(config).filter(([, item]) => item.colors);
  if (!colorConfig.length) return "";

  const varsFor = (theme: ThemeKey) =>
    colorConfig
      .flatMap(([key, item]) => {
        const authored = item.colors?.[theme];
        if (!authored || authored.length === 0) return [];
        return distributeColors(authored, getColorsCount(item)).map(
          (color, index) => `  --color-${key}-${index}: ${color};`,
        );
      })
      .join("\n");

  return Object.entries(THEMES)
    .map(([theme, prefix]) => `${prefix} [data-chart=${id}] {\n${varsFor(theme as ThemeKey)}\n}`)
    .join("\n");
}

// A single reusable 1×1 canvas normalizes ANY CSS color (hex, named, oklch, …)
// to a concrete rgba string by painting it and reading the pixel back.
let normalizerCtx: CanvasRenderingContext2D | null = null;
function normalizeColor(value: string): string {
  const raw = value.trim();
  if (!raw || typeof document === "undefined") return raw;

  if (!normalizerCtx) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    normalizerCtx = canvas.getContext("2d", { willReadFrequently: true });
  }
  if (!normalizerCtx) return raw;

  normalizerCtx.clearRect(0, 0, 1, 1);
  normalizerCtx.fillStyle = "#000";
  normalizerCtx.fillStyle = raw; // invalid values leave the sentinel in place
  normalizerCtx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = normalizerCtx.getImageData(0, 0, 1, 1).data;
  return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
}

// Scales the alpha of a normalized `rgba(r, g, b, a)` string. Multiplying (not
// replacing) keeps translucent theme tokens honest: a border that is 10%-white
// at `withAlpha(border, 0.5)` lands at 5%, matching Tailwind's `border/50`.
function withAlpha(color: string, alpha: number): string {
  const match = color.match(/rgba?\(([^)]+)\)/);
  if (!match) return color;
  const [r, g, b, a] = match[1].split(",").map((p) => p.trim());
  const base = a === undefined ? 1 : Number.parseFloat(a) || 0;
  return `rgba(${r}, ${g}, ${b}, ${(base * alpha).toFixed(3)})`;
}

type ResolvedColors = {
  series: Record<string, string[]>; // normalized `--color-{key}-{n}` slots per key
  tokens: {
    mutedForeground: string;
    border: string;
    foreground: string;
    background: string;
  };
};

// Reads the injected CSS vars + theme tokens from the live DOM. Series slots come
// from `getComputedStyle` on the container; tokens are read off a throwaway probe
// carrying the matching Tailwind class (robust to the var naming a theme uses).
function resolveColors(
  container: HTMLElement,
  config: ChartConfig,
  seriesKeys: string[],
): ResolvedColors {
  const computed = getComputedStyle(container);
  const series: Record<string, string[]> = {};

  for (const key of seriesKeys) {
    const count = getColorsCount(config[key] ?? {});
    const slots: string[] = [];
    for (let n = 0; n < count; n++) {
      const raw = computed.getPropertyValue(`--color-${key}-${n}`).trim();
      slots.push(raw ? normalizeColor(raw) : "rgba(120, 120, 120, 1)");
    }
    series[key] = slots;
  }

  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;width:0;height:0;visibility:hidden;pointer-events:none;";
  container.appendChild(probe);
  const readToken = (className: string) => {
    probe.className = className;
    return normalizeColor(getComputedStyle(probe).color);
  };
  const tokens = {
    mutedForeground: readToken("text-muted-foreground"),
    border: readToken("text-border"),
    foreground: readToken("text-foreground"),
    background: readToken("text-background"),
  };
  container.removeChild(probe);

  return { series, tokens };
}

// Horizontal multi-stop color for a series — a solid string when there is only
// one color, else an evenly-distributed left→right LinearGradient. Reused for the
// stroke and the symbol fills.
function seriesPaint(slots: string[]): string | echarts.graphic.LinearGradient {
  if (slots.length <= 1) return slots[0] ?? "rgba(120, 120, 120, 1)";
  const stops = slots.map((color, i) => ({ offset: i / (slots.length - 1), color }));
  return new echarts.graphic.LinearGradient(0, 0, 1, 0, stops);
}

// ─────────────────────────────────────────────────────────────────────────────
// Dots — map the resting/active variants onto ECharts symbols.
// ─────────────────────────────────────────────────────────────────────────────

type DotStyle = { size: number; itemStyle: DotItemStyleOption };

function dotItemStyle(
  variant: DotVariant,
  paint: string | echarts.graphic.LinearGradient,
  background: string,
): DotItemStyleOption {
  switch (variant) {
    case "border":
      // Series-colored core with a thick background halo (Recharts r6 / sw5).
      return { color: paint, borderColor: background, borderWidth: 2 };
    case "colored-border":
      // Background-filled core with a thin colored ring (Recharts r3 / sw1).
      return { color: background, borderColor: paint, borderWidth: 1 };
    case "default":
      return { color: paint, borderWidth: 0 };
    default:
      return {};
  }
}

// Sizes mirror the Recharts markers: default r3, border r6 (mostly halo), and
// colored-border r3+ring. Flattening these to one size makes the hover ring read
// LARGER than a haloed resting dot — the opposite of the Recharts twin.
const DOT_SIZES: Record<DotVariant, number> = {
  none: 0,
  default: 6,
  border: 8,
  "colored-border": 6,
};

function dotStyle(
  variant: DotVariant,
  paint: string | echarts.graphic.LinearGradient,
  background: string,
): DotStyle {
  return { size: DOT_SIZES[variant], itemStyle: dotItemStyle(variant, paint, background) };
}

// The color the horizontal series gradient shows at position t ∈ [0, 1]. ECharts
// paints a gradient itemStyle relative to each symbol's own bounding box — a full
// rainbow inside every dot — while the Recharts dots clip a chart-wide gradient,
// so each takes the gradient's color at its x-position. Sampling reproduces that.
function sampleGradient(slots: string[], t: number): string {
  if (slots.length <= 1) return slots[0] ?? "rgba(120, 120, 120, 1)";

  const parse = (color: string) =>
    color
      .match(/rgba?\(([^)]+)\)/)?.[1]
      .split(",")
      .map(Number) ?? [120, 120, 120, 1];

  const position = t * (slots.length - 1);
  const index = Math.min(Math.floor(position), slots.length - 2);
  const fraction = position - index;
  const [r1, g1, b1, a1 = 1] = parse(slots[index]);
  const [r2, g2, b2, a2 = 1] = parse(slots[index + 1]);
  const lerp = (from: number, to: number) => from + (to - from) * fraction;

  return `rgba(${Math.round(lerp(r1, r2))}, ${Math.round(lerp(g1, g2))}, ${Math.round(lerp(b1, b2))}, ${lerp(a1, a2).toFixed(3)})`;
}

// Builds the stacked glow overlay series for one <Line glowing> (see
// GLOW_LAYERS). Each copy is silent, tooltip-less, and z-ordered beneath the real
// line, so the widening low-alpha gradient strokes read as a soft colored blur
// that tracks the series' gradient exactly like the stroke does. When the line
// shows resting dots, each copy also draws an oversized faint symbol — coloured
// per-datum via sampleGradient — so the markers bloom too. `selectionDim` fades
// the whole glow with its parent when another series is selected; the
// emphasis/blur styles let it focus/dim WITH its parent under
// enableHoverHighlight (the root dispatch-links these ids — see companionIdsByKey).
function buildGlowSeries(params: {
  key: string;
  paint: string | echarts.graphic.LinearGradient;
  slots: string[];
  values: (number | null)[];
  curve: { smooth: boolean; step: "middle" | false };
  connectNulls: boolean;
  z: number;
  selectionDim: number;
  dotSize: number;
}): LineSeriesOption[] {
  const { key, paint, slots, values, curve, connectNulls, z, selectionDim, dotSize } = params;
  const multiColor = slots.length > 1;
  const base = slots[0] ?? "rgba(120, 120, 120, 1)";
  const showDots = dotSize > 0;

  return GLOW_LAYERS.map((layer, i): LineSeriesOption => {
    const glowOpacity = layer.opacity * selectionDim;
    const blurOpacity = glowOpacity * 0.3;
    // Per-datum halo colours so a gradient glow tints each dot at its own
    // x-position, matching sampleGradient on the real dots.
    const glowData: LinePoint[] =
      !multiColor || !showDots
        ? values
        : values.map((value, idx): LinePoint => {
            if (value === null) return null;
            const t = values.length > 1 ? idx / (values.length - 1) : 0;
            const color = sampleGradient(slots, t);
            return {
              value,
              itemStyle: { color, opacity: glowOpacity },
              emphasis: { itemStyle: { color, opacity: glowOpacity } },
            };
          });

    return {
      id: `__glow-${i}-${key}`,
      type: "line",
      data: glowData,
      smooth: curve.smooth,
      step: curve.step,
      connectNulls,
      silent: true,
      showSymbol: showDots,
      symbol: "circle",
      symbolSize: showDots ? dotSize + layer.symbolPad : 0,
      tooltip: { show: false },
      z,
      lineStyle: {
        color: paint,
        width: layer.width,
        opacity: glowOpacity,
        cap: "round",
        join: "round",
      },
      itemStyle: multiColor ? { opacity: glowOpacity } : { color: base, opacity: glowOpacity },
      // Focus/dim WITH the parent line: on the parent's hover the root highlights
      // these ids (emphasis → normal glow); when another series is hovered the
      // parent's focus:"series" blurs these to a fainter still.
      emphasis: {
        focus: "none",
        scale: false,
        lineStyle: { opacity: glowOpacity },
        itemStyle: { opacity: glowOpacity },
      },
      blur: { lineStyle: { opacity: blurOpacity }, itemStyle: { opacity: blurOpacity } },
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Brush overlays — the evil-brush look: a rounded border around the SELECTED
// range, dimmed unselected sides, centered grip-dot handle pills, and range
// label pills below the frame. None of that is a dataZoom capability. They are
// raw zrender elements updated imperatively — routing them through setOption
// re-renders the dataZoom component mid-drag, resetting its drag anchor (the
// handle progressively lags the pointer).
// ─────────────────────────────────────────────────────────────────────────────

type BrushRange = { start: number; end: number };
type BrushGeometry = { bottom: number; height: number };

type BrushOverlayParams = {
  range: BrushRange;
  geom: BrushGeometry;
  size: { width: number; height: number };
  tokens: ResolvedColors["tokens"];
  labels: { start: string; end: string } | null;
  showLabels: boolean;
  hover: { left: boolean; right: boolean };
};

type ZrRect = InstanceType<typeof echarts.graphic.Rect>;
type ZrCircle = InstanceType<typeof echarts.graphic.Circle>;
type ZrText = InstanceType<typeof echarts.graphic.Text>;

type BrushOverlayElements = {
  dimLeft: ZrRect;
  dimRight: ZrRect;
  frame: ZrRect;
  pillLeft: ZrRect;
  pillRight: ZrRect;
  grips: ZrCircle[]; // 3 left + 3 right
  labelStart: ZrText;
  labelEnd: ZrText;
};

function syncBrushOverlay(
  chart: EChartsInstance,
  store: { brushOverlay: BrushOverlayElements | null },
  params: BrushOverlayParams | null,
) {
  const zr = chart.getZr();
  if (!zr) return;

  if (!params) {
    if (store.brushOverlay) {
      const { grips, ...rest } = store.brushOverlay;
      [...Object.values(rest), ...grips].forEach((el) => zr.remove(el));
      store.brushOverlay = null;
    }
    return;
  }

  if (!store.brushOverlay) {
    const rect = (z: number) => new echarts.graphic.Rect({ silent: true, z, shape: {} });
    const els: BrushOverlayElements = {
      dimLeft: rect(100),
      dimRight: rect(100),
      frame: rect(101),
      pillLeft: rect(102),
      pillRight: rect(102),
      grips: Array.from(
        { length: 6 },
        () => new echarts.graphic.Circle({ silent: true, z: 103, shape: {} }),
      ),
      labelStart: new echarts.graphic.Text({ silent: true, z: 104 }),
      labelEnd: new echarts.graphic.Text({ silent: true, z: 104 }),
    };
    const { grips, ...rest } = els;
    [...Object.values(rest), ...grips].forEach((el) => zr.add(el));
    store.brushOverlay = els;
  }

  const els = store.brushOverlay;
  const { range, geom, size, tokens, labels, showLabels, hover } = params;

  const trackLeft = 8;
  const trackRight = Math.max(size.width - 8, trackLeft);
  const trackWidth = trackRight - trackLeft;
  const top = size.height - geom.bottom - geom.height;
  const centerY = top + geom.height / 2;
  const selectionLeft = trackLeft + (trackWidth * range.start) / 100;
  const selectionRight = trackLeft + (trackWidth * range.end) / 100;

  const dimFill = withAlpha(tokens.background, 0.7);
  els.dimLeft.setShape({
    x: trackLeft,
    y: top,
    width: Math.max(selectionLeft - trackLeft, 0),
    height: geom.height,
  });
  els.dimLeft.setStyle({ fill: dimFill });
  els.dimRight.setShape({
    x: selectionRight,
    y: top,
    width: Math.max(trackRight - selectionRight, 0),
    height: geom.height,
  });
  els.dimRight.setStyle({ fill: dimFill });

  els.frame.setShape({
    x: selectionLeft,
    y: top,
    width: Math.max(selectionRight - selectionLeft, 0),
    height: geom.height,
    r: 6,
  });
  els.frame.setStyle({
    fill: "none",
    stroke: withAlpha(tokens.border, BRUSH_BORDER_OPACITY),
    lineWidth: 1,
  });

  // Handle pills: evil-brush's 6×16 grip pill, centered on the selection edge,
  // brightening to foreground on hover/drag.
  const pill = (el: ZrRect, x: number, hovered: boolean) => {
    el.setShape({ x: x - 3, y: centerY - 8, width: 6, height: 16, r: 3 });
    el.setStyle({ fill: hovered ? tokens.foreground : tokens.mutedForeground });
  };
  pill(els.pillLeft, selectionLeft, hover.left);
  pill(els.pillRight, selectionRight, hover.right);

  const gripFill = withAlpha(tokens.background, 0.7);
  [-4, 0, 4].forEach((offset, i) => {
    els.grips[i].setShape({ cx: selectionLeft, cy: centerY + offset, r: 1 });
    els.grips[i].setStyle({ fill: gripFill });
    els.grips[i + 3].setShape({ cx: selectionRight, cy: centerY + offset, r: 1 });
    els.grips[i + 3].setStyle({ fill: gripFill });
  });

  // Range label pills straddle the frame's bottom line — an overlay, so they
  // occupy no layout space; half the pill sits above the line, half below. Each
  // pill grows INWARD from its handle with a small inset, like the Recharts
  // labels, instead of hanging past the frame edge.
  const label = (el: ZrText, text: string, x: number, align: "left" | "right") => {
    el.setStyle({
      text,
      x: align === "left" ? Math.max(x + 6, trackLeft + 2) : Math.min(x - 6, trackRight - 2),
      y: top + geom.height,
      align,
      verticalAlign: "middle",
      fill: tokens.background,
      backgroundColor: tokens.foreground,
      padding: [2, 5],
      borderRadius: 4,
      font: "500 9px system-ui, sans-serif",
    });
    el.attr("invisible", !showLabels || !text);
  };
  label(els.labelStart, labels?.start ?? "", selectionLeft, "left");
  label(els.labelEnd, labels?.end ?? "", selectionRight, "right");
}

// ─────────────────────────────────────────────────────────────────────────────
// Curve mapping — linear → straight, step → step:"middle", everything else → smooth.
// ─────────────────────────────────────────────────────────────────────────────

function curveConfig(curveType: CurveType): { smooth: boolean; step: "middle" | false } {
  // Recharts "step" is d3's curveStep: the transition happens at the MIDPOINT
  // between points, so each dot sits centered on its plateau.
  if (curveType === "step") return { smooth: false, step: "middle" };
  if (curveType === "linear") return { smooth: false, step: false };
  return { smooth: true, step: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// Selection opacities — dims a series only when another one is selected. Lines
// have no fill, so only the stroke and dots carry an opacity here.
// ─────────────────────────────────────────────────────────────────────────────

function getOpacity(selected: string | null, key: string) {
  if (selected === null || selected === key) return { stroke: 1, dot: 1 };
  return { stroke: 0.3, dot: 0.3 };
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
// Tooltip / legend HTML — the tooltip DOM lives inside `[data-chart={id}]`, so the
// injected `--color-*` vars and Tailwind classes resolve directly (no color read).
// ─────────────────────────────────────────────────────────────────────────────

const roundnessClass: Record<TooltipRoundness, string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
};

const tooltipVariantClass: Record<TooltipVariant, string> = {
  default: "bg-background",
  "frosted-glass": "bg-background/70 backdrop-blur-sm",
};

// Solid var / gradient of vars for a series indicator — mirrors getIndicatorColorStyle.
function indicatorBackground(key: string, colorsCount: number): string {
  if (colorsCount <= 1) return `var(--color-${key}-0)`;
  const stops = Array.from({ length: colorsCount }, (_, i) => {
    const offset = (i / (colorsCount - 1)) * 100;
    return `var(--color-${key}-${i}) ${offset}%`;
  }).join(", ");
  return `linear-gradient(to right, ${stops})`;
}

// The `__buffer-` prefix marks the dashed forecast overlay of a buffer line; it
// carries the SAME key's value, so the tooltip recovers the key from it (see
// createTooltipFormatter). Every other `__`-prefixed series (mini chart, loading
// skeleton) is truly internal and never surfaces.
const BUFFER_PREFIX = "__buffer-";

// ─────────────────────────────────────────────────────────────────────────────
// Legend overlay (React) — replicates ChartLegendContent + its 7 indicators.
// ─────────────────────────────────────────────────────────────────────────────

function legendFillStyle(key: string, colorsCount: number): CSSProperties {
  if (colorsCount <= 1) return { backgroundColor: `var(--color-${key}-0)` };
  return { background: indicatorBackground(key, colorsCount) };
}

// Punches out the centre with a mask-composite so only the "border" shows —
// works with gradients and border-radius, unlike plain border-color.
function legendOutlineStyle(key: string, colorsCount: number): CSSProperties {
  const mask: CSSProperties = {
    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    WebkitMaskComposite: "xor",
    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    maskComposite: "exclude",
  };
  return { ...legendFillStyle(key, colorsCount), ...mask };
}

function LegendIndicator({
  variant,
  dataKey,
  colorsCount,
}: {
  variant: LegendVariant;
  dataKey: string;
  colorsCount: number;
}) {
  const fill = legendFillStyle(dataKey, colorsCount);
  const outline = legendOutlineStyle(dataKey, colorsCount);

  switch (variant) {
    case "square":
      return <div className="h-2 w-2 shrink-0" style={fill} />;
    case "circle":
      return <div className="h-2 w-2 shrink-0 rounded-full" style={fill} />;
    case "circle-outline":
      return <div className="h-2.5 w-2.5 shrink-0 rounded-full p-[1.5px]" style={outline} />;
    case "vertical-bar":
      return <div className="h-3 w-1 shrink-0 rounded-[2px]" style={fill} />;
    case "horizontal-bar":
      return <div className="h-1 w-3 shrink-0 rounded-[2px]" style={fill} />;
    case "rounded-square-outline":
      return <div className="h-2.5 w-2.5 shrink-0 rounded-[3px] p-[1.5px]" style={outline} />;
    case "rounded-square":
    default:
      return <div className="h-2 w-2 shrink-0 rounded-[2px]" style={fill} />;
  }
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
  lines: LineSeriesConfig[];
  curveType: CurveType;
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
  categories: string[];
  brushRange: BrushRange; // zoom window carried through rebuilds
  getHoveredKey: () => string | null; // read per tooltip render — hover never repushes the option
};

// Grid insets plus the footer band reserved for the brush. ECharts 6 contains
// axis labels automatically (the legacy `containLabel` flag now only triggers a
// deprecation warning).
function buildChartLayout({ legendSlot, showBrush, brushHeight }: OptionBuildContext): {
  grid: GridComponentOption;
  brushBottom: number;
} {
  const legendTop = legendSlot.present && legendSlot.verticalAlign === "top";
  const legendBottom = legendSlot.present && legendSlot.verticalAlign === "bottom";
  // Clearance covers the x-axis labels plus the same breathing room the
  // Recharts twin leaves between them and the brush.
  const brushGap = showBrush ? brushHeight + 30 : 0;

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
  const { xAxisSlot, yAxisSlot, showGrid, isLoading, categories, loadingData } = ctx;
  const { tokens } = ctx.resolved;

  const axisLabelColor = tokens.mutedForeground;
  const splitLineColor = withAlpha(tokens.border, GRID_LINE_OPACITY);

  const xTickFormatter = xAxisSlot.tickFormatter;
  const yTickFormatter = yAxisSlot.tickFormatter;

  const xAxis: XAxisOption = {
    type: "category",
    boundaryGap: false,
    show: true,
    data: isLoading ? loadingData().map((_, i) => i) : categories,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: {
      show: !isLoading && xAxisSlot.present,
      color: axisLabelColor,
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
    axisLine: { show: false },
    axisTick: { show: false },
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
      margin: 8,
      formatter: yTickFormatter
        ? (value: number, index: number) => yTickFormatter(value, index)
        : undefined,
    },
  };

  return { xAxis, yAxis };
}

// Tooltip HTML builder, closed over the build context. `trigger: "axis"` hands
// the formatter every series' value at the hovered x; buffer overlays and the
// mini/loading series are folded out here (see BUFFER_PREFIX).
function createTooltipFormatter(ctx: OptionBuildContext) {
  const { config, selectedDataKey, tooltipSlot, getHoveredKey } = ctx;

  return (params: unknown): string => {
    const rows = Array.isArray(params) ? params : [params];
    if (!rows.length) return "";

    const first = rows[0] as { axisValue?: string | number; name?: string };
    // Label shows the RAW axis value — matches ChartTooltipContent (no tick formatter).
    const axisValue = first.axisValue ?? first.name ?? "";
    const label = String(axisValue);

    // Dedupe by effective key: a buffer line contributes both its solid part
    // (id=key) and its dashed overlay (id=`__buffer-{key}`) at the shared
    // second-to-last point. Keep the first non-null value seen per key so the
    // final point (only the overlay has data there) still shows its number.
    const seen = new Set<string>();
    const body = rows
      .map((param) => {
        const p = param as {
          seriesId?: string;
          seriesName?: string;
          value?: number | string | null;
        };
        const rawId = String(p.seriesId ?? "");
        // Map the dashed buffer overlay back onto its series; drop every other
        // internal series (mini chart, loading skeleton).
        const key = rawId.startsWith(BUFFER_PREFIX)
          ? rawId.slice(BUFFER_PREFIX.length)
          : rawId.startsWith("__")
            ? ""
            : (p.seriesId ?? p.seriesName ?? "");
        if (!key) return "";
        // A null value means this series does not reach the hovered x (a buffer
        // line's solid part stops before the last point) — skip it, and let the
        // overlay row for the same key stand in.
        if (p.value === null || p.value === undefined) return "";
        if (seen.has(key)) return "";
        seen.add(key);

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

        return `<div class="flex w-full flex-wrap items-center gap-2${dimmed}">
          <div class="h-2.5 w-2.5 shrink-0 rounded-[2px]" style="background:${indicatorBackground(key, colorsCount)}"></div>
          <div class="flex flex-1 items-center justify-between gap-4 leading-none">
            <span class="text-muted-foreground">${labelText}</span>
            <span class="text-foreground font-mono font-medium tabular-nums">${value}</span>
          </div>
        </div>`;
      })
      .join("");

    return `<div class="grid min-w-32 items-start gap-1.5 border border-border/50 px-2.5 py-1.5 text-xs shadow-xl ${roundnessClass[tooltipSlot.roundness]} ${tooltipVariantClass[tooltipSlot.variant]}">
      <div class="font-medium">${label}</div>
      <div class="grid gap-1.5">${body}</div>
    </div>`;
  };
}

function buildTooltipOption(ctx: OptionBuildContext): TooltipComponentOption {
  const { tooltipSlot, isLoading } = ctx;
  const { tokens } = ctx.resolved;

  return {
    show: tooltipSlot.present && !isLoading,
    trigger: "axis",
    confine: true,
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    extraCssText: "box-shadow:none;",
    axisPointer: tooltipSlot.cursor
      ? {
          type: "line",
          lineStyle: {
            color: withAlpha(tokens.border, AXIS_POINTER_OPACITY),
            width: STROKE_WIDTH,
            type: [3, 3] as [number, number],
          },
        }
      : { type: "none" },
    formatter: createTooltipFormatter(ctx),
  };
}

// ── Brush — the evil-brush "line" look, canvas-style: a real mini chart of the
// full data (strokes only, no fill, like EvilBrush variant="line") in a second
// grid, with a transparent slider dataZoom laid over it. Both zoom entries target
// only the MAIN x-axis, so the mini chart never filters itself. Only called when
// `showBrush` is set.
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
  const { data, lines, curveType, selectedDataKey, brushHeight, categories } = ctx;
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

  const miniSeries: LineSeriesOption[] = lines.map((line) => {
    const key = line.dataKey;
    const base = (ctx.resolved.series[key] ?? [])[0] ?? "rgba(120, 120, 120, 1)";
    const curve = curveConfig(line.curveType ?? curveType);

    // The mini chart mirrors the click selection: unselected series recede
    // by the same ratio as the main plot.
    const strokeDim = getOpacity(selectedDataKey, key).stroke;

    return {
      id: `__mini-${key}`,
      type: "line",
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: data.map((row) => Number(row[key]) || 0),
      smooth: curve.smooth,
      step: curve.step,
      connectNulls: line.connectNulls,
      silent: true,
      showSymbol: false,
      emphasis: { disabled: true },
      tooltip: { show: false },
      lineStyle: { color: base, width: 1, opacity: BRUSH_STROKE_OPACITY * strokeDim },
      z: 0,
    };
  });

  const dataZoom: DataZoomComponentOption[] = [
    {
      type: "slider",
      show: true,
      xAxisIndex: [0],
      left: 8,
      right: 8,
      bottom: brushBottom,
      height: brushHeight,
      // Carry the live range through every rebuild — a notMerge push
      // without start/end would reset the zoom to the full extent.
      start: ctx.brushRange.start,
      end: ctx.brushRange.end,
      brushSelect: false,
      // Range labels are overlay pills below the frame (see
      // syncBrushOverlay) — the native detail text renders INSIDE the
      // track, which is not the evil-brush look.
      showDetail: false,
      backgroundColor: "transparent",
      // The visible frame is the graphic overlay riding the selection —
      // the component's own static border stays hidden.
      borderColor: "transparent",
      fillerColor: withAlpha(tokens.foreground, BRUSH_FILLER_OPACITY),
      dataBackground: { lineStyle: { opacity: 0 }, areaStyle: { opacity: 0 } },
      selectedDataBackground: { lineStyle: { opacity: 0 }, areaStyle: { opacity: 0 } },
      // Interaction only — the visible pills are graphic overlays (see
      // syncBrushOverlay). Kept generous for an easy grab target.
      handleIcon: "path://M -3 -5 L -3 5 A 3 3 0 0 0 3 5 L 3 -5 A 3 3 0 0 0 -3 -5 Z",
      handleSize: "35%",
      handleStyle: { opacity: 0 },
      moveHandleSize: 0,
      emphasis: { handleStyle: { opacity: 0 } },
    },
    { type: "inside", xAxisIndex: [0] },
  ];

  return { miniGrid, miniXAxis, miniYAxis, miniSeries, dataZoom };
}

// Loading skeleton — ONE gray wave regardless of declared lines (Recharts
// parity: its skeleton is a single stroke-only LoadingLine), swept by the
// shimmer rAF. No fill: a <Line> has no area, so the skeleton is stroke-only too.
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
        z: 1,
      },
    ],
  };
}

// The plotted values for a line, optionally decorated per-datum. Multi-color
// lines tint each symbol with the gradient's color at its own x-position (like
// the Recharts dots); single-color lines return the raw numbers. `null` entries
// pass through untouched — they carve the gap a buffer line's two parts leave.
type LinePoint =
  | number
  | null
  | {
      value: number | null;
      itemStyle: DotItemStyleOption;
      emphasis: { itemStyle: DotItemStyleOption };
    };

function buildLineSeries(ctx: OptionBuildContext): LineSeriesOption[] {
  const {
    data,
    config,
    lines,
    curveType,
    selectedDataKey,
    hasSelection,
    enableHoverHighlight,
    resolved,
  } = ctx;
  const background = resolved.tokens.background;

  return lines.flatMap((line): LineSeriesOption[] => {
    const key = line.dataKey;
    const slots = resolved.series[key] ?? ["rgba(120, 120, 120, 1)"];
    const paint = seriesPaint(slots);
    const isSelected = selectedDataKey === key;
    const opacity = getOpacity(selectedDataKey, key);
    const curve = curveConfig(line.curveType ?? curveType);
    const multiColor = slots.length > 1;

    const restingDot = dotStyle(line.dotVariant, paint, background);
    const activeDot = dotStyle(line.activeDotVariant, paint, background);
    const restingVisible = line.dotVariant !== "none";
    const dotOpacity = opacity.dot;

    const values = data.map((row) => Number(row[key]) || 0);
    const n = values.length;
    const buffer = line.enableBufferLine && n >= 2;

    // The dash pattern for the MAIN line. A buffer line keeps its body solid and
    // dashes only the tail overlay, so its main part is always solid regardless
    // of strokeVariant (matches the Recharts twin, which suppresses the base
    // dasharray while the buffer shape manages its own).
    const mainDash: "solid" | [number, number] =
      buffer || line.strokeVariant === "solid" ? "solid" : [3, 3];

    // Turn a value list into ECharts data — attaching per-datum symbol colors
    // for multi-color lines, and passing `null` gaps through so a buffer line's
    // two parts each draw only their own segment.
    const toPoints = (vals: (number | null)[]): LinePoint[] =>
      !multiColor
        ? vals
        : vals.map((value, i): LinePoint => {
            if (value === null) return null;
            const t = vals.length > 1 ? i / (vals.length - 1) : 0;
            const pointColor = sampleGradient(slots, t);
            return {
              value,
              itemStyle: {
                ...dotItemStyle(
                  restingVisible ? line.dotVariant : line.activeDotVariant,
                  pointColor,
                  background,
                ),
                opacity: dotOpacity,
              },
              emphasis: {
                itemStyle: {
                  ...dotItemStyle(
                    line.activeDotVariant === "none" ? "default" : line.activeDotVariant,
                    pointColor,
                    background,
                  ),
                  opacity: 1,
                },
              },
            };
          });

    // Buffer line: the solid MAIN part drops the last point (its final segment
    // becomes the dashed overlay); the overlay carries only the last two points.
    const mainValues: (number | null)[] = buffer
      ? values.map((v, i) => (i === n - 1 ? null : v))
      : values;

    const z = isSelected ? 3 : hasSelection ? 1 : 2;

    // Glow overlays sit UNDER the real line (built first, same z; equal-z series
    // paint in array order). They follow the FULL solid path so the halo stays
    // continuous even beneath a dashed or buffer tail.
    const glowSeries = line.glowing
      ? buildGlowSeries({
          key,
          paint,
          slots,
          values,
          curve,
          connectNulls: line.connectNulls,
          z,
          selectionDim: opacity.stroke,
          dotSize: restingVisible ? restingDot.size : 0,
        })
      : [];

    const mainSeries: LineSeriesOption = {
      id: key,
      name: typeof config[key]?.label === "string" ? config[key]?.label : key,
      type: "line",
      data: toPoints(mainValues),
      smooth: curve.smooth,
      step: curve.step,
      connectNulls: line.connectNulls,
      cursor: line.isClickable ? "pointer" : "default",
      // By default ECharts only fires mouse events on the symbols — this makes
      // the line itself clickable too, like the Recharts <Line>.
      triggerLineEvent: line.isClickable,
      showSymbol: restingVisible,
      symbol: "circle",
      symbolSize: restingVisible ? restingDot.size : activeDot.size,
      z,
      lineStyle: {
        color: paint,
        width: STROKE_WIDTH,
        opacity: opacity.stroke,
        type: mainDash,
        dashOffset: 0,
      },
      itemStyle: multiColor
        ? { opacity: dotOpacity }
        : {
            ...(restingVisible ? restingDot.itemStyle : activeDot.itemStyle),
            opacity: dotOpacity,
          },
      emphasis: {
        // focus "series" blurs every other series in this grid while one is
        // hovered — the hover twin of the click selection (opt-in via
        // enableHoverHighlight); otherwise the active dot is the only emphasis.
        focus: enableHoverHighlight ? "series" : "none",
        scale: restingVisible ? activeDot.size / Math.max(restingDot.size, 1) : 1,
        ...(multiColor ? {} : { itemStyle: { ...activeDot.itemStyle, opacity: 1 } }),
      },
      // Blur styling mirrors the click-selection dim (stroke 0.3 / dot 0.3);
      // inert unless a series is focused via enableHoverHighlight.
      blur: {
        lineStyle: { opacity: 0.3 },
        itemStyle: { opacity: 0.3 },
      },
    };

    if (!buffer) return [...glowSeries, mainSeries];

    // Dashed forecast overlay — draws ONLY the last segment. Silent, so it never
    // intercepts clicks/hover; it still feeds the axis tooltip (silent series
    // are aggregated by axis), which is why the last point keeps its number.
    const bufferValues: (number | null)[] = values.map((v, i) => (i >= n - 2 ? v : null));
    const bufferSeries: LineSeriesOption = {
      id: `${BUFFER_PREFIX}${key}`,
      type: "line",
      data: toPoints(bufferValues),
      smooth: curve.smooth,
      step: curve.step,
      connectNulls: true,
      silent: true,
      showSymbol: restingVisible,
      symbol: "circle",
      symbolSize: restingVisible ? restingDot.size : activeDot.size,
      z,
      lineStyle: {
        color: paint,
        width: STROKE_WIDTH,
        opacity: opacity.stroke,
        type: BUFFER_DASH,
      },
      itemStyle: multiColor
        ? { opacity: dotOpacity }
        : {
            ...(restingVisible ? restingDot.itemStyle : activeDot.itemStyle),
            opacity: dotOpacity,
          },
      // The dashed tail is a separate silent series, so focus:"series" on its
      // parent would blur it apart from the line it belongs to. The root
      // dispatch-links this id (see companionIdsByKey) so it focuses WITH its
      // parent; these styles give it the parent's look while focused and the
      // click-selection dim while another series is hovered.
      emphasis: {
        focus: "none",
        scale: false,
        lineStyle: { opacity: opacity.stroke },
        itemStyle: { opacity: dotOpacity },
      },
      blur: { lineStyle: { opacity: 0.3 }, itemStyle: { opacity: 0.3 } },
    };

    return [...glowSeries, mainSeries, bufferSeries];
  });
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
  brushRange: BrushRange; // live zoom window — carried through every rebuild
  brushGeom: BrushGeometry | null; // brush footer layout of the last build
  brushOverlay: BrushOverlayElements | null; // zrender elements, owned by syncBrushOverlay
  brushHover: { inside: boolean; left: boolean; right: boolean };
  // seriesIndex → clickable key for the last build, `undefined` for internal
  // series. A line-body click (triggerLineEvent) reports only a seriesIndex, and
  // buffer lines add a second (`__buffer-`) series per key — so the index no
  // longer equals the key's position in seriesKeys and must be mapped explicitly.
  seriesKeyByIndex: (string | undefined)[];
  // key → its silent companion series ids (glow overlays + buffer tail) in the
  // main grid. Under enableHoverHighlight the root highlights/downplays these
  // together with the hovered parent, so focus:"series" can't strand a line's own
  // glow or forecast tail apart from it.
  companionIdsByKey: Map<string, string[]>;
  // Latest callbacks/flags for the imperative ECharts event handlers.
  handlers: {
    onBrushChange?: (range: { startIndex: number; endIndex: number }) => void;
    onSelectionChange?: (key: string | null) => void;
    clickableKeys: Set<string>;
    selectedDataKey: string | null;
    brushFormatLabel?: (value: string, index: number) => string;
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
 * Apache ECharts port of the EvilCharts line chart, exposing a compound-as-config
 * API so its JSX reads identically to the Recharts twin. The root owns the data,
 * config, selection state, loading skeleton, intro reveal, and optional zoom
 * brush; every visual part — `<Line>`, `<XAxis>`, `<YAxis>`, `<Grid>`,
 * `<Tooltip>`, `<Legend>` — is composed as a declarative child that renders
 * nothing. The root walks those children by reference and drives a single
 * imperative ECharts instance. Fully self-contained: its only dependencies are
 * `react`, `echarts`, and `motion`.
 */
export function EChartsLineChart<TData extends Record<string, unknown>>({
  data,
  config,
  xDataKey,
  className,
  curveType = "linear",
  animation = true,
  animationType = "left-to-right",
  enableHoverHighlight = false,
  defaultSelectedDataKey = null,
  onSelectionChange,
  isLoading = false,
  loadingPoints = LOADING_DEFAULT_POINTS,
  showBrush = false,
  brushHeight = 56,
  brushFormatLabel,
  onBrushChange,
  chartOptions,
  children,
}: EChartsLineChartProps<TData>) {
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
    brushRange: { start: 0, end: 100 },
    brushGeom: null,
    brushOverlay: null,
    brushHover: { inside: false, left: false, right: false },
    seriesKeyByIndex: [],
    companionIdsByKey: new Map(),
    handlers: {
      onBrushChange,
      onSelectionChange,
      clickableKeys: new Set<string>(),
      selectedDataKey: defaultSelectedDataKey,
      brushFormatLabel,
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

  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(defaultSelectedDataKey);

  // Hover-highlight mirrors into the legend (React state) and tooltip
  // (live.hoveredKey — its formatter runs on every hover, and pushing an option
  // to sync it would reset ECharts' native blur state mid-hover).
  const [hoveredDataKey, setHoveredDataKey] = useState<string | null>(null);

  // ── Declarative config, collected from children by reference ─────────────────
  const collected = useMemo(() => collectConfig(children), [children]);
  const {
    lines,
    xAxis: xAxisSlot,
    yAxis: yAxisSlot,
    showGrid,
    tooltip: tooltipSlot,
    legend: legendSlot,
  } = collected;

  const seriesKeys = useMemo(() => lines.map((line) => line.dataKey), [lines]);

  // x category key: <XAxis dataKey> → root xDataKey → first data column no <Line> claims.
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

  // The intro draw-in follows the first line's setting, falling back to the root default.
  const effectiveAnimation = lines[0]?.animationType ?? animationType;

  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);

  const hasSelection = selectedDataKey !== null;

  // Which series may be clicked to toggle selection (consulted by the click handler).
  const clickableKeys = useMemo(
    () => new Set(lines.filter((line) => line.isClickable).map((line) => line.dataKey)),
    [lines],
  );

  // Refresh the handlers' snapshot of the latest callbacks/flags every render.
  live.handlers = {
    onBrushChange,
    onSelectionChange,
    clickableKeys,
    selectedDataKey,
    brushFormatLabel,
    enableHoverHighlight,
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
      lines,
      curveType,
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
      categories,
      brushRange: live.brushRange,
      getHoveredKey: () => live.hoveredKey,
    };

    const { grid, brushBottom } = buildChartLayout(ctx);
    live.brushGeom = showBrush ? { bottom: brushBottom, height: brushHeight } : null;

    const { xAxis, yAxis } = buildMainAxes(ctx);

    if (isLoading) return buildLoadingOption(ctx, { grid, xAxis, yAxis });

    const brush = showBrush ? buildBrushOption(ctx, brushBottom) : null;

    const series = [...buildLineSeries(ctx), ...(brush?.miniSeries ?? [])];
    // Record the exact series order so a line-body click (which reports only a
    // seriesIndex) can recover its key — buffer/mini/loading series break the
    // "index === key position" shortcut, so map each index to its id here.
    live.seriesKeyByIndex = series.map((s) => {
      const id = String(s.id ?? "");
      return id && !id.startsWith("__") ? id : undefined;
    });
    // Map each key to its silent companion series ids (glow overlays + buffer
    // tail), mirroring exactly what buildLineSeries emits — the hover handlers
    // highlight/downplay these together with the parent so focus:"series" never
    // strands a line's own glow or forecast tail apart from it.
    const companionIdsByKey = new Map<string, string[]>();
    for (const line of lines) {
      const ids: string[] = [];
      if (line.glowing) {
        for (let i = 0; i < GLOW_LAYERS.length; i++) ids.push(`__glow-${i}-${line.dataKey}`);
      }
      if (line.enableBufferLine && data.length >= 2) ids.push(`${BUFFER_PREFIX}${line.dataKey}`);
      if (ids.length) companionIdsByKey.set(line.dataKey, ids);
    }
    live.companionIdsByKey = companionIdsByKey;

    return {
      animation: false,
      grid: brush ? [grid, brush.miniGrid] : grid,
      xAxis: brush ? [xAxis, brush.miniXAxis] : xAxis,
      yAxis: brush ? [yAxis, brush.miniYAxis] : yAxis,
      tooltip: buildTooltipOption(ctx),
      dataZoom: brush?.dataZoom,
      series,
    };
  }, [
    live,
    data,
    config,
    lines,
    xCategoryKey,
    curveType,
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
      const { clickableKeys: clickable } = live.handlers;
      const p = params as { seriesId?: string; seriesIndex?: number };
      // Symbol clicks carry seriesId; line clicks (triggerLineEvent) only carry
      // seriesIndex — recover the key from the last build's index map, which
      // accounts for the extra `__buffer-`/`__mini-` series interleaved between
      // the main ones (a raw seriesKeys lookup would land on the wrong key).
      const id =
        p.seriesId ??
        (typeof p.seriesIndex === "number" ? live.seriesKeyByIndex[p.seriesIndex] : undefined);
      if (typeof id === "string" && clickable.has(id)) toggleSelection(id);
    });

    // Hover-highlight bookkeeping — the canvas blur is ECharts-native
    // (emphasis.focus:"series" + blur), but the HTML legend and tooltip need to
    // know which series is hovered, and the silent glow/buffer overlays must be
    // focus-linked to their parent (they are separate series, so focus:"series"
    // would otherwise blur a line's own glow or forecast tail).
    chart.on("mouseover", (params) => {
      const { enableHoverHighlight: hoverOn } = live.handlers;
      if (!hoverOn) return;
      const p = params as { seriesId?: string; seriesIndex?: number; componentType?: string };
      if (p.componentType !== "series") return;
      const id =
        p.seriesId ??
        (typeof p.seriesIndex === "number" ? live.seriesKeyByIndex[p.seriesIndex] : undefined);
      if (typeof id !== "string" || id.startsWith("__")) return;
      live.hoveredKey = id;
      setHoveredDataKey(id);
      const companions = live.companionIdsByKey.get(id);
      if (companions) {
        for (const seriesId of companions) chart.dispatchAction({ type: "highlight", seriesId });
      }
    });
    chart.on("mouseout", () => {
      const prev = live.hoveredKey;
      if (prev === null) return;
      live.hoveredKey = null;
      setHoveredDataKey(null);
      const companions = live.companionIdsByKey.get(prev);
      if (companions) {
        for (const seriesId of companions) chart.dispatchAction({ type: "downplay", seriesId });
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
    // the Recharts twin unmounts its <Line>s while loading and replays the intro
    // on remount, so data → loading → data draws in again here too.
    if (isLoading) live.hasRevealed = false;
    const shouldReveal = !live.hasRevealed && !isLoading;
    if (shouldReveal) live.hasRevealed = true;
    const revealEnabled =
      animation && shouldReveal && effectiveAnimation !== "none" && !shouldReduceMotion;
    if (revealEnabled) live.revealEndsAt = performance.now() + REVEAL_DURATION;
    push(revealEnabled);

    // Theme flips and resizes re-enter here without touching React: re-read the
    // tokens (the .dark class changed, or the renderer resized) and push an
    // update-style option.
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
    const animatedKeys = lines
      // A buffer line's body is solid (only its tail dashes), so the sweep skips it.
      .filter((line) => line.strokeVariant === "animated-dashed" && !line.enableBufferLine)
      .map((line) => line.dataKey);
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
  }, [live, lines, hasSelection, isLoading]);

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
      // right, leaned 45°. The gradient uses ABSOLUTE pixel coordinates so the
      // window lands at the same place along the stroke regardless of the wave's
      // bounding box.
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

  const legendJustify =
    legendSlot.align === "left"
      ? "justify-start"
      : legendSlot.align === "center"
        ? "justify-center"
        : "justify-end";

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
        <div style={legendStyle} className={`flex items-center gap-4 select-none ${legendJustify}`}>
          {seriesKeys.map((key) => {
            const item = config[key];
            const colorsCount = item ? getColorsCount(item) : 1;
            const isSelected =
              (selectedDataKey === null || selectedDataKey === key) &&
              (hoveredDataKey === null || hoveredDataKey === key);
            return (
              // No entrance here — the Recharts legend appears instantly, and a
              // fade-in reads as disconnected from the canvas draw-in.
              <div
                key={key}
                className={`flex items-center gap-1.5 transition-opacity ${
                  !isSelected ? "opacity-30" : ""
                } ${legendSlot.isClickable ? "cursor-pointer" : ""}`}
                onClick={() => {
                  if (legendSlot.isClickable) toggleSelection(key);
                }}
              >
                <LegendIndicator
                  variant={legendSlot.variant}
                  dataKey={key}
                  colorsCount={colorsCount}
                />
                {item?.label}
              </div>
            );
          })}
        </div>
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

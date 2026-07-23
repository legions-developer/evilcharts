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
import { DataZoomComponent, GridComponent, TooltipComponent } from "echarts/components";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart } from "echarts/charts";
import * as echarts from "echarts/core";

// Modular registration keeps the bundle lean — only the pieces this chart needs.
// `DataZoomComponent` bundles both the slider (brush footer) and inside (wheel/drag)
// zoom. The brush's frame/handles/labels are raw zrender elements, not the
// graphic component — see syncBrushOverlay.
echarts.use([LineChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

type EChartsInstance = ReturnType<typeof echarts.init>;
type EChartsOption = Parameters<EChartsInstance["setOption"]>[0];

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STROKE_WIDTH = 0.8;
const LOADING_ANIMATION_DURATION = 2000; // shimmer loop, in milliseconds
const REVEAL_DURATION = 1000; // intro draw-in length, in milliseconds
const REVEAL_EASING = "cubicOut"; // ECharts easing for the intro draw-in
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
const LOADING_STROKE_OPACITY = 0.28; // skeleton outline, × foreground alpha
const LOADING_FILL_OPACITY = 0.06; // skeleton resting fill, × foreground alpha
const LOADING_SHIMMER_MAX_OPACITY = 0.16; // shimmer sheen peak, × foreground alpha
const LOADING_SHIMMER_BAND = 0.3; // sheen half-width, fraction of chart width
const BRUSH_STROKE_OPACITY = 0.5; // mini-chart series stroke
const BRUSH_FILL_OPACITY = 0.15; // mini-chart series fade, at the top stop
const BRUSH_BORDER_OPACITY = 1; // brush frame, × border alpha (evil-brush uses the full token)
const BRUSH_FILLER_OPACITY = 0; // selected-range wash — evil-brush draws none

// Theme selectors mirror the repo's <ChartStyle>: light is the bare root, dark is `.dark`.
const THEMES = { light: "", dark: ".dark" } as const;
type ThemeKey = keyof typeof THEMES;
const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];

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

  return { areas, xAxis, yAxis, showGrid, tooltip, legend };
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
// stroke, symbol fills, and as the base tint for the area fill.
function seriesPaint(slots: string[]): string | echarts.graphic.LinearGradient {
  if (slots.length <= 1) return slots[0] ?? "rgba(120, 120, 120, 1)";
  const stops = slots.map((color, i) => ({ offset: i / (slots.length - 1), color }));
  return new echarts.graphic.LinearGradient(0, 0, 1, 0, stops);
}

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
): FillPattern | null {
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
  const pattern = (rotation = 0): FillPattern => ({
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

type FillPattern = {
  image: HTMLCanvasElement;
  repeat: "repeat" | "no-repeat";
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
};

// Resolves the area fill for a variant into an ECharts color value. `size` is the
// full renderer size, used to bake 2D gradients for multi-color series.
function fillPaint(
  variant: AreaVariant,
  showUnselected: boolean,
  slots: string[],
  size: { width: number; height: number },
): string | echarts.graphic.LinearGradient | FillPattern {
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
// Dots — map the resting/active variants onto ECharts symbols (§1.5).
// ─────────────────────────────────────────────────────────────────────────────

type DotStyle = { size: number; itemStyle: Record<string, unknown> };

function dotItemStyle(
  variant: DotVariant,
  paint: string | echarts.graphic.LinearGradient,
  background: string,
): Record<string, unknown> {
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
  holder: { current: BrushOverlayElements | null },
  params: BrushOverlayParams | null,
) {
  const zr = chart.getZr();
  if (!zr) return;

  if (!params) {
    if (holder.current) {
      const { grips, ...rest } = holder.current;
      [...Object.values(rest), ...grips].forEach((el) => zr.remove(el));
      holder.current = null;
    }
    return;
  }

  if (!holder.current) {
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
    holder.current = els;
  }

  const els = holder.current;
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
  if (selected === null || selected === key) return { fill: 0.8, stroke: 0.8, dot: 1 };
  return { fill: 0.2, stroke: 0.3, dot: 0.3 };
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

// A wide, soft bell of alpha stops (sin² eased, 17 slots) that sweeps a sheen
// through the skeleton fill. `center` may run outside [0, 1] so the sheen fully
// enters and exits the frame instead of piling up at the edges.
function shimmerStops(center: number, color: string) {
  return Array.from({ length: 17 }, (_, i) => {
    const offset = i / 16;
    const dist = Math.abs(offset - center);
    const eased =
      dist >= LOADING_SHIMMER_BAND
        ? 0
        : Math.sin((1 - dist / LOADING_SHIMMER_BAND) * (Math.PI / 2)) ** 2;
    return {
      offset,
      color: withAlpha(
        color,
        LOADING_FILL_OPACITY + eased * (LOADING_SHIMMER_MAX_OPACITY - LOADING_FILL_OPACITY),
      ),
    };
  });
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
  const hasRevealedRef = useRef(false);
  const revealEndsAtRef = useRef(0);
  // Loading skeleton rows, created on first use — an impure initializer argument
  // would otherwise re-roll Math.random() on every render.
  // One ghost wave per declared <Area>, so the skeleton previews the shape of
  // the chart it becomes. Created lazily — an impure initializer would re-roll
  // Math.random() on every render.
  const loadingDataRef = useRef<number[] | null>(null);
  const loadingData = useCallback(
    () => (loadingDataRef.current ??= getLoadingData(loadingPoints)),
    [loadingPoints],
  );
  const shouldReduceMotion = useReducedMotion();

  // Resolved colors feed the option builder and the rAF loops — never render
  // output — so they live in a ref. As state they forced an extra render pass and
  // an effect whose only job was to trigger the option push: the "chain of
  // computations" react.dev/learn/you-might-not-need-an-effect warns about.
  const resolvedRef = useRef<ResolvedColors | null>(null);

  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(defaultSelectedDataKey);

  // Hover-highlight mirrors into the legend (React state) and tooltip (ref —
  // its formatter runs on every render, and pushing an option to sync it would
  // reset ECharts' blur state mid-hover).
  const [hoveredDataKey, setHoveredDataKey] = useState<string | null>(null);
  const hoveredKeyRef = useRef<string | null>(null);

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

  // Latest callbacks/flags for the imperative ECharts event handlers.
  const handlersRef = useRef({
    onBrushChange,
    onSelectionChange,
    clickableKeys,
    selectedDataKey,
    brushFormatLabel,
    seriesKeys,
    enableHoverHighlight,
  });
  handlersRef.current = {
    onBrushChange,
    onSelectionChange,
    clickableKeys,
    selectedDataKey,
    brushFormatLabel,
    seriesKeys,
    enableHoverHighlight,
  };
  const dataLengthRef = useRef(data.length);
  dataLengthRef.current = data.length;
  // Update-style re-push for paths that bypass React entirely (theme flips,
  // resizes) — set by the sync effect below.
  const repushRef = useRef<() => void>(() => {});

  // Current zoom range + brush layout, shared with the datazoom handler so the
  // selection frame/dim overlays can follow the handles, and so repushes don't
  // reset the range (a notMerge option without start/end snaps back to 0–100).
  const brushRangeRef = useRef<BrushRange>({ start: 0, end: 100 });
  const brushGeomRef = useRef<BrushGeometry | null>(null);
  const brushOverlayRef = useRef<BrushOverlayElements | null>(null);
  const brushHoverRef = useRef({ inside: false, left: false, right: false });
  const categoriesRef = useRef<string[]>([]);

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

    const geom = brushGeomRef.current;
    const tokens = resolvedRef.current?.tokens;
    if (!geom || !tokens) {
      syncBrushOverlay(chart, brushOverlayRef, null);
      return;
    }

    const range = brushRangeRef.current;
    const categories = categoriesRef.current;
    const format = handlersRef.current.brushFormatLabel;
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

    syncBrushOverlay(chart, brushOverlayRef, {
      range,
      geom,
      size: { width: chart.getWidth(), height: chart.getHeight() },
      tokens,
      labels,
      showLabels: brushHoverRef.current.inside,
      hover: brushHoverRef.current,
    });
  }, []);

  // ── Option builder ─────────────────────────────────────────────────────────
  const buildOption = useCallback((): EChartsOption => {
    const resolved = resolvedRef.current;
    if (!resolved) return {};
    const { tokens } = resolved;

    // Full renderer size — 2D gradient textures are baked at these dimensions.
    const rendererSize = {
      width: echartsRef.current?.getWidth() ?? mountRef.current?.clientWidth ?? 0,
      height: echartsRef.current?.getHeight() ?? mountRef.current?.clientHeight ?? 0,
    };

    const showLegend = legendSlot.present;
    const legendTop = showLegend && legendSlot.verticalAlign === "top";
    const legendBottom = showLegend && legendSlot.verticalAlign === "bottom";
    // Clearance covers the x-axis labels plus the same breathing room the
    // Recharts twin leaves between them and the brush.
    const brushGap = showBrush ? brushHeight + 30 : 0;

    // ECharts 6 contains axis labels automatically (the legacy `containLabel`
    // flag now only triggers a deprecation warning).
    const grid = {
      left: 8,
      right: 8,
      top: legendTop ? 42 : 16,
      bottom: 8 + brushGap + (legendBottom ? 34 : 0),
    };

    const axisLabelColor = tokens.mutedForeground;
    const splitLineColor = withAlpha(tokens.border, GRID_LINE_OPACITY);

    const xTickFormatter = xAxisSlot.tickFormatter;
    const yTickFormatter = yAxisSlot.tickFormatter;

    const categories = data.map((row) => String(row[xCategoryKey]));
    categoriesRef.current = categories;

    const xAxis = {
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
    const yAxis = {
      type: "value",
      show: yAxisSlot.present || showGrid,
      max: isExpanded ? 1 : undefined,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: showGrid,
        lineStyle: { color: splitLineColor, type: [3, 3] as [number, number], width: 1 },
      },
      axisLabel: {
        // Hidden while loading — skeleton values are meaningless, and the
        // Recharts YAxis unmounts during loading too.
        show: yAxisSlot.present && !isLoading,
        color: axisLabelColor,
        margin: 8,
        formatter: isExpanded
          ? (value: number) => `${Math.round(value * 100)}%`
          : yTickFormatter
            ? (value: number, index: number) => yTickFormatter(value, index)
            : undefined,
      },
    };

    const tooltip = {
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
      formatter: (params: unknown) => renderTooltip(params),
    };

    // ── Brush — the evil-brush look, canvas-style: a real mini chart of the full
    // data in a second grid, with a transparent slider dataZoom laid over it.
    // Both zoom entries target only the MAIN x-axis, so the mini chart never
    // filters itself.
    const brushBottom = legendBottom ? 34 : 6;

    const miniGrid = {
      left: 8,
      right: 8,
      bottom: brushBottom,
      height: brushHeight,
      // No visible axes here — opt out of label containment so the mini chart
      // spans the full brush frame.
      outerBoundsMode: "none",
    };

    const miniXAxis = {
      type: "category",
      gridIndex: 1,
      boundaryGap: false,
      show: false,
      data: categories,
      axisPointer: { show: false },
    };

    const miniYAxis = { type: "value", gridIndex: 1, show: false };

    const miniSeries = showBrush
      ? areas.map((area) => {
          const key = area.dataKey;
          const base = (resolved.series[key] ?? [])[0] ?? "rgba(120, 120, 120, 1)";
          const curve = curveConfig(area.curveType ?? curveType);

          // The mini chart mirrors the click selection: unselected series recede
          // by the same ratios as the main plot.
          const opacity = getOpacity(selectedDataKey, key);
          const strokeDim = opacity.stroke / 0.8;
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
        })
      : [];

    brushGeomRef.current = showBrush ? { bottom: brushBottom, height: brushHeight } : null;

    const dataZoom = showBrush
      ? [
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
            start: brushRangeRef.current.start,
            end: brushRangeRef.current.end,
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
            // brushGraphicElements). Kept generous for an easy grab target.
            handleIcon: "path://M -3 -5 L -3 5 A 3 3 0 0 0 3 5 L 3 -5 A 3 3 0 0 0 -3 -5 Z",
            handleSize: "35%",
            handleStyle: { opacity: 0 },
            moveHandleSize: 0,
            emphasis: { handleStyle: { opacity: 0 } },
          },
          { type: "inside", xAxisIndex: [0] },
        ]
      : undefined;

    // Loading skeleton — ONE gray wave regardless of declared areas (Recharts
    // parity: its skeleton is a single LoadingArea), swept by the shimmer rAF.
    if (isLoading) {
      const curve = curveConfig(curveType);

      return {
        animation: false,
        grid,
        xAxis,
        yAxis,
        tooltip: { show: false },
        series: [
          {
            id: "__loading",
            type: "line",
            data: loadingData(),
            smooth: curve.smooth,
            step: curve.step,
            showSymbol: false,
            silent: true,
            lineStyle: { color: tokens.foreground, width: 1, opacity: LOADING_STROKE_OPACITY },
            areaStyle: { color: withAlpha(tokens.foreground, LOADING_FILL_OPACITY) },
            z: 1,
          },
        ],
      } as unknown as EChartsOption;
    }

    // Optional per-row normalization for the expanded (100%) stack.
    const rowTotals = isExpanded
      ? data.map((row) => seriesKeys.reduce((sum, key) => sum + (Number(row[key]) || 0), 0))
      : [];

    const echartsSeries = areas.map((area) => {
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

      const restingDot = dotStyle(area.dotVariant, paint, tokens.background);
      const activeDot = dotStyle(area.activeDotVariant, paint, tokens.background);
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
                  tokens.background,
                ),
                opacity: dotOpacity,
              },
              emphasis: {
                itemStyle: {
                  ...dotItemStyle(
                    area.activeDotVariant === "none" ? "default" : area.activeDotVariant,
                    pointColor,
                    tokens.background,
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
          // hovered — the hover twin of the click selection.
          focus: enableHoverHighlight ? "series" : "none",
          scale: restingVisible ? activeDot.size / Math.max(restingDot.size, 1) : 1,
          ...(multiColor ? {} : { itemStyle: { ...activeDot.itemStyle, opacity: 1 } }),
        },
        // Blur styling mirrors the click-selection dim (fill 0.2 / stroke 0.3 / dot 0.3).
        blur: {
          lineStyle: { opacity: 0.3 },
          areaStyle: { opacity: 0.2 },
          itemStyle: { opacity: 0.3 },
        },
      };
    });

    return {
      animation: false,
      grid: showBrush ? [grid, miniGrid] : grid,
      xAxis: showBrush ? [xAxis, miniXAxis] : xAxis,
      yAxis: showBrush ? [yAxis, miniYAxis] : yAxis,
      tooltip,
      dataZoom,
      series: [...echartsSeries, ...miniSeries],
    } as unknown as EChartsOption;

    // Tooltip HTML builder, closed over the current config/selection/formatter.
    function renderTooltip(params: unknown): string {
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
          const hovered = hoveredKeyRef.current;
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
    }
  }, [
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
      repushRef.current();
    });
    resizeObserver.observe(mount);

    // Light/dark flips change no React state — re-resolve and push directly.
    const themeObserver = new MutationObserver(() => {
      repushRef.current();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    chart.on("click", (params) => {
      const { clickableKeys: clickable, seriesKeys: keys } = handlersRef.current;
      const p = params as { seriesId?: string; seriesIndex?: number };
      // Symbol clicks carry seriesId; area-polygon clicks (triggerLineEvent)
      // only carry seriesIndex — recover the key by position. Main series come
      // first in the series array, so the index maps directly.
      const id =
        p.seriesId ?? (typeof p.seriesIndex === "number" ? keys[p.seriesIndex] : undefined);
      if (typeof id === "string" && clickable.has(id)) toggleSelection(id);
    });

    // Hover-highlight bookkeeping — the canvas blur is ECharts-native, but the
    // HTML legend and tooltip need to know which series is hovered.
    chart.on("mouseover", (params) => {
      const { enableHoverHighlight: hoverOn, seriesKeys: keys } = handlersRef.current;
      if (!hoverOn) return;
      const p = params as { seriesId?: string; seriesIndex?: number; componentType?: string };
      if (p.componentType !== "series") return;
      const id =
        p.seriesId ?? (typeof p.seriesIndex === "number" ? keys[p.seriesIndex] : undefined);
      if (typeof id !== "string" || id.startsWith("__")) return;
      hoveredKeyRef.current = id;
      setHoveredDataKey(id);
    });
    chart.on("mouseout", () => {
      if (hoveredKeyRef.current === null) return;
      hoveredKeyRef.current = null;
      setHoveredDataKey(null);
    });

    chart.on("datazoom", () => {
      const option = chart.getOption() as { dataZoom?: { start?: number; end?: number }[] };
      const zoom = option.dataZoom?.[0];
      if (!zoom) return;

      // Ride the selection — pure zrender updates, so the drag stays 1:1.
      brushRangeRef.current = { start: zoom.start ?? 0, end: zoom.end ?? 100 };
      syncBrushOverlayNow();

      const { onBrushChange: onChange } = handlersRef.current;
      if (!onChange) return;
      const len = dataLengthRef.current;
      const startIndex = Math.round(((zoom.start ?? 0) / 100) * (len - 1));
      const endIndex = Math.round(((zoom.end ?? 100) / 100) * (len - 1));
      onChange({ startIndex, endIndex });
    });

    // Hover tracking for the overlay: labels show while the pointer is over the
    // brush, and each pill brightens when the pointer is near its edge.
    const zr = chart.getZr();
    const applyHover = (next: { inside: boolean; left: boolean; right: boolean }) => {
      const prev = brushHoverRef.current;
      if (prev.inside === next.inside && prev.left === next.left && prev.right === next.right) {
        return;
      }
      brushHoverRef.current = next;
      syncBrushOverlayNow();
    };
    const onZrMove = (event: { offsetX?: number; offsetY?: number }) => {
      const geom = brushGeomRef.current;
      if (!geom) return;
      const x = event.offsetX ?? -1;
      const y = event.offsetY ?? -1;
      const top = chart.getHeight() - geom.bottom - geom.height;
      const inside = y >= top - 4 && y <= top + geom.height + 4;
      const trackLeft = 8;
      const trackWidth = Math.max(chart.getWidth() - 16, 1);
      const { start, end } = brushRangeRef.current;
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
      brushOverlayRef.current = null;
      // The reveal guard belongs to the chart instance it guarded. Without this
      // reset, StrictMode's dev-only mount→unmount→remount plays the entrance on
      // the throwaway instance and the surviving one renders without it.
      hasRevealedRef.current = false;
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
    resolvedRef.current = resolveColors(container, config, seriesKeys);

    const push = (animation: boolean) => {
      const option = buildOption();
      const merged = chartOptions ? { ...option, ...chartOptions } : option;
      Object.assign(merged, {
        animation,
        animationDuration: REVEAL_DURATION,
        animationEasing: REVEAL_EASING,
        animationDurationUpdate: 0,
      });
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
    if (isLoading) hasRevealedRef.current = false;
    const shouldReveal = !hasRevealedRef.current && !isLoading;
    if (shouldReveal) hasRevealedRef.current = true;
    const revealEnabled =
      animation && shouldReveal && effectiveAnimation !== "none" && !shouldReduceMotion;
    if (revealEnabled) revealEndsAtRef.current = performance.now() + REVEAL_DURATION;
    push(revealEnabled);

    // Theme flips and resizes re-enter here without touching React: re-read the
    // tokens (the .dark class changed, or textures need renderer-sized rebakes)
    // and push an update-style option.
    repushRef.current = () => {
      resolvedRef.current = resolveColors(container, config, seriesKeys);
      push(false);
    };
  }, [
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
    const delay = Math.max(0, revealEndsAtRef.current - performance.now());
    if (delay > 0) delayTimer = setTimeout(begin, delay + 50);
    else begin();

    return () => {
      if (delayTimer !== undefined) clearTimeout(delayTimer);
      cancelAnimationFrame(raf);
    };
  }, [areas, hasSelection, isLoading]);

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
      if (phase < lastPhase) loadingDataRef.current = getLoadingData(loadingPoints);
      lastPhase = phase;

      // Read tokens per frame, so a theme flip mid-loading retints the shimmer.
      const foreground = resolvedRef.current?.tokens.foreground ?? "rgba(120, 120, 120, 1)";
      // Sweep from fully off-screen left to fully off-screen right, and lean the
      // gradient diagonally — a vertical band reads as a scanline, not a sheen.
      const center = phase * (1 + 2 * LOADING_SHIMMER_BAND) - LOADING_SHIMMER_BAND;
      const gradient = new echarts.graphic.LinearGradient(
        0,
        0,
        1,
        0.55,
        shimmerStops(center, foreground),
      );
      chart.setOption(
        { series: [{ id: "__loading", data: loadingData(), areaStyle: { color: gradient } }] },
        { silent: true, lazyUpdate: true },
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isLoading, loadingPoints, loadingData]);

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

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
  PolarComponent,
  TooltipComponent,
  type PolarComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import { BarChart, type BarSeriesOption } from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

// Modular registration keeps the bundle lean — only the pieces this chart needs.
// `PolarComponent` bundles the polar coordinate system together with its
// `angleAxis` + `radiusAxis` (concentric rings are a polar `bar` series whose
// value drives the sweep angle). No GraphicComponent: unlike the area chart's
// brush, nothing here draws raw zrender overlays — the glow is a canvas shadow,
// selection is per-datum opacity, and the skeleton shimmer is a swept gradient.
echarts.use([BarChart, PolarComponent, TooltipComponent, CanvasRenderer]);

type EChartsInstance = ReturnType<typeof echarts.init>;

// The exact option surface this chart uses — a polar bar series plus the polar
// component (which carries angle/radius axes as dependencies) and the tooltip.
// Narrower than echarts' full EChartsOption, so a misspelled key fails the
// compile instead of silently reaching setOption.
type EChartsOption = ComposeOption<BarSeriesOption | TooltipComponentOption | PolarComponentOption>;

// Single-entry views of the composed option's array-or-single fields — the
// modular entry points don't export the polar/axis option types directly, so
// they are recovered from the composed option (angleAxis/radiusAxis enter it as
// dependencies of the polar component).
type ArrayItem<T> = T extends readonly (infer U)[] ? U : T;
type PolarOption = ArrayItem<NonNullable<EChartsOption["polar"]>>;
type AngleAxisOption = ArrayItem<NonNullable<EChartsOption["angleAxis"]>>;
type RadiusAxisOption = ArrayItem<NonNullable<EChartsOption["radiusAxis"]>>;

// Per-datum bar paint — structurally assignable to the per-datum itemStyle. A
// gradient `color` reproduces each bar's diagonal fill; `shadowBlur`/`shadowColor`
// are the canvas analogue of the Recharts glow filter.
type BarItemStyle = {
  color?: string | echarts.graphic.LinearGradient;
  opacity?: number;
  shadowBlur?: number;
  shadowColor?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_INNER_RADIUS = "30%";
const DEFAULT_OUTER_RADIUS = "100%";
const DEFAULT_CORNER_RADIUS = 5;
const DEFAULT_BAR_SIZE = 14;
const LOADING_BARS = 5; // skeleton ring count — matches the Recharts twin
const LOADING_MAX = 100; // fixed angle-axis extent while loading (values roll in a 40–100 band)
const LOADING_ANIMATION_DURATION = 2000; // shimmer sweep loop, in milliseconds
const REVEAL_DURATION = 1000; // intro sweep-in length, in milliseconds
// NOTE: the intro draw-in runs ECharts' RAW default bar entrance (each ring
// sweeps out from the start angle). Like the area twin, it plays on the FIRST
// real push only; every later push (selection, theme) sends animation:false
// because notMerge would otherwise replay the entrance on each change.

// ─────────────────────────────────────────────────────────────────────────────
// Theme knobs — every neutral tone draws from these. Base colors come from the
// consumer's CSS tokens (resolved off the live DOM), so only the opacity factors
// live here. Factors MULTIPLY the token's own alpha — a border token that is
// already 10%-white stays subtle. Tune here, not in the builder.
// ─────────────────────────────────────────────────────────────────────────────
const TRACK_OPACITY = 0.15; // unfilled background ring, × muted-foreground alpha
// Glow — stacked silent copies of a glowing ring, each painted with the SAME
// gradient as the bar (so a multi-stop ring's glow varies along the arc exactly
// like its fill — a single shadowColor tint can't), at increasing radial width
// and decreasing opacity, with a light shadowBlur to feather each layer's edge.
// Wide, low-alpha, blurred gradient copies read as a soft colored halo — the
// canvas analogue of the Recharts twin's Gaussian-blur SVG filter.
const GLOW_LAYERS = [
  { widthAdd: 18, opacity: 0.08, blur: 14 }, // outermost — widest, faintest
  { widthAdd: 10, opacity: 0.16, blur: 9 },
  { widthAdd: 4, opacity: 0.3, blur: 5 }, // innermost — hugs the bar, brightest
] as const;
const SELECTED_DIM_OPACITY = 0.15; // unselected bars while a selection is active
// The skeleton track stays faintly visible; a bright band is CLIPPED to a small
// sweeping window (only the arc slice inside it exists) and swept diagonally
// across the rings, like a clip-path sliding over the chart.
const LOADING_SHIMMER_MAX_OPACITY = 0.4; // shimmer arc peak, × foreground alpha
const LOADING_SHIMMER_BAND = 0.2; // window half-width, fraction of the sweep axis
const LOADING_SHIMMER_FEATHER = 0.2; // eased edge softening of the clip window

// Theme selectors mirror the repo's <ChartStyle>: light is the bare root, dark is `.dark`.
const THEMES = { light: "", dark: ".dark" } as const;
type ThemeKey = keyof typeof THEMES;
const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];

// Stable series ids. `__`-prefixed ids are internal (background track, skeleton)
// and stay silent; the main ring series is the only one that reports clicks and
// feeds the tooltip.
const MAIN_SERIES_ID = "radial-bars";
const TRACK_SERIES_ID = "__track";
const GLOW_SERIES_ID = "__glow";
const LOADING_SERIES_ID = "__loading";
const LOADING_TRACK_ID = "__loading-track";

const FALLBACK_COLOR = "rgba(120, 120, 120, 1)";

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type RadialVariant = "full" | "semi";
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

export interface EChartsRadialChartProps<TData extends Record<string, unknown>> {
  data: TData[]; // rows rendered by the chart — one bar (ring) per row
  config: ChartConfig; // bar colors + labels, keyed by each bar's name
  nameKey: keyof TData & string; // data key holding each bar's name
  className?: string; // extra classes for the chart container
  variant?: RadialVariant; // arc shape — full circle or half circle
  innerRadius?: number | string; // inner radius of the radial bars
  outerRadius?: number | string; // outer radius of the radial bars
  defaultSelectedDataKey?: string | null; // bar selected on first render
  onSelectionChange?: (selection: { dataKey: string; value: number } | null) => void; // fires when the selected bar changes
  isLoading?: boolean; // shows the animated loading skeleton
  backgroundVariant?: BackgroundVariant; // decorative pattern behind the chart
  chartOptions?: Record<string, unknown>; // escape hatch merged over the built ECharts option
  children?: ReactNode; // declarative config — <RadialBar>, <Tooltip>, <Legend>
}

// ─────────────────────────────────────────────────────────────────────────────
// Composible parts — DECLARATIVE CONFIG. Every part renders `null`; the root
// walks `children` by reference (child.type === RadialBar, …) to collect its
// props. Presence semantics mirror the Recharts twin: omit a child and that part
// does not render. These are never mounted into the tree — they only carry props.
// ─────────────────────────────────────────────────────────────────────────────

export interface RadialBarProps {
  dataKey: string; // value key — determines each bar's arc length
  cornerRadius?: number; // rounding of each bar's ends (mapped to a rounded cap)
  barSize?: number; // thickness of each radial bar in pixels
  showBackground?: boolean; // renders the unfilled track behind each bar
  isClickable?: boolean; // lets bars be selected by clicking them
  glowingBars?: string[]; // names of bars rendered with a soft glow
}

/**
 * The radial bar series. Each data row becomes one concentric ring. Pass
 * `glowingBars` to highlight specific bars and `isClickable` to make bars
 * selectable. Renders nothing — the root reads these props to build the series.
 */
export const RadialBar: FC<RadialBarProps> = () => null;

export interface TooltipProps {
  variant?: TooltipVariant; // visual style of the tooltip surface
  roundness?: TooltipRoundness; // border-radius of the tooltip
  defaultIndex?: number; // data index shown by default with no hover
}

/** Presence enables the hover tooltip. Renders nothing. */
export const Tooltip: FC<TooltipProps> = () => null;

export interface LegendProps {
  variant?: LegendVariant; // visual style of the legend indicators
  align?: "left" | "center" | "right"; // horizontal placement
  verticalAlign?: "top" | "middle" | "bottom"; // vertical placement
  isClickable?: boolean; // lets each entry toggle selection of its bar
}

/** Presence enables the HTML legend overlay. Renders nothing. */
export const Legend: FC<LegendProps> = () => null;

// ─────────────────────────────────────────────────────────────────────────────
// Children collection — walk the declarative config into plain objects the
// option builder consumes. A missing part becomes an absent slot.
// ─────────────────────────────────────────────────────────────────────────────

type RadialBarSlot = {
  present: boolean;
  dataKey: string;
  cornerRadius: number;
  barSize: number;
  showBackground: boolean;
  isClickable: boolean;
  glowingBars: string[];
};
type TooltipSlot = {
  present: boolean;
  variant: TooltipVariant;
  roundness: TooltipRoundness;
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
  radialBar: RadialBarSlot;
  tooltip: TooltipSlot;
  legend: LegendSlot;
};

function collectConfig(children: ReactNode): CollectedConfig {
  // Defaults hold even when <RadialBar> is omitted, so the loading skeleton
  // (which needs a bar size) always has sane geometry.
  let radialBar: RadialBarSlot = {
    present: false,
    dataKey: "",
    cornerRadius: DEFAULT_CORNER_RADIUS,
    barSize: DEFAULT_BAR_SIZE,
    showBackground: true,
    isClickable: false,
    glowingBars: [],
  };
  let tooltip: TooltipSlot = {
    present: false,
    variant: "default",
    roundness: "lg",
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

    if (type === RadialBar) {
      const props = child.props as RadialBarProps;
      radialBar = {
        present: true,
        dataKey: props.dataKey,
        cornerRadius: props.cornerRadius ?? DEFAULT_CORNER_RADIUS,
        barSize: props.barSize ?? DEFAULT_BAR_SIZE,
        showBackground: props.showBackground ?? true,
        isClickable: props.isClickable ?? false,
        glowingBars: props.glowingBars ?? [],
      };
    } else if (type === Tooltip) {
      const props = child.props as TooltipProps;
      tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
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

  return { radialBar, tooltip, legend };
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
      slots.push(raw ? normalizeColor(raw) : FALLBACK_COLOR);
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

// Diagonal multi-stop color for a bar — a solid string when there is only one
// color, else a top-left→bottom-right LinearGradient across the bar's bounding
// box. Mirrors the Recharts `<linearGradient x1=0 y1=0 x2=1 y2=1>` applied to
// every sector.
function barPaint(slots: string[]): string | echarts.graphic.LinearGradient {
  if (slots.length <= 1) return slots[0] ?? FALLBACK_COLOR;
  const stops = slots.map((color, i) => ({ offset: i / (slots.length - 1), color }));
  return new echarts.graphic.LinearGradient(0, 0, 1, 1, stops);
}

// ─────────────────────────────────────────────────────────────────────────────
// Misc helpers
// ─────────────────────────────────────────────────────────────────────────────

// Angle + center configuration for the chart's arc shape. Angles follow the
// Recharts twin: `full` sweeps a whole clockwise circle from the top; `semi`
// domes over the top from left to right (center pushed low, like cy="70%").
// ECharts' `clockwise: true` makes rising values rotate clockwise on screen.
function getVariantGeometry(variant: RadialVariant): {
  center: [string, string];
  startAngle: number;
  endAngle: number;
} {
  switch (variant) {
    case "semi":
      return { center: ["50%", "70%"], startAngle: 180, endAngle: 0 };
    case "full":
    default:
      return { center: ["50%", "50%"], startAngle: 90, endAngle: -270 };
  }
}

// A "nice" ceiling for the angle-axis max, so the largest ring stops just shy of
// a full wrap (mirrors the auto-scaled domain the Recharts twin derives instead
// of letting the biggest bar close into an ambiguous full circle). ~ECharts'
// default value-axis nicing for a 5-way split.
function niceCeil(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const rough = value / 5;
  const power = Math.floor(Math.log10(rough));
  const base = Math.pow(10, power);
  const fraction = rough / base;
  const niceFraction = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
  const interval = niceFraction * base;
  return Math.ceil(value / interval) * interval;
}

// Skeleton ring values as a smooth random walk in a comfortable band — reads
// like a resting chart instead of raw noise.
function getLoadingData(count: number): number[] {
  const rows: number[] = [];
  let value = 55 + Math.random() * 30;
  for (let i = 0; i < count; i++) {
    value = Math.min(LOADING_MAX, Math.max(40, value + (Math.random() - 0.5) * 30));
    rows.push(Math.round(value));
  }
  return rows;
}

// Gradient stops forming a hard clip window around `center`: full `peak` alpha
// inside, zero outside, with a small sine feather so the edge isn't aliased.
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
// Tooltip / legend HTML — the tooltip DOM lives inside `[data-chart={id}]`, so
// the injected `--color-*` vars and Tailwind classes resolve directly (no color
// read needed here).
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

// Solid var / gradient of vars for a bar indicator — mirrors getIndicatorColorStyle.
function indicatorBackground(key: string, colorsCount: number): string {
  if (colorsCount <= 1) return `var(--color-${key}-0)`;
  const stops = Array.from({ length: colorsCount }, (_, i) => {
    const offset = (i / (colorsCount - 1)) * 100;
    return `var(--color-${key}-${i}) ${offset}%`;
  }).join(", ");
  return `linear-gradient(to right, ${stops})`;
}

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
// Background patterns — a self-contained port of <ChartBackground>. The Recharts
// twin draws these inside a Recharts <ZIndexLayer>; canvas has no such layer, so
// here they render as a plain SVG overlay sitting behind the transparent ECharts
// canvas. Same patterns, same `text-border` tint, same soft edge-fade mask.
// ─────────────────────────────────────────────────────────────────────────────

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
        d="M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z"
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

function ChartBackground({ variant }: { variant: BackgroundVariant }) {
  const baseId = useId().replace(/:/g, "");
  const patternId = `${baseId}-bg-${variant}`;
  const maskId = `${baseId}-bg-edge-fade`;
  const filterId = `${baseId}-bg-blur`;
  const Pattern = BACKGROUND_PATTERNS[variant];

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      width="100%"
      height="100%"
      aria-hidden
    >
      <defs>
        <Pattern id={patternId} />
        {/* Gaussian blur + inset white rect → soft transparent edges. */}
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
// nothing below touches React state or the chart instance, so each fragment can
// be reasoned about (and tested) in isolation.
// ─────────────────────────────────────────────────────────────────────────────

type OptionBuildContext = {
  categories: string[]; // bar names, in data order (inner → outer ring)
  values: number[]; // bar values aligned with categories
  config: ChartConfig;
  radialBar: RadialBarSlot;
  variant: RadialVariant;
  innerRadius: number | string;
  outerRadius: number | string;
  angleMax: number;
  selectedBar: string | null;
  hasSelection: boolean;
  tooltipSlot: TooltipSlot;
  isLoading: boolean;
  loadingData: () => number[];
  resolved: ResolvedColors;
};

// The polar coordinate system: concentric rings live between innerRadius and
// outerRadius, centered per the arc variant.
function buildPolar(ctx: OptionBuildContext): PolarOption {
  const geom = getVariantGeometry(ctx.variant);
  return {
    center: geom.center,
    radius: [ctx.innerRadius, ctx.outerRadius] as (number | string)[],
  };
}

// The VALUE axis: a bar's length is its arc sweep, so the value maps to the
// angle. Fully hidden — the Recharts twin shows no angular ticks or gridlines.
function buildAngleAxis(ctx: OptionBuildContext): AngleAxisOption {
  const geom = getVariantGeometry(ctx.variant);
  return {
    type: "value",
    min: 0,
    max: ctx.angleMax,
    startAngle: geom.startAngle,
    endAngle: geom.endAngle,
    clockwise: true,
    show: false,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { show: false },
    splitLine: { show: false },
  };
}

// The CATEGORY axis: one band per ring. Category index 0 sits innermost, which
// matches the Recharts twin (first data row = innermost ring). Fully hidden.
function buildRadiusAxis(ctx: OptionBuildContext): RadiusAxisOption {
  return {
    type: "category",
    data: ctx.categories,
    show: false,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { show: false },
    splitLine: { show: false },
  };
}

// The unfilled track behind each bar — a full-range ring drawn only when
// `showBackground` is set. ECharts' native `showBackground` always spans a full
// 360° ring even in the `semi` variant, so the track is a real (silent) bar
// series at the axis max instead: it fills exactly the arc range of the chart.
//
// `barGap: "-100%"` is load-bearing: the track and the data ring are two bar
// series sharing one radiusAxis, and ECharts otherwise lays grouped bar series
// out side-by-side — each in its own radial sub-band, so the gray track ends up
// at a different radius than the colored bar. Overlapping the group (same
// barWidth, same barGap) makes the two share one center/radius/thickness by
// construction, so the track EXACTLY underlays its bar in every variant.
function buildTrackSeries(ctx: OptionBuildContext, loading: boolean): BarSeriesOption {
  const { radialBar } = ctx;
  const trackColor = withAlpha(ctx.resolved.tokens.mutedForeground, TRACK_OPACITY);
  return {
    id: loading ? LOADING_TRACK_ID : TRACK_SERIES_ID,
    type: "bar",
    coordinateSystem: "polar",
    polarIndex: 0,
    data: ctx.categories.map(() => ctx.angleMax),
    barWidth: radialBar.barSize,
    barGap: "-100%",
    roundCap: radialBar.cornerRadius > 0,
    silent: true,
    // Static: the track is present from the first frame, only the data rings
    // sweep in (Recharts parity — its background sectors don't animate).
    animation: false,
    emphasis: { disabled: true },
    itemStyle: { color: trackColor },
    z: 1,
  };
}

// Glow layers for the `glowingBars`. Each layer is a silent, wider, low-opacity
// gradient copy of the glowing rings, overlapping the bar via `barGap: "-100%"`
// (same centering guarantee as the track) and sitting above the track but below
// the crisp bar. Non-glowing rings contribute a zero-length (invisible) datum so
// one layer series covers every glowing ring at once. Returns [] when nothing
// glows, so the common case adds no series.
function buildGlowSeries(ctx: OptionBuildContext): BarSeriesOption[] {
  const { categories, values, radialBar, resolved } = ctx;
  const glowing = new Set(radialBar.glowingBars);
  if (glowing.size === 0) return [];

  return GLOW_LAYERS.map((layer, li) => {
    const data = categories.map((name, i) => {
      if (!glowing.has(name)) {
        // Not glowing → no arc on this layer.
        return { value: 0, itemStyle: { color: "transparent" } as BarItemStyle };
      }
      const slots = resolved.series[name] ?? [FALLBACK_COLOR];
      const base = slots[0] ?? FALLBACK_COLOR;
      const itemStyle: BarItemStyle = {
        color: barPaint(slots),
        opacity: layer.opacity,
        shadowBlur: layer.blur,
        shadowColor: base,
      };
      return { value: values[i] ?? 0, itemStyle };
    });

    return {
      id: `${GLOW_SERIES_ID}-${li}`,
      type: "bar",
      coordinateSystem: "polar",
      polarIndex: 0,
      data,
      barWidth: radialBar.barSize + layer.widthAdd,
      barGap: "-100%",
      roundCap: radialBar.cornerRadius > 0,
      silent: true,
      emphasis: { disabled: true },
      tooltip: { show: false },
      z: 2, // above the track (z 1), below the crisp bar (z 3)
    };
  });
}

// The data rings. Each datum carries its own diagonal color fill and selection
// dim; the glow for `glowingBars` is drawn by buildGlowSeries as underlays.
function buildBarSeries(ctx: OptionBuildContext): BarSeriesOption[] {
  const { categories, values, radialBar, selectedBar, hasSelection, resolved } = ctx;

  const data = categories.map((name, i) => {
    const slots = resolved.series[name] ?? [FALLBACK_COLOR];
    const isSelected = selectedBar === null || selectedBar === name;
    // Selection only dims when the bar is actually clickable (Recharts twin).
    const dimmed = radialBar.isClickable && hasSelection && !isSelected;

    // The glow is drawn by separate underlay series (buildGlowSeries), so the
    // crisp bar itself carries no shadow — just its gradient fill and dim.
    const itemStyle: BarItemStyle = {
      color: barPaint(slots),
      opacity: dimmed ? SELECTED_DIM_OPACITY : 1,
    };

    return { value: values[i] ?? 0, itemStyle };
  });

  const main: BarSeriesOption = {
    id: MAIN_SERIES_ID,
    type: "bar",
    coordinateSystem: "polar",
    polarIndex: 0,
    data,
    barWidth: radialBar.barSize,
    // Overlap the track + glow layers (see buildTrackSeries) so every series
    // shares one center/radius/thickness instead of being grouped side-by-side.
    barGap: "-100%",
    roundCap: radialBar.cornerRadius > 0,
    cursor: radialBar.isClickable ? "pointer" : "default",
    // The radial twin has no hover-highlight, so bars don't emphasise on hover.
    emphasis: { disabled: true },
    z: 3, // above the glow underlays (z 2) and the track (z 1)
  };

  // Main first (index 0) so `showTip` can target it by a stable index; z keeps it
  // above the track/glow regardless of array order. Glow underlays and the track
  // follow — all share the overlapped bar group.
  return [
    main,
    ...buildGlowSeries(ctx),
    ...(radialBar.showBackground ? [buildTrackSeries(ctx, false)] : []),
  ];
}

// Tooltip HTML builder, closed over the build context. `trigger: "item"` — each
// ring is an item; hovering one shows that bar. Labels by name (hideLabel parity:
// no separate header row).
function buildTooltipOption(ctx: OptionBuildContext): TooltipComponentOption {
  const { tooltipSlot, config, categories, isLoading } = ctx;

  const formatter = (params: unknown): string => {
    const p = (Array.isArray(params) ? params[0] : params) as {
      dataIndex?: number;
      value?: number | string;
      seriesId?: string;
    };
    if (p == null || String(p.seriesId ?? "").startsWith("__")) return "";

    const index = typeof p.dataIndex === "number" ? p.dataIndex : 0;
    const key = categories[index] ?? "";
    const item = config[key];
    const colorsCount = item ? getColorsCount(item) : 1;
    const labelText = typeof item?.label === "string" ? item.label : key;
    const value = typeof p.value === "number" ? p.value.toLocaleString() : String(p.value ?? "");

    const row = `<div class="flex w-full flex-wrap items-center gap-2">
      <div class="h-2.5 w-2.5 shrink-0 rounded-[2px]" style="background:${indicatorBackground(key, colorsCount)}"></div>
      <div class="flex flex-1 items-center justify-between gap-4 leading-none">
        <span class="text-muted-foreground">${labelText}</span>
        <span class="text-foreground font-mono font-medium tabular-nums">${value}</span>
      </div>
    </div>`;

    return `<div class="grid min-w-32 items-start gap-1.5 border border-border/50 px-2.5 py-1.5 text-xs shadow-xl ${roundnessClass[tooltipSlot.roundness]} ${tooltipVariantClass[tooltipSlot.variant]}">
      <div class="grid gap-1.5">${row}</div>
    </div>`;
  };

  return {
    show: tooltipSlot.present && !isLoading,
    trigger: "item",
    confine: true,
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    extraCssText: "box-shadow:none;",
    formatter,
  };
}

// Loading skeleton — a faint set of full rings (the always-visible track) with a
// bright band CLIPPED to a sweeping window on top (the `__loading` rings). One
// gray skeleton regardless of the real data, matching the area twin's approach.
function buildLoadingOption(ctx: OptionBuildContext): EChartsOption {
  const { tokens } = ctx.resolved;
  const loadingCats = Array.from({ length: LOADING_BARS }, (_, i) => String(i));
  const loadingCtx: OptionBuildContext = {
    ...ctx,
    categories: loadingCats,
    angleMax: LOADING_MAX,
  };

  return {
    animation: false,
    polar: buildPolar(loadingCtx),
    angleAxis: buildAngleAxis(loadingCtx),
    radiusAxis: buildRadiusAxis(loadingCtx),
    tooltip: { show: false },
    series: [
      buildTrackSeries(loadingCtx, true),
      {
        id: LOADING_SERIES_ID,
        type: "bar",
        coordinateSystem: "polar",
        polarIndex: 0,
        data: ctx.loadingData(),
        barWidth: loadingCtx.radialBar.barSize,
        // Overlap the loading track so the shimmer rings ride exactly on it.
        barGap: "-100%",
        roundCap: loadingCtx.radialBar.cornerRadius > 0,
        silent: true,
        emphasis: { disabled: true },
        // Invisible until the first shimmer tick positions the clip window.
        itemStyle: { color: withAlpha(tokens.foreground, 0) },
        z: 2,
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Live imperative state — everything the ECharts event handlers, rAF loop, and
// theme/resize repushes read or write OUTSIDE the React render cycle, grouped in
// one ref-stable object so the whole imperative surface is visible at a glance.
// None of it is render output, which is exactly why it is not React state.
// ─────────────────────────────────────────────────────────────────────────────

type LiveState = {
  resolved: ResolvedColors | null; // colors read off the live DOM — feeds builds and the shimmer loop
  hasRevealed: boolean; // the intro sweep already played on this chart instance
  loadingRows: number[] | null; // skeleton data, lazily rolled and re-rolled per shimmer sweep
  categories: string[]; // bar names of the last build (click → name lookup)
  valueByName: Map<string, number>; // bar values (legend/click → selection value)
  handlers: { clickable: boolean }; // latest flags for the imperative click handler
  // Update-style re-push for paths that bypass React entirely (theme flips,
  // resizes) — set by the sync effect.
  repush: () => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apache ECharts port of the EvilCharts radial chart, exposing a
 * compound-as-config API so its JSX reads identically to the Recharts twin. The
 * root owns the data, config, selection state, loading skeleton, and intro
 * reveal; every visual part — `<RadialBar>`, `<Tooltip>`, `<Legend>` — is
 * composed as a declarative child that renders nothing. The root walks those
 * children by reference and drives a single imperative ECharts instance. Fully
 * self-contained: its only dependencies are `react`, `echarts`, and `motion`.
 */
export function EChartsRadialChart<TData extends Record<string, unknown>>({
  data,
  config,
  nameKey,
  className,
  variant = "full",
  innerRadius = DEFAULT_INNER_RADIUS,
  outerRadius = DEFAULT_OUTER_RADIUS,
  defaultSelectedDataKey = null,
  onSelectionChange,
  isLoading = false,
  backgroundVariant,
  chartOptions,
  children,
}: EChartsRadialChartProps<TData>) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<EChartsInstance | null>(null);

  // The single imperative surface (see LiveState). `resolved` lives here rather
  // than in state: as state it would force an extra render pass and an effect
  // whose only job is to trigger the option push — the "chain of computations"
  // react.dev/learn/you-might-not-need-an-effect warns about. The object
  // identity is stable for the component's lifetime.
  const live = useRef<LiveState>({
    resolved: null,
    hasRevealed: false,
    loadingRows: null,
    categories: [],
    valueByName: new Map<string, number>(),
    handlers: { clickable: false },
    repush: () => {},
  }).current;

  // Skeleton rows roll lazily on first use — an impure useRef initializer would
  // re-roll Math.random() on every render.
  const loadingData = useCallback(
    () => (live.loadingRows ??= getLoadingData(LOADING_BARS)),
    [live],
  );
  const shouldReduceMotion = useReducedMotion();

  const [selectedBar, setSelectedBar] = useState<string | null>(defaultSelectedDataKey);

  // ── Declarative config, collected from children by reference ─────────────────
  const collected = useMemo(() => collectConfig(children), [children]);
  const { radialBar, tooltip: tooltipSlot, legend: legendSlot } = collected;

  const configKeys = useMemo(() => Object.keys(config), [config]);

  // Bar names + values, in data order (index 0 → innermost ring).
  const categories = useMemo(() => data.map((row) => String(row[nameKey])), [data, nameKey]);
  const values = useMemo(
    () => data.map((row) => Number(row[radialBar.dataKey]) || 0),
    [data, radialBar.dataKey],
  );

  // Nice ceiling for the angle axis so the largest ring stops just shy of a full
  // wrap (Recharts derives an auto-scaled domain; the exact niced max differs
  // slightly but keeps the same look).
  const angleMax = useMemo(() => niceCeil(Math.max(0, ...values)), [values]);

  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);
  const hasSelection = selectedBar !== null;

  // Refresh the imperative snapshots every render so the click handler and the
  // legend/click selection see current values.
  live.categories = categories;
  live.handlers = { clickable: radialBar.isClickable };
  live.valueByName = useMemo(() => {
    const map = new Map<string, number>();
    categories.forEach((name, i) => map.set(name, values[i] ?? 0));
    return map;
  }, [categories, values]);

  // Toggle selection and notify the parent with the bar's value (or null on
  // deselect). Selecting the active bar clears the selection.
  const toggleSelection = useCallback(
    (name: string) => {
      setSelectedBar((prev) => {
        const next = prev === name ? null : name;
        onSelectionChange?.(
          next === null ? null : { dataKey: next, value: live.valueByName.get(next) ?? 0 },
        );
        return next;
      });
    },
    [onSelectionChange, live],
  );

  // ── Option builder ───────────────────────────────────────────────────────────
  // Thin orchestrator over the pure builders: snapshot the resolved colors into
  // an OptionBuildContext, then assemble.
  const buildOption = useCallback((): EChartsOption => {
    const resolved = live.resolved;
    if (!resolved) return {};

    const ctx: OptionBuildContext = {
      categories,
      values,
      config,
      radialBar,
      variant,
      innerRadius,
      outerRadius,
      angleMax,
      selectedBar,
      hasSelection,
      tooltipSlot,
      isLoading,
      loadingData,
      resolved,
    };

    if (isLoading) return buildLoadingOption(ctx);

    return {
      animation: false,
      polar: buildPolar(ctx),
      angleAxis: buildAngleAxis(ctx),
      radiusAxis: buildRadiusAxis(ctx),
      tooltip: buildTooltipOption(ctx),
      series: buildBarSeries(ctx),
    };
  }, [
    live,
    categories,
    values,
    config,
    radialBar,
    variant,
    innerRadius,
    outerRadius,
    angleMax,
    selectedBar,
    hasSelection,
    tooltipSlot,
    isLoading,
    loadingData,
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
      // no-op fire would land one frame into the intro and stomp the reveal —
      // only react when the renderer size actually changed.
      if (mount.clientWidth === chart.getWidth() && mount.clientHeight === chart.getHeight()) {
        return;
      }
      chart.resize();
      live.repush();
    });
    resizeObserver.observe(mount);

    // Light/dark flips change no React state — re-resolve and push directly.
    const themeObserver = new MutationObserver(() => live.repush());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    chart.on("click", (params) => {
      if (!live.handlers.clickable) return;
      const p = params as { seriesId?: string; dataIndex?: number; componentType?: string };
      // Only the main ring series is clickable; the track/skeleton are silent.
      if (p.componentType !== "series" || p.seriesId !== MAIN_SERIES_ID) return;
      if (typeof p.dataIndex !== "number") return;
      const name = live.categories[p.dataIndex];
      if (name != null) toggleSelection(name);
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
    live.resolved = resolveColors(container, config, configKeys);

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

      // Show the default tooltip once the option is in place (item trigger →
      // target the main series by its stable index).
      if (!isLoading && tooltipSlot.present && tooltipSlot.defaultIndex != null) {
        chart.dispatchAction({
          type: "showTip",
          seriesIndex: 0,
          dataIndex: tooltipSlot.defaultIndex,
        });
      }
    };

    // Intro reveal — ECharts' native bar sweep, enabled only for the first real
    // render. Every later push (selection, theme) applies instantly, since
    // notMerge would otherwise replay the entrance on each of them. A loading
    // cycle re-arms it: the Recharts twin remounts its <RadialBar> while loading
    // and replays the intro, so data → loading → data sweeps in again here too.
    if (isLoading) live.hasRevealed = false;
    const shouldReveal = !live.hasRevealed && !isLoading;
    if (shouldReveal) live.hasRevealed = true;
    const revealEnabled = shouldReveal && !shouldReduceMotion;
    push(revealEnabled);

    // Theme flips and resizes re-enter here without touching React: re-read the
    // tokens (the .dark class changed) and push an update-style option.
    live.repush = () => {
      live.resolved = resolveColors(container, config, configKeys);
      push(false);
    };
  }, [
    live,
    buildOption,
    chartOptions,
    isLoading,
    shouldReduceMotion,
    config,
    configKeys,
    tooltipSlot,
  ]);

  // ── Loading shimmer — rAF sweeps a bright band, regenerating data off-screen ──
  useEffect(() => {
    const chart = echartsRef.current;
    if (!chart || !isLoading) return;

    let raf = 0;
    let lastPhase = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const phase = ((((now - start) / LOADING_ANIMATION_DURATION) % 1) + 1) % 1;
      // Wrapped past 1 → the band is off-screen; swap in fresh random data.
      if (phase < lastPhase) live.loadingRows = getLoadingData(LOADING_BARS);
      lastPhase = phase;

      // Read tokens per frame, so a theme flip mid-loading retints the shimmer.
      const foreground = live.resolved?.tokens.foreground ?? FALLBACK_COLOR;
      const w = chart.getWidth();
      const h = chart.getHeight();
      if (!w || !h) {
        raf = requestAnimationFrame(tick);
        return;
      }
      // Sweep the clip window from fully off-screen to fully off-screen along a
      // 45° axis (ABSOLUTE pixel coords via the gradient's `global` flag), so
      // every ring is cut by the same diagonal band.
      const maxT = (w + h) / (2 * w);
      const center = phase * (maxT + 2 * LOADING_SHIMMER_BAND) - LOADING_SHIMMER_BAND;
      const clip = new echarts.graphic.LinearGradient(
        0,
        0,
        w,
        w,
        shimmerWindowStops(center, foreground, LOADING_SHIMMER_MAX_OPACITY),
        true,
      );
      chart.setOption(
        { series: [{ id: LOADING_SERIES_ID, data: loadingData(), itemStyle: { color: clip } }] },
        { silent: true, lazyUpdate: true },
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, isLoading, loadingData]);

  // ── Legend overlay (HTML) ─────────────────────────────────────────────────────
  // One entry per ring. Unlike the area twin's absolutely-positioned legend, the
  // top/bottom placements flow above/below the canvas so they RESERVE space —
  // the polar plot shrinks to fit, matching how Recharts lays the legend out.
  // `middle` overlays, centered.
  const legendJustify =
    legendSlot.align === "left"
      ? "justify-start"
      : legendSlot.align === "center"
        ? "justify-center"
        : "justify-end";

  const renderLegend = (overlay: boolean) => (
    <div
      className={`flex flex-wrap items-center gap-3 px-4 select-none ${legendJustify} ${
        overlay ? "pointer-events-auto absolute inset-x-4 top-1/2 -translate-y-1/2" : "py-2"
      }`}
    >
      {categories.map((name) => {
        const item = config[name];
        const colorsCount = item ? getColorsCount(item) : 1;
        const isActive = selectedBar === null || selectedBar === name;
        return (
          <div
            key={name}
            className={`flex items-center gap-1.5 transition-opacity ${
              !isActive ? "opacity-30" : ""
            } ${legendSlot.isClickable ? "cursor-pointer" : ""}`}
            onClick={() => {
              if (legendSlot.isClickable) toggleSelection(name);
            }}
          >
            <LegendIndicator
              variant={legendSlot.variant}
              dataKey={name}
              colorsCount={colorsCount}
            />
            {item?.label ?? name}
          </div>
        );
      })}
    </div>
  );

  const showLegend = legendSlot.present && !isLoading;
  const legendTop = showLegend && legendSlot.verticalAlign === "top";
  const legendBottom = showLegend && legendSlot.verticalAlign === "bottom";
  const legendMiddle = showLegend && legendSlot.verticalAlign === "middle";

  return (
    <div
      ref={containerRef}
      data-chart={chartId}
      className={`relative flex flex-col text-xs ${className ?? ""}`}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {legendTop && renderLegend(false)}

      <div className="relative min-h-0 w-full flex-1">
        {backgroundVariant && <ChartBackground variant={backgroundVariant} />}
        {/* Canvas is transparent, so the background SVG shows through behind it. */}
        <div ref={mountRef} className="relative z-10 h-full min-h-0 w-full" />
        {legendMiddle && renderLegend(true)}
      </div>

      {legendBottom && renderLegend(false)}

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

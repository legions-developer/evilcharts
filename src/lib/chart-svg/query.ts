// Shared query contract for the chart tools: the style constants, the zod
// schema for every styling option, the param parsers/clampers, and the URL
// builder for those options. Each tool composes this with its own
// data-source field (repos / packages) and extras.

import { z } from "zod";
import type {
  AxisType,
  BackgroundPattern,
  ChartType,
  FillPattern,
  StrokeVariant,
  ThemeName,
} from "./types";

export const THEMES = ["light", "dark"] as const;
export const CHART_TYPES = ["line", "bar", "radial", "radial-half", "pie"] as const;
export const AXIS_TYPES = ["date", "timeline"] as const;
export const FILL_PATTERNS = ["gradient", "solid", "hatched", "lines", "dotted"] as const;
export const STROKE_VARIANTS = ["solid", "dashed", "animated-dashed"] as const;
export const BACKGROUND_PATTERNS = [
  "none",
  "dots",
  "grid",
  "cross-hatch",
  "diagonal-lines",
  "plus",
  "falling-triangles",
  "4-pointed-star",
  "tiny-checkers",
  "overlapping-circles",
  "wiggle-lines",
  "bubbles",
] as const;
export const STROKE_WIDTHS = [1, 2, 3, 4] as const;
/** Auto-replay intervals (seconds); 0 means the animation runs once and holds. */
export const LOOP_INTERVALS = [0, 5, 10, 30, 60] as const;
export const MAX_AXIS_LABEL_OFFSET = 40;
export const MIN_STROKE_WIDTH = 1;
export const MAX_STROKE_WIDTH = 4;
export const MIN_DOT_SIZE = 0;
export const MAX_DOT_SIZE = 8;
export const DEFAULT_DOT_SIZE = 3;
// Radial ring band thickness (px) and the pie donut-hole percent.
export const MIN_RING_WIDTH = 5;
export const MAX_RING_WIDTH = 48;
export const DEFAULT_RING_WIDTH = 18;
export const MAX_PIE_INNER_RADIUS = 80;
export const MAX_FILL_OPACITY = 100;

const hexColor = z
  .string()
  .trim()
  .regex(/^#?[0-9a-fA-F]{6}$/, "Invalid hex color")
  .transform((s) => `#${s.replace(/^#/, "").toLowerCase()}`);

/**
 * Zod shape for every chart styling option. A tool builds its full schema with
 * `z.object({ ...chartStyleShape, repos: ... })` so it can add its own fields.
 */
export const chartStyleShape = {
  colors: z.array(hexColor),
  theme: z.enum(THEMES),
  chartType: z.enum(CHART_TYPES),
  axis: z.enum(AXIS_TYPES),
  animate: z.boolean(),
  loopInterval: z.union(
    LOOP_INTERVALS.map((n) => z.literal(n)) as [
      z.ZodLiteral<number>,
      z.ZodLiteral<number>,
      ...z.ZodLiteral<number>[],
    ],
  ),
  axisLabels: z.boolean(),
  axisLabelOffset: z.number().int().min(0).max(MAX_AXIS_LABEL_OFFSET),
  strokeWidth: z.number().int().min(MIN_STROKE_WIDTH).max(MAX_STROKE_WIDTH),
  dotSize: z.number().int().min(MIN_DOT_SIZE).max(MAX_DOT_SIZE),
  fillOpacity: z.number().int().min(0).max(MAX_FILL_OPACITY),
  fillFade: z.number().int().min(0).max(MAX_FILL_OPACITY),
  fillPattern: z.enum(FILL_PATTERNS),
  strokeVariant: z.enum(STROKE_VARIANTS),
  backgroundPattern: z.enum(BACKGROUND_PATTERNS),
  backgroundPatternOpacity: z.number().int().min(0).max(MAX_FILL_OPACITY),
  radialRingWidth: z.number().int().min(MIN_RING_WIDTH).max(MAX_RING_WIDTH),
  pieInnerRadius: z.number().int().min(0).max(MAX_PIE_INNER_RADIUS),
  from: z.number().int().optional(),
  to: z.number().int().optional(),
};

/** Parse the axis-label offset param, clamped to a valid range (0 when absent). */
function clampOffset(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(Math.max(n, 0), MAX_AXIS_LABEL_OFFSET);
}

/** Parse the stroke-width param, clamped to a valid range (2 when absent/invalid). */
function clampStroke(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(n)) return 2;
  return Math.min(Math.max(n, MIN_STROKE_WIDTH), MAX_STROKE_WIDTH);
}

/** Parse the dot-size param, clamped to a valid range (default when absent/invalid). */
function clampDotSize(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(n)) return DEFAULT_DOT_SIZE;
  return Math.min(Math.max(n, MIN_DOT_SIZE), MAX_DOT_SIZE);
}

/** Parse the fill-opacity param (percent), clamped to 0–100 (25 when absent/invalid). */
function clampFillOpacity(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(n)) return 25;
  return Math.min(Math.max(n, 0), MAX_FILL_OPACITY);
}

/** Parse the fill-fade param (percent), clamped to 0–100 (0 when absent/invalid). */
function clampFillFade(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(Math.max(n, 0), MAX_FILL_OPACITY);
}

/** Parse the background-pattern opacity param (percent), 0–100 (100 when absent). */
function clampBgPatternOpacity(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(n)) return 100;
  return Math.min(Math.max(n, 0), MAX_FILL_OPACITY);
}

/** Parse the loop-interval param, snapped to a valid option (0 when absent/invalid). */
function parseLoopInterval(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  return (LOOP_INTERVALS as readonly number[]).includes(n) ? n : 0;
}

/** Parse the radial ring-width param (px), clamped to range (default when absent). */
function clampRingWidth(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(n)) return DEFAULT_RING_WIDTH;
  return Math.min(Math.max(n, MIN_RING_WIDTH), MAX_RING_WIDTH);
}

/** Parse the pie inner-radius param (percent), clamped to 0–80 (0 when absent). */
function clampPieInnerRadius(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(Math.max(n, 0), MAX_PIE_INNER_RADIUS);
}

/**
 * Read every chart styling param from a query string into the raw object a
 * tool's schema validates. The tool merges in its own data field, e.g.
 * `{ ...parseChartStyleParams(params), repos: params.getAll("repo") }`.
 */
export function parseChartStyleParams(params: URLSearchParams) {
  const dateToMs = (key: string): number | undefined => {
    const raw = params.get(key);
    if (!raw) return undefined;
    const ms = Date.parse(raw);
    return Number.isNaN(ms) ? undefined : ms;
  };

  return {
    colors: params.getAll("color"),
    theme: params.get("theme") ?? "light",
    chartType: params.get("chart") ?? "line",
    axis: params.get("axis") ?? "date",
    animate: params.get("animate") !== "0",
    loopInterval: parseLoopInterval(params.get("loop")),
    axisLabels: params.get("labels") === "1",
    axisLabelOffset: clampOffset(params.get("labelOffset")),
    strokeWidth: clampStroke(params.get("stroke")),
    dotSize: clampDotSize(params.get("dotSize")),
    fillOpacity: clampFillOpacity(params.get("fillOpacity")),
    fillFade: clampFillFade(params.get("fillFade")),
    fillPattern: params.get("pattern") ?? "gradient",
    strokeVariant: params.get("strokeVariant") ?? "solid",
    backgroundPattern: params.get("bgPattern") ?? "none",
    backgroundPatternOpacity: clampBgPatternOpacity(params.get("bgPatternOpacity")),
    radialRingWidth: clampRingWidth(params.get("ringWidth")),
    pieInnerRadius: clampPieInnerRadius(params.get("pieHole")),
    from: dateToMs("from"),
    to: dateToMs("to"),
  };
}

/** Chart styling fields a tool's URL builder feeds into `appendChartStyleParams`. */
export interface ChartStyleUrlInput {
  theme: ThemeName;
  chartType: ChartType;
  axis: AxisType;
  animate: boolean;
  loopInterval: number;
  axisLabels: boolean;
  axisLabelOffset: number;
  strokeWidth: number;
  dotSize: number;
  fillOpacity: number;
  fillFade: number;
  fillPattern: FillPattern;
  strokeVariant: StrokeVariant;
  backgroundPattern: BackgroundPattern;
  backgroundPatternOpacity: number;
  radialRingWidth: number;
  pieInnerRadius: number;
  /** ISO date strings (YYYY-MM-DD) when a custom range is active. */
  from?: string;
  to?: string;
}

/**
 * Append every chart styling param to `params`, omitting defaults to keep the
 * URL short. The data-source params (`repo`/`package` + `color`) are
 * positional, so the caller appends those itself before calling this.
 */
export function appendChartStyleParams(
  params: URLSearchParams,
  input: ChartStyleUrlInput,
): void {
  params.set("theme", input.theme);
  if (input.chartType !== "line") params.set("chart", input.chartType);
  params.set("axis", input.axis);
  params.set("animate", input.animate ? "1" : "0");
  if (input.animate && input.loopInterval > 0) {
    params.set("loop", String(input.loopInterval));
  }
  if (input.axisLabels) {
    params.set("labels", "1");
    if (input.axisLabelOffset > 0) params.set("labelOffset", String(input.axisLabelOffset));
  }
  if (input.strokeWidth !== 2) params.set("stroke", String(input.strokeWidth));
  if (input.dotSize !== DEFAULT_DOT_SIZE) params.set("dotSize", String(input.dotSize));
  if (input.fillOpacity !== 25) params.set("fillOpacity", String(input.fillOpacity));
  if (input.fillFade > 0) params.set("fillFade", String(input.fillFade));
  if (input.fillPattern !== "gradient") params.set("pattern", input.fillPattern);
  if (input.strokeVariant !== "solid") params.set("strokeVariant", input.strokeVariant);
  if (input.backgroundPattern !== "none") {
    params.set("bgPattern", input.backgroundPattern);
    if (input.backgroundPatternOpacity !== 100) {
      params.set("bgPatternOpacity", String(input.backgroundPatternOpacity));
    }
  }
  if (input.chartType === "radial" || input.chartType === "radial-half") {
    if (input.radialRingWidth !== DEFAULT_RING_WIDTH) {
      params.set("ringWidth", String(input.radialRingWidth));
    }
  }
  if (input.chartType === "pie" && input.pieInnerRadius > 0) {
    params.set("pieHole", String(input.pieInnerRadius));
  }
  if (input.from) params.set("from", input.from);
  if (input.to) params.set("to", input.to);
}

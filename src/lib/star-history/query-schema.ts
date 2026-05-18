// Single source of truth for the /api/star-history query contract:
// the zod schema + parser used by the route, and the URL builder used by the page.

import { z } from "zod";
import type { AxisType, FillPattern, ThemeName } from "./types";

export const THEMES = ["light", "dark"] as const;
export const AXIS_TYPES = ["date", "timeline"] as const;
export const FILL_PATTERNS = ["gradient", "solid", "hatched", "lines", "dotted"] as const;
export const STROKE_WIDTHS = [1, 2, 3, 4] as const;
export const MAX_REPOS = 8;
export const MAX_AXIS_LABEL_OFFSET = 40;
export const MIN_STROKE_WIDTH = 1;
export const MAX_STROKE_WIDTH = 4;
export const MAX_FILL_OPACITY = 100;

const hexColor = z
  .string()
  .trim()
  .regex(/^#?[0-9a-fA-F]{6}$/, "Invalid hex color")
  .transform((s) => `#${s.replace(/^#/, "").toLowerCase()}`);

export const starHistoryQuerySchema = z.object({
  repos: z
    .array(z.string().trim().min(1))
    .min(1, "Add at least one repository")
    .max(MAX_REPOS, `At most ${MAX_REPOS} repositories`),
  colors: z.array(hexColor),
  theme: z.enum(THEMES),
  axis: z.enum(AXIS_TYPES),
  transparent: z.boolean(),
  animate: z.boolean(),
  axisLabels: z.boolean(),
  axisLabelOffset: z.number().int().min(0).max(MAX_AXIS_LABEL_OFFSET),
  strokeWidth: z.number().int().min(MIN_STROKE_WIDTH).max(MAX_STROKE_WIDTH),
  fillOpacity: z.number().int().min(0).max(MAX_FILL_OPACITY),
  fillPattern: z.enum(FILL_PATTERNS),
  /** Background fill override — the in-app preview uses it to swap the dark
   *  GitHub canvas for the site surface. Omitted = theme default. */
  background: hexColor.optional(),
  from: z.number().int().optional(),
  to: z.number().int().optional(),
});

export type StarHistoryQuery = z.infer<typeof starHistoryQuerySchema>;

/** Validate a raw hex query value, returning a normalized `#rrggbb` or undefined. */
export function parseHexParam(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const result = hexColor.safeParse(raw);
  return result.success ? result.data : undefined;
}

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

/** Parse the fill-opacity param (percent), clamped to 0–100 (25 when absent/invalid). */
function clampFillOpacity(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(n)) return 25;
  return Math.min(Math.max(n, 0), MAX_FILL_OPACITY);
}

/** Parse + validate an incoming request's query params. */
export function parseStarHistoryQuery(params: URLSearchParams) {
  const dateToMs = (key: string): number | undefined => {
    const raw = params.get(key);
    if (!raw) return undefined;
    const ms = Date.parse(raw);
    return Number.isNaN(ms) ? undefined : ms;
  };

  return starHistoryQuerySchema.safeParse({
    repos: params.getAll("repo"),
    colors: params.getAll("color"),
    theme: params.get("theme") ?? "light",
    axis: params.get("axis") ?? "date",
    transparent: params.get("transparent") === "1",
    animate: params.get("animate") !== "0",
    axisLabels: params.get("labels") === "1",
    axisLabelOffset: clampOffset(params.get("labelOffset")),
    strokeWidth: clampStroke(params.get("stroke")),
    fillOpacity: clampFillOpacity(params.get("fillOpacity")),
    fillPattern: params.get("pattern") ?? "gradient",
    background: params.get("bg") ?? undefined,
    from: dateToMs("from"),
    to: dateToMs("to"),
  });
}

export interface StarHistoryUrlInput {
  /** Each repo carries its color so `repo`/`color` params stay positionally aligned. */
  repos: { value: string; color: string }[];
  theme: ThemeName;
  axis: AxisType;
  transparent: boolean;
  animate: boolean;
  /** Draw axis titles beside the ticks. */
  axisLabels: boolean;
  /** Extra gap (px) between the axis titles and the chart. */
  axisLabelOffset: number;
  /** Chart line stroke width (px) — one of 1–4. */
  strokeWidth: number;
  /** Area fill opacity as a percent (0–100). */
  fillOpacity: number;
  /** Area fill style. */
  fillPattern: FillPattern;
  /** Background override (`#rrggbb`) — omit to use the theme default. */
  background?: string;
  /** ISO date strings (YYYY-MM-DD) when a custom range is active. */
  from?: string;
  to?: string;
}

/** Build the /api/star-history URL from page config. `base` may be an absolute origin. */
export function buildStarHistoryUrl(input: StarHistoryUrlInput, base = ""): string {
  const params = new URLSearchParams();
  for (const repo of input.repos) {
    const value = repo.value.trim();
    if (!value) continue;
    params.append("repo", value);
    params.append("color", repo.color);
  }
  params.set("theme", input.theme);
  params.set("axis", input.axis);
  params.set("animate", input.animate ? "1" : "0");
  if (input.transparent) params.set("transparent", "1");
  if (input.axisLabels) {
    params.set("labels", "1");
    if (input.axisLabelOffset > 0) params.set("labelOffset", String(input.axisLabelOffset));
  }
  if (input.strokeWidth !== 2) params.set("stroke", String(input.strokeWidth));
  if (input.fillOpacity !== 25) params.set("fillOpacity", String(input.fillOpacity));
  if (input.fillPattern !== "gradient") params.set("pattern", input.fillPattern);
  if (input.background) params.set("bg", input.background);
  if (input.from) params.set("from", input.from);
  if (input.to) params.set("to", input.to);
  return `${base}/api/star-history?${params.toString()}`;
}

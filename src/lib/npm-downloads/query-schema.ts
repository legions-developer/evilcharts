// The /api/npm-downloads query contract: the npm-specific schema + parser +
// URL builder, composed from the shared chart query module. The shared
// styling constants are re-exported so the tool UI keeps one import.

import { z } from "zod";
import {
  appendChartStyleParams,
  chartStyleShape,
  parseChartStyleParams,
  type ChartStyleUrlInput,
} from "@/lib/chart-svg/query";
import type { DownloadMetric } from "./types";

export * from "@/lib/chart-svg/query";

/** Most packages that can be compared on one chart. */
export const MAX_PACKAGES = 8;

/** Download-shaping metrics, in the order shown in the UI. */
export const DOWNLOAD_METRICS = [
  "daily",
  "rolling7",
  "weekly",
  "monthly",
  "cumulative",
] as const satisfies readonly DownloadMetric[];

/** Default metric — the 7-day average is the most readable for noisy data. */
export const DEFAULT_METRIC: DownloadMetric = "rolling7";

export const npmDownloadsQuerySchema = z.object({
  ...chartStyleShape,
  packages: z
    .array(z.string().trim().min(1))
    .min(1, "Add at least one package")
    .max(MAX_PACKAGES, `At most ${MAX_PACKAGES} packages`),
  metric: z.enum(DOWNLOAD_METRICS),
});

export type NpmDownloadsQuery = z.infer<typeof npmDownloadsQuerySchema>;

/** Snap the metric param to a valid option (default when absent/invalid). */
function parseMetric(raw: string | null): DownloadMetric {
  return (DOWNLOAD_METRICS as readonly string[]).includes(raw ?? "")
    ? (raw as DownloadMetric)
    : DEFAULT_METRIC;
}

/** Parse + validate an incoming request's query params. */
export function parseNpmDownloadsQuery(params: URLSearchParams) {
  return npmDownloadsQuerySchema.safeParse({
    ...parseChartStyleParams(params),
    packages: params.getAll("package"),
    metric: parseMetric(params.get("metric")),
  });
}

export interface NpmDownloadsUrlInput extends ChartStyleUrlInput {
  /** Each package carries its color so `package`/`color` params stay aligned. */
  packages: { value: string; color: string }[];
  metric: DownloadMetric;
}

/** Build the /api/npm-downloads URL from page config. `base` may be an absolute origin. */
export function buildNpmDownloadsUrl(input: NpmDownloadsUrlInput, base = ""): string {
  const params = new URLSearchParams();
  for (const pkg of input.packages) {
    const value = pkg.value.trim();
    if (!value) continue;
    params.append("package", value);
    params.append("color", pkg.color);
  }
  if (input.metric !== DEFAULT_METRIC) params.set("metric", input.metric);
  appendChartStyleParams(params, input);
  return `${base}/api/npm-downloads?${params.toString()}`;
}

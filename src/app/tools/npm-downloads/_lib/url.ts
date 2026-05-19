// URL builder for the npm-downloads tool. The chart SVG is always transparent,
// so the in-app preview and the exported embed fetch the exact same URL — the
// preview just renders it on a theme-matched surface.

import { buildNpmDownloadsUrl, type NpmDownloadsUrlInput } from "@/lib/npm-downloads/query-schema";
import type { ThemeName } from "@/lib/chart-svg/types";

import type { NpmDownloadsConfig } from "./state";

/**
 * Surface the in-app preview renders the (transparent) chart on, per chart
 * theme — light is white, dark is the site's near-black. This is only a
 * viewing canvas; the exported SVG carries no background of its own.
 */
export const PREVIEW_SURFACE: Record<ThemeName, string> = {
  light: "#ffffff",
  dark: "#0a0a0a",
};

/** npm download stats begin 2015-01-10 — "Lifetime" spans from there to today. */
const NPM_EARLIEST_ISO = "2015-01-10";

/**
 * Local-date `YYYY-MM-DD`. The calendar yields local-midnight Dates, so
 * `toISOString()` would shift the day in non-UTC timezones — read the local
 * date parts instead.
 */
const toIso = (date: Date): string => {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

function toUrlInput(config: NpmDownloadsConfig): NpmDownloadsUrlInput {
  const { mode, from, to } = config.range;
  // Lifetime spans the whole npm dataset; custom uses the picked dates.
  const rangeFrom = mode === "custom" ? (from ? toIso(from) : undefined) : NPM_EARLIEST_ISO;
  const rangeTo = mode === "custom" ? (to ? toIso(to) : undefined) : toIso(new Date());

  return {
    packages: config.packages
      .filter((p) => p.value.trim())
      .map((p) => ({ value: p.value.trim(), color: p.color })),
    metric: config.metric,
    theme: config.theme,
    chartType: config.chartType,
    axis: config.axis,
    animate: config.animate,
    loopInterval: config.loopInterval,
    axisLabels: config.axisLabels,
    axisLabelOffset: config.axisLabelOffset,
    strokeWidth: config.strokeWidth,
    dotSize: config.dotSize,
    fillOpacity: config.fillOpacity,
    fillFade: config.fillFade,
    fillPattern: config.fillPattern,
    strokeVariant: config.strokeVariant,
    backgroundPattern: config.backgroundPattern,
    backgroundPatternOpacity: config.backgroundPatternOpacity,
    radialRingWidth: config.radialRingWidth,
    pieInnerRadius: config.pieInnerRadius,
    from: rangeFrom,
    to: rangeTo,
  };
}

/** Build the /api/npm-downloads URL for the current config — preview and embed alike. */
export function buildChartUrl(config: NpmDownloadsConfig): string {
  return buildNpmDownloadsUrl(toUrlInput(config));
}

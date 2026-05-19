// URL builder for the star-history tool. The chart SVG is always transparent,
// so the in-app preview and the exported embed fetch the exact same URL — the
// preview just renders it on a theme-matched surface.

import { buildStarHistoryUrl, type StarHistoryUrlInput } from "@/lib/star-history/query-schema";
import type { ThemeName } from "@/lib/star-history/types";

import type { StarHistoryConfig } from "./state";

/**
 * Surface the in-app preview renders the (transparent) chart on, per chart
 * theme — light is white, dark is the site's near-black. This is only a
 * viewing canvas; the exported SVG carries no background of its own.
 */
export const PREVIEW_SURFACE: Record<ThemeName, string> = {
  light: "#ffffff",
  dark: "#0a0a0a",
};

/**
 * Local-date `YYYY-MM-DD`. The calendar yields local-midnight Dates, so
 * `toISOString()` would shift the day in non-UTC timezones — read the local
 * date parts instead.
 */
const toIso = (date: Date): string => {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

function toUrlInput(config: StarHistoryConfig): StarHistoryUrlInput {
  const { mode, from, to } = config.range;
  const useRange = mode === "custom";
  return {
    repos: config.repos
      .filter((r) => r.value.trim())
      .map((r) => ({ value: r.value.trim(), color: r.color })),
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
    from: useRange && from ? toIso(from) : undefined,
    to: useRange && to ? toIso(to) : undefined,
  };
}

/** Build the /api/star-history URL for the current config — used for both the preview and the embed. */
export function buildChartUrl(config: StarHistoryConfig): string {
  return buildStarHistoryUrl(toUrlInput(config));
}

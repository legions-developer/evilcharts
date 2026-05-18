// URL builders for the star-history tool. The in-app preview and the exported
// embed differ only in the dark background: the preview blends into the site,
// the embed bakes GitHub's canvas color so it sits flush inside a README.

import { buildStarHistoryUrl, type StarHistoryUrlInput } from "@/lib/star-history/query-schema";
import type { ThemeName } from "@/lib/star-history/types";

import type { StarHistoryConfig } from "./state";

/**
 * Surface the in-app preview renders the chart on. Mirrors the exported
 * background, except dark uses the site's near-black instead of GitHub's
 * #0c1117 — so the preview card blends into evilcharts.com.
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
    transparent: config.transparent,
    animate: config.animate,
    loopInterval: config.loopInterval,
    axisLabels: config.axisLabels,
    axisLabelOffset: config.axisLabelOffset,
    strokeWidth: config.strokeWidth,
    dotSize: config.dotSize,
    fillOpacity: config.fillOpacity,
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

/** URL the in-app preview fetches — a dark chart sits on the site surface. */
export function buildPreviewUrl(config: StarHistoryConfig): string {
  return buildStarHistoryUrl({
    ...toUrlInput(config),
    background: config.transparent ? undefined : PREVIEW_SURFACE[config.theme],
  });
}

/** URL for embedding / export — a dark chart uses GitHub's #0c1117 canvas. */
export function buildEmbedUrl(config: StarHistoryConfig): string {
  return buildStarHistoryUrl(toUrlInput(config));
}

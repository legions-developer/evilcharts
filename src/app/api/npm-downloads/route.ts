// GET /api/npm-downloads — fetches npm package download history and returns an
// animated SVG. Any failure returns an error-card SVG at HTTP 200 so <img>
// embeds degrade gracefully. The npm downloads API needs no authentication.

import type { NextRequest } from "next/server";
import { generateChartSvg, generateErrorSvg } from "@/lib/chart-svg/svg";
import { PALETTES } from "@/lib/chart-svg/svg/theme";
import type { ChartOptions, ChartSeries, ThemeName } from "@/lib/chart-svg/types";
import { applyMetric, metricAxisTitle } from "@/lib/npm-downloads/metrics";
import { fetchPackageDownloads } from "@/lib/npm-downloads/npm-api";
import { parsePackage } from "@/lib/npm-downloads/parse-package";
import { parseNpmDownloadsQuery } from "@/lib/npm-downloads/query-schema";
import { NpmDownloadsError } from "@/lib/npm-downloads/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DAY = 86_400;
const DAY_MS = 86_400_000;
/** Window fetched when the request carries no explicit date range. */
const DEFAULT_RANGE_DAYS = 365;

/**
 * Wrap the SVG in an HTML document with a theme-matched page background — the
 * chart SVG itself is transparent, so a direct open still needs a readable
 * canvas (light text on the dark theme would vanish on a white browser page).
 */
function htmlShell(svg: string, pageBg: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>npm Download Trends</title><style>html,body{margin:0;min-height:100%}body{background:${pageBg}}svg{max-width:100%;height:auto}</style></head><body>${svg}</body></html>`;
}

function svgResponse(
  svg: string,
  ok: boolean,
  opts: { asDocument: boolean; pageBg: string },
): Response {
  const body = opts.asDocument ? htmlShell(svg, opts.pageBg) : svg;
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": opts.asDocument
        ? "text/html; charset=utf-8"
        : "image/svg+xml; charset=utf-8",
      "Cache-Control": ok
        ? `public, s-maxage=${DAY}, max-age=${DAY}, stale-while-revalidate=${DAY / 2}`
        : "public, max-age=0, must-revalidate",
      // The response shape depends on Sec-Fetch-Dest — keep caches honest.
      Vary: "Sec-Fetch-Dest",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  // The theme only drives the page canvas — the chart SVG is transparent.
  const theme: ThemeName = params.get("theme") === "dark" ? "dark" : "light";

  // `Sec-Fetch-Dest: document` means the URL was opened directly (not via an
  // <img> embed) — serve an HTML page so the browser canvas matches the theme.
  const asDocument = req.headers.get("sec-fetch-dest") === "document";
  const pageBg = PALETTES[theme].background;
  const respond = (svg: string, ok: boolean) =>
    svgResponse(svg, ok, { asDocument, pageBg });

  const parsed = parseNpmDownloadsQuery(params);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request parameters";
    return respond(generateErrorSvg(message), false);
  }

  const query = parsed.data;

  try {
    // The npm range API needs a concrete window — default to the last year.
    const to = query.to ?? Date.now();
    const from = Math.min(query.from ?? to - DEFAULT_RANGE_DAYS * DAY_MS, to);

    const packages = query.packages.map(parsePackage);
    const downloads = await Promise.all(
      packages.map((pkg) => fetchPackageDownloads(pkg, from, to)),
    );

    // Shape each package's daily counts by the chosen metric. `total` stays the
    // raw sum so the bar / pie comparison is meaningful for every metric.
    const series: ChartSeries[] = downloads.map((d) => ({
      label: d.label,
      records: applyMetric(d.daily, query.metric),
      total: d.total,
      truncated: false,
    }));

    const options: ChartOptions = {
      theme: query.theme,
      chartType: query.chartType,
      axis: query.axis,
      animate: query.animate,
      loopInterval: query.loopInterval,
      axisLabels: query.axisLabels,
      axisLabelOffset: query.axisLabelOffset,
      strokeWidth: query.strokeWidth,
      dotSize: query.dotSize,
      fillOpacity: query.fillOpacity,
      fillFade: query.fillFade,
      fillPattern: query.fillPattern,
      strokeVariant: query.strokeVariant,
      backgroundPattern: query.backgroundPattern,
      backgroundPatternOpacity: query.backgroundPatternOpacity,
      radialRingWidth: query.radialRingWidth,
      pieInnerRadius: query.pieInnerRadius,
      colors: query.colors,
      from,
      to,
      valueAxisTitle: metricAxisTitle(query.metric),
      dateAxisTitle: "Date",
      timelineAxisTitle: "Package age",
      truncationNote: "",
    };
    return respond(generateChartSvg(series, options), true);
  } catch (err) {
    const message =
      err instanceof NpmDownloadsError ? err.userMessage : "Something went wrong";
    return respond(generateErrorSvg(message), false);
  }
}

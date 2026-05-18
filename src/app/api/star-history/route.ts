// GET /api/star-history — fetches GitHub star history and returns an animated SVG.
// Any failure returns an error-card SVG at HTTP 200 so <img> embeds degrade gracefully.

import type { NextRequest } from "next/server";
import { fetchStarRecords } from "@/lib/star-history/github";
import { parseRepo } from "@/lib/star-history/parse-repo";
import { parseHexParam, parseStarHistoryQuery } from "@/lib/star-history/query-schema";
import { generateErrorSvg, generateStarHistorySvg } from "@/lib/star-history/svg";
import { PALETTES } from "@/lib/star-history/svg/theme";
import {
  StarHistoryError,
  type StarHistoryOptions,
  type ThemeName,
} from "@/lib/star-history/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DAY = 86_400;

/**
 * Resolve the chart's background fill: nothing when transparent, the caller's
 * `bg` override when valid, otherwise the theme default (white / GitHub dark).
 */
function resolveBackground(
  theme: ThemeName,
  transparent: boolean,
  override: string | undefined,
): string | null {
  if (transparent) return null;
  return override ?? PALETTES[theme].background;
}

/**
 * Wrap the SVG in an HTML document whose page background matches the chart —
 * used when the URL is opened directly (so the browser canvas isn't white).
 */
function htmlShell(svg: string, pageBg: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>GitHub Star History</title><style>html,body{margin:0;min-height:100%}body{background:${pageBg}}svg{max-width:100%;height:auto}</style></head><body>${svg}</body></html>`;
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

  // Error SVGs still need a theme/background, even when the query is invalid.
  const theme: ThemeName = params.get("theme") === "dark" ? "dark" : "light";
  const errorOpts = {
    theme,
    background: resolveBackground(
      theme,
      params.get("transparent") === "1",
      parseHexParam(params.get("bg")),
    ),
  };

  // `Sec-Fetch-Dest: document` means the URL was opened directly (not via an
  // <img> embed) — serve an HTML page so the browser canvas matches the chart.
  const asDocument = req.headers.get("sec-fetch-dest") === "document";
  const pageBg = errorOpts.background ?? PALETTES[theme].background;
  const respond = (svg: string, ok: boolean) =>
    svgResponse(svg, ok, { asDocument, pageBg });

  const parsed = parseStarHistoryQuery(params);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request parameters";
    return respond(generateErrorSvg(message, errorOpts), false);
  }

  const query = parsed.data;

  try {
    const repos = query.repos.map(parseRepo);
    const series = await Promise.all(repos.map((repo) => fetchStarRecords(repo)));

    const options: StarHistoryOptions = {
      theme: query.theme,
      axis: query.axis,
      background: resolveBackground(query.theme, query.transparent, query.background),
      animate: query.animate,
      loopInterval: query.loopInterval,
      axisLabels: query.axisLabels,
      axisLabelOffset: query.axisLabelOffset,
      strokeWidth: query.strokeWidth,
      dotSize: query.dotSize,
      fillOpacity: query.fillOpacity,
      fillPattern: query.fillPattern,
      strokeVariant: query.strokeVariant,
      backgroundPattern: query.backgroundPattern,
      backgroundPatternOpacity: query.backgroundPatternOpacity,
      colors: query.colors,
      from: query.from,
      to: query.to,
    };
    return respond(generateStarHistorySvg(series, options), true);
  } catch (err) {
    const message =
      err instanceof StarHistoryError ? err.userMessage : "Something went wrong";
    return respond(generateErrorSvg(message, errorOpts), false);
  }
}

// Renders a graceful error card as an SVG so <img> embeds never break.

import type { ThemeName } from "../types";
import { surface, svgRoot } from "./draw";
import { el, text } from "./el";
import { buildLayout } from "./scales";
import { wordmark, wordmarkWidth } from "./wordmark";

/** Muted grey accent — used for the icon, message, and footer credit. */
const ERROR_ACCENT = "#828282";

export interface ErrorSvgOptions {
  theme: ThemeName;
  /** Resolved background fill, or null for a transparent card. */
  background: string | null;
}

/** Greedy word-wrap, capped at `maxLines` (last line gets an ellipsis if cut). */
function wrapText(content: string, maxChars: number, maxLines: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of content.split(/\s+/)) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const trimmed = lines.slice(0, maxLines);
    trimmed[maxLines - 1] = `${trimmed[maxLines - 1]}…`;
    return trimmed;
  }
  return lines;
}

export function generateErrorSvg(message: string, options: ErrorSvgOptions): string {
  const layout = buildLayout(false);
  const cx = layout.width / 2;
  const cy = layout.height / 2;

  const icon = el(
    "g",
    { transform: `translate(${cx}, ${cy - 48})` },
    el("path", {
      d: "M0,-16 L15,11 L-15,11 Z",
      fill: "none",
      stroke: ERROR_ACCENT,
      "stroke-width": 2.5,
      "stroke-linejoin": "round",
    }) +
      el("line", {
        x1: 0,
        y1: -5,
        x2: 0,
        y2: 3,
        stroke: ERROR_ACCENT,
        "stroke-width": 2.5,
        "stroke-linecap": "round",
      }) +
      el("circle", { cx: 0, cy: 7, r: 1.4, fill: ERROR_ACCENT }),
  );

  const lines = wrapText(message, 42, 3)
    .map((ln, i) =>
      text(ln, {
        x: cx,
        y: cy + 4 + i * 20,
        "text-anchor": "middle",
        "font-size": 14,
        fill: ERROR_ACCENT,
      }),
    )
    .join("");

  // Footer credit: "Generated with" stacked above the evilcharts wordmark.
  const markHeight = 13;
  const markWidth = wordmarkWidth(markHeight);
  const brand =
    text("Generated with", {
      x: cx,
      y: layout.height - 32,
      "text-anchor": "middle",
      "font-size": 9,
      fill: ERROR_ACCENT,
    }) + wordmark(cx - markWidth / 2, layout.height - 24, markHeight, ERROR_ACCENT);

  return svgRoot(layout, surface(layout, options.background) + icon + lines + brand);
}

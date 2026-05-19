// Decorative background patterns for the generated chart — SVG-string ports of
// the area-chart registry's <ChartBackground> textures (src/registry/ui/background.tsx).
// Each tile is drawn full-bleed behind the chart and softened with an edge-fade
// mask. When a pattern is active the caller drops the y-axis grid lines.

import type { BackgroundPattern } from "../types";
import type { Layout } from "./scales";
import type { SvgIds } from "./ids";
import { el } from "./el";

/** Builds the `<pattern>` tile for one variant, in the given border-grey color. */
type PatternBuilder = (id: string, color: string) => string;

/** Shorthand for a `<pattern>` tile with a userSpaceOnUse coordinate system. */
function tile(id: string, w: number, h: number, body: string, transform?: string): string {
  return el(
    "pattern",
    {
      id,
      x: 0,
      y: 0,
      width: w,
      height: h,
      patternUnits: "userSpaceOnUse",
      patternTransform: transform,
    },
    body,
  );
}

const BUILDERS: Record<Exclude<BackgroundPattern, "none">, PatternBuilder> = {
  dots: (id, color) => tile(id, 20, 20, el("circle", { cx: 2, cy: 2, r: 1, fill: color })),

  grid: (id, color) =>
    tile(
      id,
      20,
      20,
      el("path", {
        d: "M 20 0 L 0 0 0 20",
        fill: "none",
        stroke: color,
        "stroke-width": 0.5,
      }),
    ),

  "cross-hatch": (id, color) =>
    tile(
      id,
      20,
      20,
      el("path", {
        d: "M 0 0 L 20 20 M 20 0 L 0 20",
        fill: "none",
        stroke: color,
        "stroke-width": 0.5,
        "stroke-opacity": 0.6,
      }),
    ),

  "diagonal-lines": (id, color) =>
    tile(
      id,
      6,
      6,
      el("line", { x1: 0, y1: 0, x2: 0, y2: 6, stroke: color, "stroke-width": 0.5 }),
      "rotate(45)",
    ),

  plus: (id, color) =>
    tile(
      id,
      16,
      16,
      el("path", {
        d: "M 8 4 L 8 12 M 4 8 L 12 8",
        fill: "none",
        stroke: color,
        "stroke-width": 0.5,
        "stroke-linecap": "round",
      }),
    ),

  "falling-triangles": (id, color) =>
    tile(
      id,
      18,
      36,
      el("path", {
        d: "M2 6h12L8 18 2 6zm18 36h12l-6 12-6-12z",
        transform: "scale(0.5)",
        fill: color,
        "fill-opacity": 0.4,
      }),
    ),

  "4-pointed-star": (id, color) =>
    tile(
      id,
      16,
      16,
      el("polygon", {
        "fill-rule": "evenodd",
        points: "5 3 8 4 5 5 4 8 3 5 0 4 3 3 4 0 5 3",
        fill: color,
        "fill-opacity": 0.4,
      }),
    ),

  "tiny-checkers": (id, color) =>
    tile(
      id,
      8,
      8,
      el("path", {
        "fill-rule": "evenodd",
        d: "M0 0h4v4H0V0zm4 4h4v4H4V4z",
        fill: color,
        "fill-opacity": 0.2,
      }),
    ),

  "overlapping-circles": (id, color) =>
    tile(
      id,
      40,
      40,
      el("path", {
        "fill-rule": "evenodd",
        d: "M25 25c0-2.762 2.238-5 5-5s5 2.238 5 5-2.238 5-5 5c0 2.762-2.238 5-5 5s-5-2.238-5-5 2.238-5 5-5zM5 5c0-2.762 2.238-5 5-5s5 2.238 5 5-2.238 5-5 5c0 2.762-2.238 5-5 5S0 12.762 0 10s2.238-5 5-5zm5 4c2.209 0 4-1.791 4-4s-1.791-4-4-4-4 1.791-4 4 1.791 4 4 4zm20 20c2.209 0 4-1.791 4-4s-1.791-4-4-4-4 1.791-4 4 1.791 4 4 4z",
        fill: color,
        "fill-opacity": 0.4,
      }),
    ),

  "wiggle-lines": (id, color) =>
    tile(
      id,
      52,
      26,
      el("path", {
        d: "M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z",
        fill: color,
        "fill-opacity": 0.4,
      }),
      "scale(0.6)",
    ),

  bubbles: (id, color) =>
    tile(
      id,
      100,
      100,
      el("path", {
        "fill-rule": "evenodd",
        d: "M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z",
        fill: color,
        "fill-opacity": 0.4,
      }),
      "scale(0.6667)",
    ),
};

/**
 * Full-bleed pattern backdrop with a soft edge fade. Returns "" for "none".
 * `color` is the theme's border-grey — see `Palette.pattern`.
 */
export function drawBackground(
  ids: SvgIds,
  layout: Layout,
  variant: BackgroundPattern,
  color: string,
  opacity = 100,
): string {
  if (variant === "none" || opacity <= 0) return "";

  const defs = el(
    "defs",
    {},
    BUILDERS[variant](ids.bgPattern, color) +
      el("filter", { id: ids.bgBlur }, el("feGaussianBlur", { stdDeviation: 25 })) +
      el(
        "mask",
        { id: ids.bgMask, maskUnits: "userSpaceOnUse" },
        el("rect", {
          x: "8%",
          y: "20%",
          width: "85%",
          height: "60%",
          fill: "white",
          filter: `url(#${ids.bgBlur})`,
        }),
      ),
  );

  const fill = el("rect", {
    width: layout.width,
    height: layout.height,
    fill: `url(#${ids.bgPattern})`,
    mask: `url(#${ids.bgMask})`,
    opacity: opacity < 100 ? opacity / 100 : undefined,
  });

  return defs + fill;
}

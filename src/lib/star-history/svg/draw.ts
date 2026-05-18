// SVG-string builders for each chart part — written declaratively via `el()`.
// The draw-on animation is expressed through the shared `animate()` helper.

import { area, curveMonotoneX, line } from "d3-shape";

import type { AxisTick, Layout, ProjectedPoint, ProjectedSeries } from "./scales";
import { seriesColor, type Palette } from "./theme";
import type { FillPattern, RepoSeries } from "../types";
import { animate, el, text } from "./el";
import { wordmark, wordmarkWidth } from "./wordmark";

const FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// Animation timing (seconds).
const DRAW_BEGIN = 0.15;
const DRAW_DUR = 1.6;
const SERIES_STAGGER = 0.18;
const DOT_DUR = 0.3;
const DOT_STAGGER = 0.03;
/** Cubic-bézier "ease-out" for the line draw-on. */
const EASE_OUT = [0.4, 0, 0.2, 1] as const;

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** When series `index` starts animating — staggered so series draw in sequence. */
const seriesBegin = (index: number): number => round2(DRAW_BEGIN + index * SERIES_STAGGER);

const lineGen = line<ProjectedPoint>()
  .x((p) => p.px)
  .y((p) => p.py)
  .curve(curveMonotoneX);

const buildArea = (baseline: number) =>
  area<ProjectedPoint>()
    .x((p) => p.px)
    .y0(baseline)
    .y1((p) => p.py)
    .curve(curveMonotoneX);

/** Trim float precision in a generated path `d` string to keep the SVG small. */
function roundPath(d: string): string {
  return d.replace(/-?\d*\.\d+/g, (m) => String(round2(Number(m))));
}

/** Root <svg> wrapper around the assembled chart body. */
export function svgRoot(layout: Layout, children: string): string {
  return el(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: layout.width,
      height: layout.height,
      viewBox: `0 0 ${layout.width} ${layout.height}`,
      "font-family": FONT,
    },
    children,
  );
}

/** Full-bleed background rect — omitted entirely when `background` is null. */
export function surface(layout: Layout, background: string | null): string {
  if (!background) return "";
  return el("rect", { width: layout.width, height: layout.height, fill: background });
}

/** Base top-stop opacity of the gradient fill, scaled by the chosen percent. */
const FILL_BASE_OPACITY = 0.22;

/**
 * Build the area-fill def for one series. Returns the `<def>` markup and the
 * `id` `drawSeriesArea` should reference. `pattern` picks the fill style;
 * `opacity` (0–1) scales it. Patterns mirror the area-chart registry textures.
 */
function seriesFillDef(
  pattern: FillPattern,
  index: number,
  color: string,
  opacity: number,
): { def: string; id: string } {
  const id = `sh-grad-${index}`;

  // Solid: a flat color fill at the chosen opacity (no vertical fade).
  if (pattern === "solid") {
    const def = el(
      "linearGradient",
      { id, x1: 0, y1: 0, x2: 0, y2: 1 },
      el("stop", { offset: "0%", "stop-color": color, "stop-opacity": opacity }) +
        el("stop", { offset: "100%", "stop-color": color, "stop-opacity": opacity }),
    );
    return { def, id };
  }

  // Texture patterns: a tile of the series color shapes, scaled by `opacity`.
  if (pattern === "hatched" || pattern === "lines" || pattern === "dotted") {
    let tile: string;
    if (pattern === "dotted") {
      tile = el(
        "pattern",
        { id, x: 0, y: 0, width: 6, height: 6, patternUnits: "userSpaceOnUse" },
        el("circle", { cx: 3, cy: 3, r: 1.1, fill: color, "fill-opacity": opacity }),
      );
    } else if (pattern === "lines") {
      tile = el(
        "pattern",
        {
          id,
          width: 6,
          height: 6,
          patternUnits: "userSpaceOnUse",
          patternTransform: "rotate(45)",
        },
        el("line", {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 6,
          stroke: color,
          "stroke-width": 1.4,
          "stroke-opacity": opacity,
        }),
      );
    } else {
      // hatched — thicker diagonal stripes.
      tile = el(
        "pattern",
        {
          id,
          width: 8,
          height: 8,
          patternUnits: "userSpaceOnUse",
          patternTransform: "rotate(20)",
        },
        el("rect", { width: 4, height: 8, fill: color, "fill-opacity": opacity }),
      );
    }
    return { def: tile, id };
  }

  // Gradient (default): vertical fade, top stop scaled by `opacity`.
  const def = el(
    "linearGradient",
    { id, x1: 0, y1: 0, x2: 0, y2: 1 },
    el("stop", { offset: "0%", "stop-color": color, "stop-opacity": opacity }) +
      el("stop", { offset: "100%", "stop-color": color, "stop-opacity": 0 }),
  );
  return { def, id };
}

/** Per-series fill defs + the plot clip-path. */
export function drawDefs(
  layout: Layout,
  count: number,
  colors: string[],
  fillPattern: FillPattern,
  fillOpacity: number,
): string {
  const { plot } = layout;
  const topOpacity = (fillOpacity / 100) * FILL_BASE_OPACITY;
  const fills = Array.from({ length: count }, (_, i) =>
    seriesFillDef(fillPattern, i, seriesColor(colors, i), topOpacity).def,
  ).join("");

  const clip = el(
    "clipPath",
    { id: "sh-plot-clip" },
    el("rect", {
      x: plot.x0 - 6,
      y: plot.y0 - 10,
      width: plot.width + 12,
      height: plot.height + 16,
    }),
  );

  return el("defs", {}, fills + clip);
}

export function drawGrid(layout: Layout, palette: Palette, yTicks: AxisTick[]): string {
  const { plot } = layout;
  return yTicks
    .map((t) =>
      el("line", {
        x1: plot.x0,
        y1: t.pos,
        x2: plot.x1,
        y2: t.pos,
        stroke: palette.grid,
        "stroke-width": 1,
      }),
    )
    .join("");
}

export function drawAxes(
  layout: Layout,
  palette: Palette,
  xTicks: AxisTick[],
  yTicks: AxisTick[],
): string {
  const { plot } = layout;
  const axisLine = (x1: number, y1: number, x2: number, y2: number) =>
    el("line", { x1, y1, x2, y2, stroke: palette.axis, "stroke-width": 1 });

  const axes =
    axisLine(plot.x0, plot.y1, plot.x1, plot.y1) + axisLine(plot.x0, plot.y0, plot.x0, plot.y1);

  const yLabels = yTicks
    .map((t) =>
      text(t.label, {
        x: plot.x0 - 12,
        y: t.pos,
        "text-anchor": "end",
        "dominant-baseline": "middle",
        "font-size": 11,
        fill: palette.text,
      }),
    )
    .join("");

  const xLabels = xTicks
    .map((t) =>
      text(t.label, {
        x: t.pos,
        y: plot.y1 + 22,
        "text-anchor": "middle",
        "font-size": 11,
        fill: palette.text,
      }),
    )
    .join("");

  return axes + yLabels + xLabels;
}

/**
 * Rotated y-axis title + horizontal x-axis title, drawn outside the tick labels.
 * `offset` widens the gap to the chart — `buildLayout` reserves matching room.
 */
export function drawAxisTitles(
  layout: Layout,
  palette: Palette,
  xTitle: string,
  offset: number,
): string {
  const { plot } = layout;
  const yx = plot.x0 - (47 + offset);
  const yy = (plot.y0 + plot.y1) / 2;

  const yTitle = text("GitHub Stars", {
    x: yx,
    y: yy,
    transform: `rotate(-90 ${yx} ${yy})`,
    "text-anchor": "middle",
    "font-size": 12,
    "font-weight": 600,
    fill: palette.title,
  });

  const xLabel = text(xTitle, {
    x: (plot.x0 + plot.x1) / 2,
    y: plot.y1 + 36 + offset,
    "text-anchor": "middle",
    "font-size": 12,
    "font-weight": 600,
    fill: palette.title,
  });

  return yTitle + xLabel;
}

/** Badge-styled legend, anchored to the top-right of the chart. */
export function drawLegend(
  layout: Layout,
  palette: Palette,
  series: RepoSeries[],
  colors: string[],
): string {
  const FONT_SIZE = 12;
  const SWATCH = 10;
  const SWATCH_GAP = 7;
  const BADGE_PAD_X = 10;
  const BADGE_H = 24;
  const BADGE_GAP = 10;
  const CHAR_W = FONT_SIZE * 0.6; // rough advance width per character

  const items = series.map((s, i) => {
    const inner = SWATCH + SWATCH_GAP + s.label.length * CHAR_W;
    return {
      label: s.label,
      color: seriesColor(colors, i),
      width: inner + BADGE_PAD_X * 2,
    };
  });

  const total =
    items.reduce((sum, it) => sum + it.width, 0) + BADGE_GAP * Math.max(0, items.length - 1);

  const y = 18; // top edge of the badge row
  let x = layout.width - 14 - total; // 14px right inset

  return items
    .map((it) => {
      const badge =
        el("rect", {
          x,
          y,
          width: it.width,
          height: BADGE_H,
          rx: 6,
          fill: palette.grid,
          "fill-opacity": 0.6,
        }) +
        el("rect", {
          x: x + BADGE_PAD_X,
          y: y + (BADGE_H - SWATCH) / 2,
          width: SWATCH,
          height: SWATCH,
          rx: 2.5,
          fill: it.color,
        }) +
        text(it.label, {
          x: x + BADGE_PAD_X + SWATCH + SWATCH_GAP,
          y: y + BADGE_H / 2,
          "dominant-baseline": "middle",
          "font-size": FONT_SIZE,
          fill: palette.text,
        });
      x += it.width + BADGE_GAP;
      return badge;
    })
    .join("");
}

export function drawSeriesArea(
  ps: ProjectedSeries,
  index: number,
  layout: Layout,
  animated: boolean,
  fillOpacity: number,
): string {
  if (ps.points.length < 2) return "";
  // 0% fill opacity — skip the area path entirely.
  if (fillOpacity <= 0) return "";
  const d = buildArea(layout.plot.y1)(ps.points);
  if (!d) return "";

  const reveal = animated
    ? animate({ attr: "opacity", from: 0, to: 1, dur: DRAW_DUR, begin: seriesBegin(index) })
    : undefined;

  return el(
    "path",
    { d: roundPath(d), fill: `url(#sh-grad-${index})`, opacity: animated ? 0 : undefined },
    reveal,
  );
}

export function drawSeriesLine(
  ps: ProjectedSeries,
  index: number,
  colors: string[],
  animated: boolean,
  strokeWidth: number,
): string {
  if (ps.points.length < 2) return "";
  const d = lineGen(ps.points);
  if (!d) return "";

  // pathLength="1" normalizes the path so stroke-dashoffset 1→0 draws it on.
  const reveal = animated
    ? animate({
        attr: "stroke-dashoffset",
        from: 1,
        to: 0,
        dur: DRAW_DUR,
        begin: seriesBegin(index),
        easing: EASE_OUT,
      })
    : undefined;

  return el(
    "path",
    {
      d: roundPath(d),
      fill: "none",
      stroke: seriesColor(colors, index),
      "stroke-width": strokeWidth,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      pathLength: animated ? 1 : undefined,
      "stroke-dasharray": animated ? "1 1" : undefined,
      "stroke-dashoffset": animated ? 1 : undefined,
    },
    reveal,
  );
}

export function drawSeriesDots(
  ps: ProjectedSeries,
  index: number,
  colors: string[],
  background: string | null,
  animated: boolean,
): string {
  const color = seriesColor(colors, index);
  const lineDone = DRAW_BEGIN + index * SERIES_STAGGER + DRAW_DUR;

  return ps.points
    .map((p, j) => {
      // Skip the first point — it sits on the axis origin and the dot would
      // be clipped in half by the plot box.
      if (j === 0) return "";

      const reveal = animated
        ? animate({
            attr: "opacity",
            from: 0,
            to: 1,
            dur: DOT_DUR,
            begin: round2(lineDone + j * DOT_STAGGER),
          })
        : undefined;

      return el(
        "circle",
        {
          cx: p.px,
          cy: p.py,
          r: 3.2,
          fill: color,
          // The halo only reads against a solid fill; skip it when transparent.
          stroke: background ?? undefined,
          "stroke-width": background ? 1.5 : undefined,
          opacity: animated ? 0 : undefined,
        },
        reveal,
      );
    })
    .join("");
}

export function drawFooter(layout: Layout, palette: Palette, truncated: boolean): string {
  // Footer credit: "Generated with" stacked above the evilcharts wordmark,
  // aligned to the chart's right edge in a muted grey so it stays unobtrusive.
  const markHeight = 12;
  const markWidth = wordmarkWidth(markHeight);
  const right = layout.plot.x1;
  const brand =
    text("Generated with", {
      x: right,
      y: layout.height - 30,
      "text-anchor": "end",
      "font-size": 9,
      fill: palette.muted,
    }) + wordmark(right - markWidth, layout.height - 23, markHeight, palette.muted);
  const note = truncated
    ? text("~ approximate (40k+ stars)", {
        x: 14,
        y: layout.height - 14,
        "font-size": 10,
        fill: palette.muted,
      })
    : "";
  return brand + note;
}

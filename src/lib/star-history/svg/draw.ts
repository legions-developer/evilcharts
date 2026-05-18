// SVG-string builders for each chart part — written declaratively via `el()`.
// The draw-on animation is expressed through the shared `animate()` helper.

import { area, curveMonotoneX, line } from "d3-shape";

import type { AxisTick, Layout, ProjectedPoint, ProjectedSeries } from "./scales";
import { seriesColor, type Palette } from "./theme";
import type { FillPattern, RepoSeries, StrokeVariant } from "../types";
import { animate, el, text } from "./el";
import { wordmark, wordmarkWidth } from "./wordmark";

const FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// Animation timing (seconds). Shared by every chart type's reveal.
export const DRAW_BEGIN = 0.15;
export const DRAW_DUR = 1.6;
export const SERIES_STAGGER = 0.18;
const DOT_DUR = 0.3;
const DOT_STAGGER = 0.03;
/** Cubic-bézier "ease-out" for the line draw-on. */
export const EASE_OUT = [0.4, 0, 0.2, 1] as const;

export const round2 = (n: number): number => Math.round(n * 100) / 100;

/** When series `index` starts animating — staggered so series draw in sequence. */
export const seriesBegin = (index: number): number =>
  round2(DRAW_BEGIN + index * SERIES_STAGGER);

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

/**
 * Per-series fill defs (`sh-grad-${i}`), shared by every chart type — the bar
 * fills, ring fills and slice fills all reference these. `fillOpacity` (0–100)
 * scales `baseOpacity`: the line/area passes the subtle `FILL_BASE_OPACITY`
 * (the fill only washes under the line), the comparison charts pass `1` since
 * the fill *is* the mark and must read at full strength.
 */
export function drawFillDefs(
  count: number,
  colors: string[],
  fillPattern: FillPattern,
  fillOpacity: number,
  baseOpacity: number = FILL_BASE_OPACITY,
): string {
  const topOpacity = (fillOpacity / 100) * baseOpacity;
  return Array.from({ length: count }, (_, i) =>
    seriesFillDef(fillPattern, i, seriesColor(colors, i), topOpacity).def,
  ).join("");
}

/** The plot clip-path — line/bar only, keeps custom ranges tidy at the edges. */
export function plotClip(layout: Layout): string {
  const { plot } = layout;
  return el(
    "clipPath",
    { id: "sh-plot-clip" },
    el("rect", {
      x: plot.x0 - 6,
      y: plot.y0 - 10,
      width: plot.width + 12,
      height: plot.height + 16,
    }),
  );
}

/** Per-series fill defs + the plot clip-path — the line/bar `<defs>` block. */
export function drawDefs(
  layout: Layout,
  count: number,
  colors: string[],
  fillPattern: FillPattern,
  fillOpacity: number,
  baseOpacity?: number,
): string {
  return el(
    "defs",
    {},
    drawFillDefs(count, colors, fillPattern, fillOpacity, baseOpacity) + plotClip(layout),
  );
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
// Legend badge geometry — shared by `planLegend` and `drawLegend`.
const LEGEND = {
  FONT_SIZE: 12,
  SWATCH: 10,
  SWATCH_GAP: 7,
  PAD_X: 10,
  BADGE_H: 24,
  BADGE_GAP: 8,
  ROW_GAP: 8,
  TOP_INSET: 14,
  BOTTOM_GAP: 14,
  EDGE: 14,
};
const LEGEND_CHAR_W = LEGEND.FONT_SIZE * 0.6; // rough advance width per character

export interface LegendBadge {
  x: number;
  y: number;
  width: number;
  label: string;
  color: string;
}

export interface LegendPlan {
  badges: LegendBadge[];
  /** Y where the plot should start — the full height of the legend block. */
  topMargin: number;
}

/**
 * Lay out the legend badges, wrapping to a new row whenever they'd exceed the
 * chart width. `topMargin` reports how much vertical room the rows need so the
 * plot can be pushed down to clear them.
 */
export function planLegend(
  width: number,
  series: RepoSeries[],
  colors: string[],
): LegendPlan {
  const items = series.map((s, i) => ({
    label: s.label,
    color: seriesColor(colors, i),
    width:
      LEGEND.PAD_X * 2 + LEGEND.SWATCH + LEGEND.SWATCH_GAP + s.label.length * LEGEND_CHAR_W,
  }));

  // Greedy wrap into rows that fit within the chart's inner width.
  const maxRowWidth = width - LEGEND.EDGE * 2;
  const rows: (typeof items)[] = [];
  let row: typeof items = [];
  let rowWidth = 0;
  for (const it of items) {
    const extra = (row.length ? LEGEND.BADGE_GAP : 0) + it.width;
    if (row.length && rowWidth + extra > maxRowWidth) {
      rows.push(row);
      row = [];
      rowWidth = 0;
    }
    rowWidth += (row.length ? LEGEND.BADGE_GAP : 0) + it.width;
    row.push(it);
  }
  if (row.length) rows.push(row);

  // Place each row right-aligned to the chart's right edge.
  const badges: LegendBadge[] = [];
  rows.forEach((r, ri) => {
    const rowTotal =
      r.reduce((sum, it) => sum + it.width, 0) + LEGEND.BADGE_GAP * (r.length - 1);
    let x = width - LEGEND.EDGE - rowTotal;
    const y = LEGEND.TOP_INSET + ri * (LEGEND.BADGE_H + LEGEND.ROW_GAP);
    for (const it of r) {
      badges.push({ x, y, width: it.width, label: it.label, color: it.color });
      x += it.width + LEGEND.BADGE_GAP;
    }
  });

  const rowCount = Math.max(1, rows.length);
  const topMargin =
    LEGEND.TOP_INSET +
    rowCount * LEGEND.BADGE_H +
    (rowCount - 1) * LEGEND.ROW_GAP +
    LEGEND.BOTTOM_GAP;

  return { badges, topMargin };
}

/** Render the (possibly multi-row) legend from a `planLegend` result. */
export function drawLegend(plan: LegendPlan, palette: Palette): string {
  return plan.badges
    .map(
      (b) =>
        el("rect", {
          x: b.x,
          y: b.y,
          width: b.width,
          height: LEGEND.BADGE_H,
          rx: 6,
          fill: palette.grid,
          "fill-opacity": 0.6,
        }) +
        el("rect", {
          x: b.x + LEGEND.PAD_X,
          y: b.y + (LEGEND.BADGE_H - LEGEND.SWATCH) / 2,
          width: LEGEND.SWATCH,
          height: LEGEND.SWATCH,
          rx: 2.5,
          fill: b.color,
        }) +
        text(b.label, {
          x: b.x + LEGEND.PAD_X + LEGEND.SWATCH + LEGEND.SWATCH_GAP,
          y: b.y + LEGEND.BADGE_H / 2,
          "dominant-baseline": "middle",
          "font-size": LEGEND.FONT_SIZE,
          fill: palette.text,
        }),
    )
    .join("");
}

export function drawSeriesArea(
  ps: ProjectedSeries,
  index: number,
  layout: Layout,
  animated: boolean,
  fillOpacity: number,
  loopInterval: number,
): string {
  if (ps.points.length < 2) return "";
  // 0% fill opacity — skip the area path entirely.
  if (fillOpacity <= 0) return "";
  const d = buildArea(layout.plot.y1)(ps.points);
  if (!d) return "";

  const reveal = animated
    ? animate({
        attr: "opacity",
        from: 0,
        to: 1,
        dur: DRAW_DUR,
        begin: seriesBegin(index),
        loopInterval,
      })
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
  variant: StrokeVariant,
  loopInterval: number,
): string {
  if (ps.points.length < 2) return "";
  const d = lineGen(ps.points);
  if (!d) return "";

  const base = {
    d: roundPath(d),
    fill: "none",
    stroke: seriesColor(colors, index),
    "stroke-width": strokeWidth,
    "stroke-linecap": "round" as const,
    "stroke-linejoin": "round" as const,
  };

  // Solid: the path-draw reveal — pathLength="1" normalizes the path so
  // stroke-dashoffset 1→0 draws it on.
  if (variant === "solid") {
    const reveal = animated
      ? animate({
          attr: "stroke-dashoffset",
          from: 1,
          to: 0,
          dur: DRAW_DUR,
          begin: seriesBegin(index),
          easing: EASE_OUT,
          loopInterval,
        })
      : undefined;
    return el(
      "path",
      {
        ...base,
        pathLength: animated ? 1 : undefined,
        "stroke-dasharray": animated ? "1 1" : undefined,
        "stroke-dashoffset": animated ? 1 : undefined,
      },
      reveal,
    );
  }

  // Dashed variants: a real dash pattern, scaled to the stroke width. The
  // path-draw trick would consume the dash array, so reveal with an opacity
  // fade instead. "animated-dashed" adds a perpetual marching-ants offset.
  // Dash length + a wider gap, both scaled to the stroke width.
  const dashLen = strokeWidth * 3;
  const dashGap = strokeWidth * 5;
  const dash = `${round2(dashLen)} ${round2(dashGap)}`;
  const reveal = animated
    ? animate({
        attr: "opacity",
        from: 0,
        to: 1,
        dur: DRAW_DUR,
        begin: seriesBegin(index),
        loopInterval,
      })
    : "";
  const marching =
    variant === "animated-dashed"
      ? el("animate", {
          attributeName: "stroke-dashoffset",
          from: 0,
          to: -round2(dashLen + dashGap),
          dur: "0.9s",
          repeatCount: "indefinite",
        })
      : "";

  return el(
    "path",
    { ...base, "stroke-dasharray": dash, opacity: animated ? 0 : undefined },
    reveal + marching,
  );
}

export function drawSeriesDots(
  ps: ProjectedSeries,
  index: number,
  colors: string[],
  background: string | null,
  animated: boolean,
  dotSize: number,
  loopInterval: number,
): string {
  // 0 — dots disabled, skip the circles entirely.
  if (dotSize <= 0) return "";
  const color = seriesColor(colors, index);
  const lineDone = DRAW_BEGIN + index * SERIES_STAGGER + DRAW_DUR;

  return ps.points
    .map((p, j) => {
      // Skip the first point of a multi-point series — it sits on the axis
      // origin and the dot would be clipped in half by the plot box. A lone
      // single point still renders, else the series shows no mark at all.
      if (j === 0 && ps.points.length > 1) return "";

      const reveal = animated
        ? animate({
            attr: "opacity",
            from: 0,
            to: 1,
            dur: DOT_DUR,
            begin: round2(lineDone + j * DOT_STAGGER),
            loopInterval,
          })
        : undefined;

      return el(
        "circle",
        {
          cx: p.px,
          cy: p.py,
          r: dotSize,
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

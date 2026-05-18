// Bar chart: compares repos by total stars — one vertical bar per repo.

import type { RepoSeries, StarHistoryOptions } from "../../types";
import {
  drawDefs,
  drawFooter,
  drawGrid,
  drawLegend,
  planLegend,
  round2,
  seriesBegin,
  surface,
  svgRoot,
} from "../draw";
import { drawBackground } from "../backgrounds";
import { animate, el } from "../el";
import { escapeXml, formatStars } from "../escape";
import { buildBarScales, buildLayout, CHART_WIDTH, type BarDatum } from "../scales";
import { PALETTES, seriesColor, type Palette } from "../theme";

/** Bar grow-in duration (seconds) — matches the line draw-on feel. */
const BAR_DUR = 0.7;
/** Value-label fade duration once a bar has finished growing. */
const LABEL_DUR = 0.3;

/** One bar: a filled rect that grows from the baseline + a value label above it. */
function drawBar(
  bar: BarDatum,
  index: number,
  colors: string[],
  palette: Palette,
  baseline: number,
  strokeWidth: number,
  animated: boolean,
  loopInterval: number,
): string {
  const begin = seriesBegin(index);

  // Grow-in: animate `height` (0→H) and `y` (baseline→top) together so the bar
  // rises out of the axis instead of scaling about its own center.
  const grow = animated
    ? animate({
        attr: "height",
        from: 0,
        to: round2(bar.height),
        dur: BAR_DUR,
        begin,
        loopInterval,
      }) +
      animate({
        attr: "y",
        from: round2(baseline),
        to: round2(bar.y),
        dur: BAR_DUR,
        begin,
        loopInterval,
      })
    : undefined;

  const rect = el(
    "rect",
    {
      x: bar.x,
      y: animated ? baseline : bar.y,
      width: bar.width,
      height: animated ? 0 : bar.height,
      rx: 3,
      fill: `url(#sh-grad-${index})`,
      stroke: seriesColor(colors, index),
      "stroke-width": strokeWidth,
    },
    grow,
  );

  // Star-count label centered above the bar — fades in once the bar settles so
  // the number never floats over empty space.
  const labelReveal = animated
    ? animate({
        attr: "opacity",
        from: 0,
        to: 1,
        dur: LABEL_DUR,
        begin: round2(begin + BAR_DUR),
        loopInterval,
      })
    : "";
  const label = el(
    "text",
    {
      x: bar.x + bar.width / 2,
      y: bar.y - 8,
      "text-anchor": "middle",
      "font-size": 12,
      "font-weight": 600,
      fill: palette.title,
      opacity: animated ? 0 : undefined,
    },
    escapeXml(formatStars(bar.total)) + labelReveal,
  );

  return rect + label;
}

/** Build the complete bar-chart SVG string. */
export function generateBarChart(
  series: RepoSeries[],
  options: StarHistoryOptions,
): string {
  // Legend pushes the plot down exactly like the line chart.
  const legend = planLegend(CHART_WIDTH, series, options.colors);
  // Bars need no axis titles, so a plain cartesian layout below the legend.
  const layout = buildLayout(false, 0, legend.topMargin);
  const palette = PALETTES[options.theme];
  const { bars, yTicks, baseline } = buildBarScales(series, layout);
  const truncated = series.some((s) => s.truncated);
  const loopInterval = options.animate ? options.loopInterval : 0;

  // A background pattern replaces the grid lines (same rule as the line chart).
  const hasBgPattern = options.backgroundPattern !== "none";

  // Cartesian axes: baseline + left edge, with y-tick value labels. No per-bar
  // x labels — the legend identifies repos by color, like the line chart.
  const axisLine = (x1: number, y1: number, x2: number, y2: number) =>
    el("line", { x1, y1, x2, y2, stroke: palette.axis, "stroke-width": 1 });
  const axes =
    axisLine(layout.plot.x0, layout.plot.y1, layout.plot.x1, layout.plot.y1) +
    axisLine(layout.plot.x0, layout.plot.y0, layout.plot.x0, layout.plot.y1);
  const yLabels = yTicks
    .map((t) =>
      el(
        "text",
        {
          x: layout.plot.x0 - 12,
          y: t.pos,
          "text-anchor": "end",
          "dominant-baseline": "middle",
          "font-size": 11,
          fill: palette.text,
        },
        escapeXml(t.label),
      ),
    )
    .join("");

  const barContent = bars
    .map((bar, i) =>
      drawBar(
        bar,
        i,
        options.colors,
        palette,
        baseline,
        options.strokeWidth,
        options.animate,
        loopInterval,
      ),
    )
    .join("");

  const body =
    drawDefs(layout, series.length, options.colors, options.fillPattern, options.fillOpacity, 1) +
    surface(layout, options.background) +
    drawBackground(
      layout,
      options.backgroundPattern,
      palette.pattern,
      options.backgroundPatternOpacity,
    ) +
    (hasBgPattern ? "" : drawGrid(layout, palette, yTicks)) +
    axes +
    yLabels +
    barContent +
    drawLegend(legend, palette) +
    drawFooter(layout, palette, truncated);

  return svgRoot(layout, body);
}

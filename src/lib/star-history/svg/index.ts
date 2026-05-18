// Pure entry point: turns sampled star series into a self-contained SVG string.

import type { RepoSeries, StarHistoryOptions } from "../types";
import {
  drawAxes,
  drawAxisTitles,
  drawDefs,
  drawFooter,
  drawGrid,
  drawLegend,
  drawSeriesArea,
  drawSeriesDots,
  drawSeriesLine,
  planLegend,
  surface,
  svgRoot,
} from "./draw";
import { drawBackground } from "./backgrounds";
import { el } from "./el";
import { buildLayout, buildScales, CHART_WIDTH } from "./scales";
import { PALETTES } from "./theme";

export { generateErrorSvg } from "./error-svg";

export function generateStarHistorySvg(
  series: RepoSeries[],
  options: StarHistoryOptions,
): string {
  // The legend wraps to as many rows as it needs; its height pushes the plot
  // down so badges never overlap the chart.
  const legend = planLegend(CHART_WIDTH, series, options.colors);
  const layout = buildLayout(options.axisLabels, options.axisLabelOffset, legend.topMargin);
  const palette = PALETTES[options.theme];
  const { projected, xTicks, yTicks } = buildScales(series, options, layout);
  const truncated = series.some((s) => s.truncated);

  // Auto-replay: when an interval is set, the draw-on animations repeat on
  // that cycle instead of running once. Only meaningful while animating.
  const loopInterval = options.animate ? options.loopInterval : 0;

  // Areas, lines and dots — clipped to the plot box so custom ranges stay tidy.
  const plotContent = projected
    .map(
      (ps, i) =>
        drawSeriesArea(ps, i, layout, options.animate, options.fillOpacity, loopInterval) +
        drawSeriesLine(
          ps,
          i,
          options.colors,
          options.animate,
          options.strokeWidth,
          options.strokeVariant,
          loopInterval,
        ) +
        drawSeriesDots(
          ps,
          i,
          options.colors,
          options.background,
          options.animate,
          options.dotSize,
          loopInterval,
        ),
    )
    .join("");

  // A background pattern stands in for the grid lines — drawing both would
  // clutter the plot, so the grid is dropped whenever a pattern is active.
  const hasBgPattern = options.backgroundPattern !== "none";

  const body =
    drawDefs(layout, series.length, options.colors, options.fillPattern, options.fillOpacity) +
    surface(layout, options.background) +
    drawBackground(
      layout,
      options.backgroundPattern,
      palette.pattern,
      options.backgroundPatternOpacity,
    ) +
    (hasBgPattern ? "" : drawGrid(layout, palette, yTicks)) +
    drawAxes(layout, palette, xTicks, yTicks) +
    (options.axisLabels
      ? drawAxisTitles(
          layout,
          palette,
          options.axis === "timeline" ? "Repository age" : "Date",
          options.axisLabelOffset,
        )
      : "") +
    el("g", { "clip-path": "url(#sh-plot-clip)" }, plotContent) +
    drawLegend(legend, palette) +
    drawFooter(layout, palette, truncated);

  return svgRoot(layout, body);
}

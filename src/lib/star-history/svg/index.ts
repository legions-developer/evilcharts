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
  surface,
  svgRoot,
} from "./draw";
import { el } from "./el";
import { buildLayout, buildScales } from "./scales";
import { PALETTES } from "./theme";

export { generateErrorSvg } from "./error-svg";

export function generateStarHistorySvg(
  series: RepoSeries[],
  options: StarHistoryOptions,
): string {
  const layout = buildLayout(options.axisLabels, options.axisLabelOffset);
  const palette = PALETTES[options.theme];
  const { projected, xTicks, yTicks } = buildScales(series, options, layout);
  const truncated = series.some((s) => s.truncated);

  // Areas, lines and dots — clipped to the plot box so custom ranges stay tidy.
  const plotContent = projected
    .map(
      (ps, i) =>
        drawSeriesArea(ps, i, layout, options.animate, options.fillOpacity) +
        drawSeriesLine(ps, i, options.colors, options.animate, options.strokeWidth) +
        drawSeriesDots(ps, i, options.colors, options.background, options.animate),
    )
    .join("");

  const body =
    drawDefs(layout, series.length, options.colors, options.fillPattern, options.fillOpacity) +
    surface(layout, options.background) +
    drawGrid(layout, palette, yTicks) +
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
    drawLegend(layout, palette, series, options.colors) +
    drawFooter(layout, palette, truncated);

  return svgRoot(layout, body);
}

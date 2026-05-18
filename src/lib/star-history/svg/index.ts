// Pure entry point: turns sampled star series into a self-contained SVG string.
// Dispatches to the per-type chart builder selected by `options.chartType`.

import type { RepoSeries, StarHistoryOptions } from "../types";
import { generateBarChart } from "./charts/bar";
import { generateLineChart } from "./charts/line";
import { generatePieChart } from "./charts/pie";
import { generateRadialChart, generateRadialHalfChart } from "./charts/radial";

export { generateErrorSvg } from "./error-svg";

/** Render the star-history chart, picking the builder for the chosen type. */
export function generateStarHistorySvg(
  series: RepoSeries[],
  options: StarHistoryOptions,
): string {
  switch (options.chartType) {
    case "bar":
      return generateBarChart(series, options);
    case "radial":
      return generateRadialChart(series, options);
    case "radial-half":
      return generateRadialHalfChart(series, options);
    case "pie":
      return generatePieChart(series, options);
    case "line":
    default:
      return generateLineChart(series, options);
  }
}

// Pure entry point: turns a series set into a self-contained SVG string.
// Dispatches to the per-type chart builder selected by `options.chartType`.

import type { ChartSeries, ChartOptions } from "../types";
import { generateBarChart } from "./charts/bar";
import { generateLineChart } from "./charts/line";
import { generatePieChart } from "./charts/pie";
import { generateRadialChart, generateRadialHalfChart } from "./charts/radial";

export { generateErrorSvg } from "./error-svg";

/** Render the chart, picking the builder for the chosen type. */
export function generateChartSvg(
  series: ChartSeries[],
  options: ChartOptions,
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

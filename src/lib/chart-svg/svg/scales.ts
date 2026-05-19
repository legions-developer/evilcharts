// Chart geometry: layout boxes, d3 scales, and tick generation.

import { scaleBand, scaleLinear, scaleTime } from "d3-scale";
import { timeFormat } from "d3-time-format";
import type { AxisType, ChartSeries, ChartOptions } from "../types";
import { formatCompact } from "./escape";

const DAY_MS = 86_400_000;

export interface Layout {
  width: number;
  height: number;
  plot: { x0: number; y0: number; x1: number; y1: number; width: number; height: number };
}

// Fixed 16:9 chart canvas — matches the preview card's aspect-video frame.
export const CHART_WIDTH = 800;
const CHART_HEIGHT = 450;

const MARGIN = { top: 54, right: 20, bottom: 78, left: 68 };

// Base room reserved for the rotated y-axis title and the x-axis title — the
// user's offset is added on top of this.
const AXIS_LABEL_PAD = { left: 14, bottom: 6 };

export function buildLayout(
  axisLabels: boolean,
  axisLabelOffset = 0,
  topMargin = MARGIN.top,
): Layout {
  const width = CHART_WIDTH;
  const height = CHART_HEIGHT;
  const x0 = MARGIN.left + (axisLabels ? AXIS_LABEL_PAD.left + axisLabelOffset : 0);
  // Plot starts below the legend block — `topMargin` grows when it wraps.
  const y0 = Math.max(topMargin, MARGIN.top);
  const x1 = width - MARGIN.right;
  const y1 = height - MARGIN.bottom - (axisLabels ? AXIS_LABEL_PAD.bottom + axisLabelOffset : 0);
  return { width, height, plot: { x0, y0, x1, y1, width: x1 - x0, height: y1 - y0 } };
}

export interface ProjectedPoint {
  px: number;
  py: number;
}

export interface ProjectedSeries {
  series: ChartSeries;
  points: ProjectedPoint[];
}

export interface AxisTick {
  pos: number;
  label: string;
}

export interface ChartScales {
  projected: ProjectedSeries[];
  xTicks: AxisTick[];
  yTicks: AxisTick[];
}

const formatMonth = timeFormat("%b %Y");

/** X values for a series: absolute date (ms), or relative days for the timeline axis. */
function seriesXValues(series: ChartSeries, axis: AxisType): number[] {
  if (axis === "timeline") {
    const start = series.records.length ? series.records[0].date : 0;
    return series.records.map((r) => (r.date - start) / DAY_MS);
  }
  return series.records.map((r) => r.date);
}

function formatDays(days: number): string {
  if (days >= 365) return `${Math.round(days / 365)}y`;
  if (days >= 30) return `${Math.round(days / 30)}mo`;
  return `${Math.round(days)}d`;
}

export function buildScales(
  series: ChartSeries[],
  options: ChartOptions,
  layout: Layout,
): ChartScales {
  const { plot } = layout;
  const xValuesBySeries = series.map((s) => seriesXValues(s, options.axis));
  const allX = xValuesBySeries.flat();
  const allValues = series.flatMap((s) => s.records.map((r) => r.value));

  let xMin = allX.length ? Math.min(...allX) : 0;
  let xMax = allX.length ? Math.max(...allX) : 1;
  if (options.axis === "date") {
    if (options.from !== undefined) xMin = options.from;
    if (options.to !== undefined) xMax = options.to;
  }
  if (xMin >= xMax) xMax = xMin + (options.axis === "date" ? DAY_MS : 1);

  const yMax = allValues.length ? Math.max(...allValues) : 1;
  const yScale = scaleLinear()
    .domain([0, yMax || 1])
    .nice()
    .range([plot.y1, plot.y0]);

  // X scale + ticks, branched to keep d3 types clean.
  let projectX: (v: number) => number;
  let xTicks: AxisTick[];
  if (options.axis === "date") {
    const xs = scaleTime().domain([xMin, xMax]).range([plot.x0, plot.x1]);
    projectX = (v) => xs(v);
    xTicks = xs.ticks(6).map((d) => ({ pos: xs(d), label: formatMonth(d) }));
  } else {
    const xs = scaleLinear().domain([xMin, xMax]).range([plot.x0, plot.x1]);
    projectX = (v) => xs(v);
    xTicks = xs.ticks(6).map((v) => ({ pos: xs(v), label: formatDays(v) }));
  }

  const projected: ProjectedSeries[] = series.map((s, i) => ({
    series: s,
    points: s.records.map((r, j) => ({
      px: projectX(xValuesBySeries[i][j]),
      py: yScale(r.value),
    })),
  }));

  const yTicks: AxisTick[] = yScale
    .ticks(5)
    .map((v) => ({ pos: yScale(v), label: formatCompact(v) }));

  return { projected, xTicks, yTicks };
}

// --- Total-value comparison charts (bar / radial / pie) ----------------------

/**
 * Per-series headline total — set explicitly by the data layer so it stays
 * meaningful no matter how `records` is shaped. Clamped to ≥ 0.
 */
export function seriesTotal(series: ChartSeries): number {
  return Math.max(0, series.total);
}

export interface BarDatum {
  series: ChartSeries;
  /** Bar rect, already projected into plot coordinates. */
  x: number;
  width: number;
  /** Final top edge + height once the bar has fully grown. */
  y: number;
  height: number;
  total: number;
}

export interface BarChartScales {
  bars: BarDatum[];
  yTicks: AxisTick[];
  /** Plot-space y of the bar baseline (zero line). */
  baseline: number;
}

/**
 * Bar geometry: a `scaleBand` over repos for the x positions and a niced
 * `scaleLinear([0, maxTotal])` for the heights. `maxTotal === 0` is guarded so
 * a zero-star set still lays out cleanly (flat bars on the baseline).
 */
export function buildBarScales(series: ChartSeries[], layout: Layout): BarChartScales {
  const { plot } = layout;
  const totals = series.map(seriesTotal);
  const maxTotal = totals.length ? Math.max(...totals) : 0;

  const x = scaleBand<number>()
    .domain(series.map((_, i) => i))
    .range([plot.x0, plot.x1])
    .padding(0.3);

  const y = scaleLinear()
    .domain([0, maxTotal || 1])
    .nice()
    .range([plot.y1, plot.y0]);

  const bandWidth = x.bandwidth();
  const bars: BarDatum[] = series.map((s, i) => {
    const top = y(totals[i]);
    return {
      series: s,
      x: x(i) ?? plot.x0,
      width: bandWidth,
      y: top,
      height: plot.y1 - top,
      total: totals[i],
    };
  });

  const yTicks: AxisTick[] = y
    .ticks(5)
    .map((v) => ({ pos: y(v), label: formatCompact(v) }));

  return { bars, yTicks, baseline: plot.y1 };
}

export interface PolarLayout {
  width: number;
  height: number;
  /** Disc center + the radius of the available drawing area below the legend. */
  cx: number;
  cy: number;
  radius: number;
}

/**
 * Polar layout for the radial / pie charts: the disc is centered in the space
 * left below the legend, its radius the largest that fits with a small margin.
 * `legendTop` is `planLegend(...).topMargin` — keeps the disc clear of badges.
 * When `half` is set the chart is a 180° gauge: a semicircle is only `R` tall
 * (vs `2R` for a full disc), so it can use the whole band and is re-centered.
 */
export function buildPolarLayout(legendTop = MARGIN.top, half = false): PolarLayout {
  const width = CHART_WIDTH;
  const height = CHART_HEIGHT;
  // Vertical band between the legend and the footer credit.
  const top = Math.max(legendTop, MARGIN.top);
  const bottom = height - MARGIN.bottom + 30;
  const availableH = bottom - top;
  const cx = width / 2;

  if (half) {
    // A semicircle spans `R` vertically and `2R` horizontally — bound by both.
    const radius = Math.max(10, Math.min(availableH, width / 2 - MARGIN.right) - 14);
    // Center the semicircle's [cy - R, cy] extent in the band.
    const cy = (top + bottom) / 2 + radius / 2;
    return { width, height, cx, cy, radius };
  }

  const cy = top + availableH / 2;
  // 14px breathing room; also cap against the horizontal half-width.
  const radius = Math.max(10, Math.min(availableH / 2, width / 2 - MARGIN.right) - 14);
  return { width, height, cx, cy, radius };
}

/**
 * A `Layout` for the polar charts — `surface`, `drawBackground` and `drawFooter`
 * are cartesian helpers, so the polar charts hand them a plot box. The box keeps
 * the standard side margins so the footer credit aligns with the other charts.
 */
export function polarChartLayout(): Layout {
  const width = CHART_WIDTH;
  const height = CHART_HEIGHT;
  const x0 = MARGIN.left;
  const x1 = width - MARGIN.right;
  const y1 = height - MARGIN.bottom;
  return { width, height, plot: { x0, y0: MARGIN.top, x1, y1, width: x1 - x0, height: y1 - MARGIN.top } };
}

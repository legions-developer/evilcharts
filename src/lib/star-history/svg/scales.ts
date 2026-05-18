// Chart geometry: layout boxes, d3 scales, and tick generation.

import { scaleLinear, scaleTime } from "d3-scale";
import { timeFormat } from "d3-time-format";
import type { AxisType, RepoSeries, StarHistoryOptions } from "../types";
import { formatStars } from "./escape";

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
  series: RepoSeries;
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
function seriesXValues(series: RepoSeries, axis: AxisType): number[] {
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
  series: RepoSeries[],
  options: StarHistoryOptions,
  layout: Layout,
): ChartScales {
  const { plot } = layout;
  const xValuesBySeries = series.map((s) => seriesXValues(s, options.axis));
  const allX = xValuesBySeries.flat();
  const allStars = series.flatMap((s) => s.records.map((r) => r.stars));

  let xMin = allX.length ? Math.min(...allX) : 0;
  let xMax = allX.length ? Math.max(...allX) : 1;
  if (options.axis === "date") {
    if (options.from !== undefined) xMin = options.from;
    if (options.to !== undefined) xMax = options.to;
  }
  if (xMin >= xMax) xMax = xMin + (options.axis === "date" ? DAY_MS : 1);

  const yMax = allStars.length ? Math.max(...allStars) : 1;
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
      py: yScale(r.stars),
    })),
  }));

  const yTicks: AxisTick[] = yScale
    .ticks(5)
    .map((v) => ({ pos: yScale(v), label: formatStars(v) }));

  return { projected, xTicks, yTicks };
}

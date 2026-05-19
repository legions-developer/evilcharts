// Transforms raw daily npm downloads into a plottable series for each metric.
// `daily` is the per-day count; `rolling7` smooths it; `weekly`/`monthly` are
// summed buckets; `cumulative` is the running total.

import type { ChartPoint } from "@/lib/chart-svg/types";
import type { DailyDownload, DownloadMetric } from "./types";

/** Cap on plotted points — keeps the generated SVG path string bounded. */
const MAX_POINTS = 800;

/** Trailing moving average over `window` days. */
function rollingAverage(daily: DailyDownload[], window: number): ChartPoint[] {
  const out: ChartPoint[] = [];
  let sum = 0;
  for (let i = 0; i < daily.length; i++) {
    sum += daily[i].downloads;
    if (i >= window) sum -= daily[i - window].downloads;
    const count = Math.min(i + 1, window);
    out.push({ date: daily[i].date, value: Math.round(sum / count) });
  }
  return out;
}

/** Running cumulative total. */
function cumulative(daily: DailyDownload[]): ChartPoint[] {
  let running = 0;
  return daily.map((d) => {
    running += d.downloads;
    return { date: d.date, value: running };
  });
}

/** Bucket daily counts by a UTC period key, summing downloads per bucket. */
function bucket(daily: DailyDownload[], keyOf: (d: Date) => number): ChartPoint[] {
  const buckets = new Map<number, number>();
  for (const d of daily) {
    const key = keyOf(new Date(d.date));
    buckets.set(key, (buckets.get(key) ?? 0) + d.downloads);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([date, value]) => ({ date, value }));
}

/** UTC week start (Monday) for a date. */
function weekStart(d: Date): number {
  const dayFromMonday = (d.getUTCDay() + 6) % 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dayFromMonday);
}

/** UTC month start for a date. */
function monthStart(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
}

/** Even downsample so a long series stays within MAX_POINTS, keeping the last. */
function clampPoints(points: ChartPoint[]): ChartPoint[] {
  if (points.length <= MAX_POINTS) return points;
  const step = points.length / MAX_POINTS;
  const out: ChartPoint[] = [];
  for (let i = 0; i < MAX_POINTS; i++) out.push(points[Math.floor(i * step)]);
  const last = points[points.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

/** Transform raw daily downloads into a chart series for the chosen metric. */
export function applyMetric(daily: DailyDownload[], metric: DownloadMetric): ChartPoint[] {
  let points: ChartPoint[];
  switch (metric) {
    case "rolling7":
      points = rollingAverage(daily, 7);
      break;
    case "weekly":
      points = bucket(daily, weekStart);
      break;
    case "monthly":
      points = bucket(daily, monthStart);
      break;
    case "cumulative":
      points = cumulative(daily);
      break;
    case "daily":
    default:
      points = daily.map((d) => ({ date: d.date, value: d.downloads }));
      break;
  }
  return clampPoints(points);
}

/** Y-axis title for the chosen metric. */
export function metricAxisTitle(metric: DownloadMetric): string {
  switch (metric) {
    case "rolling7":
      return "Downloads (7-day avg)";
    case "weekly":
      return "Weekly downloads";
    case "monthly":
      return "Monthly downloads";
    case "cumulative":
      return "Cumulative downloads";
    case "daily":
    default:
      return "Daily downloads";
  }
}

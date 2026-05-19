// Client-side config model for the npm-downloads tool.

import type { DateRangeValue } from "@/components/ui/date-range-picker";
import { DEFAULT_METRIC, DEFAULT_RING_WIDTH } from "@/lib/npm-downloads/query-schema";
import { DEFAULT_COLORS } from "@/lib/chart-svg/svg/theme";
import type {
  AxisType,
  BackgroundPattern,
  ChartType,
  FillPattern,
  StrokeVariant,
  ThemeName,
} from "@/lib/chart-svg/types";
import type { DownloadMetric } from "@/lib/npm-downloads/types";

export interface PackageEntry {
  /** Stable key for React lists. */
  id: string;
  /** A package name ("react", "@scope/pkg") or an npmjs.com URL. */
  value: string;
  color: string;
}

export interface NpmDownloadsConfig {
  packages: PackageEntry[];
  /** How the raw daily downloads are shaped before plotting. */
  metric: DownloadMetric;
  theme: ThemeName;
  /** Chart shape — line / bar / radial / pie. */
  chartType: ChartType;
  axis: AxisType;
  animate: boolean;
  /** Seconds between automatic replays of the draw-on animation — 0 disables it. */
  loopInterval: number;
  axisLabels: boolean;
  /** Extra gap (px) between the axis titles and the chart. */
  axisLabelOffset: number;
  /** Chart line stroke width (px). */
  strokeWidth: number;
  /** Per-point dot radius (px) — 0 hides the dots. */
  dotSize: number;
  /** Area fill opacity as a percent (0–100). */
  fillOpacity: number;
  /** Percent of the area fill, from the baseline up, that dissolves to transparent (0 = no fade). */
  fillFade: number;
  /** Area fill style. */
  fillPattern: FillPattern;
  /** Chart line stroke style. */
  strokeVariant: StrokeVariant;
  /** Decorative pattern drawn behind the chart. */
  backgroundPattern: BackgroundPattern;
  /** Opacity of the background pattern as a percent (0–100). */
  backgroundPatternOpacity: number;
  /** Band thickness (px) of each radial ring. */
  radialRingWidth: number;
  /** Pie donut-hole radius as a percent of the outer radius. */
  pieInnerRadius: number;
  range: DateRangeValue;
}

let idCounter = 0;

/** Deterministic id — counter resets per module load, so SSR and client agree. */
export function newPackageId(): string {
  idCounter += 1;
  return `pkg-${idCounter}`;
}

export function defaultColor(index: number): string {
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

export function createDefaultConfig(): NpmDownloadsConfig {
  return {
    packages: [],
    metric: DEFAULT_METRIC,
    theme: "light",
    chartType: "line",
    axis: "date",
    animate: true,
    loopInterval: 0,
    axisLabels: false,
    axisLabelOffset: 12,
    strokeWidth: 2,
    // Daily downloads can run to hundreds of points — dots off reads cleaner.
    dotSize: 0,
    fillOpacity: 25,
    fillFade: 0,
    fillPattern: "gradient",
    strokeVariant: "solid",
    backgroundPattern: "none",
    backgroundPatternOpacity: 100,
    radialRingWidth: DEFAULT_RING_WIDTH,
    pieInnerRadius: 0,
    range: { mode: "lifetime" },
  };
}

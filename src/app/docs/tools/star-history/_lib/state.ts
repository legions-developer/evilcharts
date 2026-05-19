// Client-side config model for the star-history tool.

import type { DateRangeValue } from "@/components/ui/date-range-picker";
import { DEFAULT_DOT_SIZE, DEFAULT_RING_WIDTH } from "@/lib/star-history/query-schema";
import { DEFAULT_COLORS } from "@/lib/star-history/svg/theme";
import type {
  AxisType,
  BackgroundPattern,
  ChartType,
  FillPattern,
  StrokeVariant,
  ThemeName,
} from "@/lib/star-history/types";

export interface RepoEntry {
  /** Stable key for React lists. */
  id: string;
  /** "owner/repo" or a GitHub URL. */
  value: string;
  color: string;
}

export interface StarHistoryConfig {
  repos: RepoEntry[];
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
export function newRepoId(): string {
  idCounter += 1;
  return `repo-${idCounter}`;
}

export function defaultColor(index: number): string {
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

export function createDefaultConfig(): StarHistoryConfig {
  return {
    repos: [],
    theme: "light",
    chartType: "line",
    axis: "date",
    animate: true,
    loopInterval: 0,
    axisLabels: false,
    axisLabelOffset: 12,
    strokeWidth: 2,
    dotSize: DEFAULT_DOT_SIZE,
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

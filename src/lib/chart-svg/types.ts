// Shared, tool-agnostic types for the SVG chart generator. Both the GitHub
// star-history tool and the npm-downloads tool feed this layer: each maps its
// own domain data into a `ChartSeries[]` and builds a `ChartOptions`.

export type ThemeName = "light" | "dark";
export type AxisType = "date" | "timeline";
/** Chart shape: cumulative/over-time line, or total-value bar/radial/pie comparison. */
export type ChartType = "line" | "bar" | "radial" | "radial-half" | "pie";
/** Area fill style under the chart line. */
export type FillPattern = "gradient" | "solid" | "hatched" | "lines" | "dotted";
/** Chart line stroke style. */
export type StrokeVariant = "solid" | "dashed" | "animated-dashed";
/** Decorative pattern drawn behind the chart — "none" disables it. */
export type BackgroundPattern =
  | "none"
  | "dots"
  | "grid"
  | "cross-hatch"
  | "diagonal-lines"
  | "plus"
  | "falling-triangles"
  | "4-pointed-star"
  | "tiny-checkers"
  | "overlapping-circles"
  | "wiggle-lines"
  | "bubbles";

/** One sampled point of a series. */
export interface ChartPoint {
  /** Timestamp (ms). */
  date: number;
  /** Value at `date` — cumulative stars, daily downloads, etc. */
  value: number;
}

/** A single plotted series — one repo, one package, …. */
export interface ChartSeries {
  /** Display label shown in the legend. */
  label: string;
  records: ChartPoint[];
  /**
   * Headline total for the bar / radial / pie comparison charts. The data
   * layer sets this explicitly so it stays meaningful regardless of how
   * `records` is shaped (cumulative vs. per-bucket).
   */
  total: number;
  /** True when the upstream source truncated the history. */
  truncated: boolean;
}

/** Options consumed by the SVG generator. */
export interface ChartOptions {
  theme: ThemeName;
  /** Chart shape — `line` plots the series over time, the rest compare totals. */
  chartType: ChartType;
  axis: AxisType;
  animate: boolean;
  /**
   * Seconds between automatic replays of the draw-on animation — the SVG
   * re-runs its reveal on a loop. 0 disables it (animate once and hold).
   */
  loopInterval: number;
  /** Draw axis titles beside the ticks. */
  axisLabels: boolean;
  /** Extra gap (px) between the axis titles and the chart — shared by both axes. */
  axisLabelOffset: number;
  /** Chart line stroke width (px). */
  strokeWidth: number;
  /** Radius (px) of the per-point dots — 0 hides them entirely. */
  dotSize: number;
  /** Area fill opacity as a percent (0–100). */
  fillOpacity: number;
  /** Percent of the area fill, from the baseline up, that dissolves to transparent (0 = no fade). */
  fillFade: number;
  /** Area fill style. */
  fillPattern: FillPattern;
  /** Chart line stroke style. */
  strokeVariant: StrokeVariant;
  /** Decorative pattern drawn behind the chart (replaces grid lines when set). */
  backgroundPattern: BackgroundPattern;
  /** Opacity of the background pattern as a percent (0–100). */
  backgroundPatternOpacity: number;
  /** Band thickness (px) of each ring — radial / radial-half only. */
  radialRingWidth: number;
  /** Pie donut-hole radius as a percent of the outer radius (0 = full pie). */
  pieInnerRadius: number;
  /** Per-series colors; falls back to the default palette by index. */
  colors: string[];
  /** Optional custom date-range clamp (ms). */
  from?: number;
  to?: number;
  // --- Tool-supplied labels — keep the SVG layer free of any domain wording ---
  /** Rotated y-axis title, e.g. "GitHub Stars" or "Downloads". */
  valueAxisTitle: string;
  /** X-axis title shown when `axis` is "date". */
  dateAxisTitle: string;
  /** X-axis title shown when `axis` is "timeline". */
  timelineAxisTitle: string;
  /** Footer note rendered when a series is truncated — "" for no note. */
  truncationNote: string;
}

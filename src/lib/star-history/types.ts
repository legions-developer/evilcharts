// Shared types and error classes for the star-history tool.

export type ThemeName = "light" | "dark";
export type AxisType = "date" | "timeline";
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

/** One sampled point of a repo's star history. */
export interface StarRecord {
  /** Timestamp (ms) at which the repo reached `stars`. */
  date: number;
  /** Cumulative star count at `date`. */
  stars: number;
}

/** A repo's full sampled star history. */
export interface RepoSeries {
  owner: string;
  repo: string;
  /** "owner/repo" — display label. */
  label: string;
  records: StarRecord[];
  /** True when GitHub's 400-page pagination cap truncated the history. */
  truncated: boolean;
}

/** Options consumed by the SVG generator. */
export interface StarHistoryOptions {
  theme: ThemeName;
  axis: AxisType;
  /** Resolved background fill, or `null` for a transparent chart. */
  background: string | null;
  animate: boolean;
  /**
   * Seconds between automatic replays of the draw-on animation — the SVG
   * re-runs its reveal on a loop. 0 disables it (animate once and hold).
   */
  loopInterval: number;
  /** Draw axis titles ("GitHub Stars" / the x-axis name) beside the ticks. */
  axisLabels: boolean;
  /** Extra gap (px) between the axis titles and the chart — shared by both axes. */
  axisLabelOffset: number;
  /** Chart line stroke width (px). */
  strokeWidth: number;
  /** Radius (px) of the per-point dots — 0 hides them entirely. */
  dotSize: number;
  /** Area fill opacity as a percent (0–100). */
  fillOpacity: number;
  /** Area fill style. */
  fillPattern: FillPattern;
  /** Chart line stroke style. */
  strokeVariant: StrokeVariant;
  /** Decorative pattern drawn behind the chart (replaces grid lines when set). */
  backgroundPattern: BackgroundPattern;
  /** Opacity of the background pattern as a percent (0–100). */
  backgroundPatternOpacity: number;
  /** Per-series colors; falls back to the default palette by index. */
  colors: string[];
  /** Optional custom date-range clamp (ms). */
  from?: number;
  to?: number;
}

/** Base error — carries a short, user-facing message rendered into the error SVG. */
export class StarHistoryError extends Error {
  constructor(
    message: string,
    readonly userMessage: string,
  ) {
    super(message);
    this.name = "StarHistoryError";
  }
}

export class BadRepoError extends StarHistoryError {
  constructor(input: string) {
    super(`Invalid repository input: ${input}`, `Invalid repository: ${input}`);
    this.name = "BadRepoError";
  }
}

export class RepoNotFoundError extends StarHistoryError {
  constructor(slug: string) {
    super(`Repository not found: ${slug}`, `Repository not found: ${slug}`);
    this.name = "RepoNotFoundError";
  }
}

export class RateLimitedError extends StarHistoryError {
  constructor() {
    super(
      "GitHub API rate limit reached",
      "GitHub rate limit reached — please try again shortly",
    );
    this.name = "RateLimitedError";
  }
}

export class NetworkError extends StarHistoryError {
  constructor() {
    super("Network error reaching GitHub", "Could not reach GitHub — please try again");
    this.name = "NetworkError";
  }
}

export class GithubError extends StarHistoryError {
  constructor(status: number) {
    super(`GitHub API error: ${status}`, "Could not load data from GitHub");
    this.name = "GithubError";
  }
}

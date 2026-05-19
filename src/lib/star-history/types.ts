// Star-history-specific types and error classes. The chart styling/option
// types are shared across tools — see `@/lib/chart-svg/types`.

export type {
  ThemeName,
  AxisType,
  ChartType,
  FillPattern,
  StrokeVariant,
  BackgroundPattern,
} from "@/lib/chart-svg/types";

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

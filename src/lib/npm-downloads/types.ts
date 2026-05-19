// npm-downloads-specific types and error classes. The chart styling/option
// types are shared across tools — see `@/lib/chart-svg/types`.

/** How a package's raw daily downloads are shaped before plotting. */
export type DownloadMetric = "daily" | "rolling7" | "weekly" | "monthly" | "cumulative";

/** One day of downloads from the npm registry API. */
export interface DailyDownload {
  /** Midnight-UTC timestamp (ms) of the day. */
  date: number;
  downloads: number;
}

/** A package's raw daily download history over the requested range. */
export interface PackageDownloads {
  /** Canonical package name, e.g. "react" or "@scope/pkg". */
  name: string;
  /** Display label shown in the legend. */
  label: string;
  /** Daily downloads, sorted ascending by date. */
  daily: DailyDownload[];
  /** Sum of every daily count in the range — the headline comparison total. */
  total: number;
}

/** Base error — carries a short, user-facing message rendered into the error SVG. */
export class NpmDownloadsError extends Error {
  constructor(
    message: string,
    readonly userMessage: string,
  ) {
    super(message);
    this.name = "NpmDownloadsError";
  }
}

export class BadPackageError extends NpmDownloadsError {
  constructor(input: string) {
    super(`Invalid package input: ${input}`, `Invalid package name: ${input}`);
    this.name = "BadPackageError";
  }
}

export class PackageNotFoundError extends NpmDownloadsError {
  constructor(name: string) {
    super(`Package not found: ${name}`, `Package not found: ${name}`);
    this.name = "PackageNotFoundError";
  }
}

export class NpmNetworkError extends NpmDownloadsError {
  constructor() {
    super(
      "Network error reaching the npm registry",
      "Could not reach the npm registry — please try again",
    );
    this.name = "NpmNetworkError";
  }
}

export class NpmApiError extends NpmDownloadsError {
  constructor(status: number) {
    super(`npm downloads API error: ${status}`, "Could not load data from npm");
    this.name = "NpmApiError";
  }
}

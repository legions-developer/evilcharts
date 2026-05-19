// npm registry data layer. The downloads API (api.npmjs.org) is fully public
// and unauthenticated — no tokens, no rotation pool, unlike the GitHub layer.
// A single range request is capped at 18 months, so longer spans are chunked.

import type { ParsedPackage } from "./parse-package";
import {
  NpmApiError,
  NpmNetworkError,
  PackageNotFoundError,
  type DailyDownload,
  type PackageDownloads,
} from "./types";

const RANGE_API = "https://api.npmjs.org/downloads/range";
const DAY_MS = 86_400_000;
/** npm download stats begin on 2015-01-10 — earlier requests return nothing. */
export const EARLIEST_MS = Date.UTC(2015, 0, 10);
/** npm caps a range request at 18 months; chunk well below that for headroom. */
const CHUNK_DAYS = 500;
const TIMEOUT_MS = 10_000;
const REVALIDATE_SECONDS = 86_400;

interface NpmRangeResponse {
  start?: string;
  end?: string;
  package?: string;
  downloads?: { day: string; downloads: number }[];
  error?: string;
}

/** YYYY-MM-DD for a ms timestamp, in UTC — the format the npm API expects. */
function ymd(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Split [from, to] into ≤ CHUNK_DAYS windows the npm range endpoint accepts. */
function chunkRange(from: number, to: number): { start: string; end: string }[] {
  const chunks: { start: string; end: string }[] = [];
  let cursor = from;
  while (cursor <= to) {
    const end = Math.min(cursor + (CHUNK_DAYS - 1) * DAY_MS, to);
    chunks.push({ start: ymd(cursor), end: ymd(end) });
    cursor = end + DAY_MS;
  }
  return chunks;
}

/** Fetch one ≤ 18-month window of daily downloads for a package. */
async function fetchChunk(name: string, start: string, end: string): Promise<DailyDownload[]> {
  // Encode each path segment so scoped names ("@scope/pkg") stay URL-safe.
  const encoded = name.split("/").map(encodeURIComponent).join("/");

  let res: Response;
  try {
    res = await fetch(`${RANGE_API}/${start}:${end}/${encoded}`, {
      headers: { "User-Agent": "evilcharts-npm-downloads", Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new NpmNetworkError();
  }

  if (res.status === 404) throw new PackageNotFoundError(name);
  if (!res.ok) throw new NpmApiError(res.status);

  const data = (await res.json()) as NpmRangeResponse;
  // The API can also signal a missing package via a 200 + `error` field.
  if (data.error) {
    if (/not found/i.test(data.error)) throw new PackageNotFoundError(name);
    throw new NpmApiError(200);
  }

  return (data.downloads ?? []).map((d) => ({
    date: Date.parse(`${d.day}T00:00:00Z`),
    downloads: d.downloads ?? 0,
  }));
}

/**
 * Fetch a package's daily download history across [from, to] (ms, UTC).
 * `from` is clamped to the earliest date npm has data for.
 */
export async function fetchPackageDownloads(
  pkg: ParsedPackage,
  from: number,
  to: number,
): Promise<PackageDownloads> {
  const start = Math.max(from, EARLIEST_MS);
  const end = Math.max(start, to);

  const chunks = chunkRange(start, end);
  const parts = await Promise.all(
    chunks.map((c) => fetchChunk(pkg.name, c.start, c.end)),
  );

  // Merge chunks, dedupe by day, drop bad timestamps, sort ascending.
  const byDay = new Map<number, number>();
  for (const part of parts) {
    for (const d of part) {
      if (Number.isFinite(d.date)) byDay.set(d.date, d.downloads);
    }
  }
  const daily: DailyDownload[] = [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([date, downloads]) => ({ date, downloads }));

  const total = daily.reduce((sum, d) => sum + d.downloads, 0);
  return { name: pkg.name, label: pkg.name, daily, total };
}

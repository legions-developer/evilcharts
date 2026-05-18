// GitHub data layer — a port of star-history's `getRepoStarRecords` sampling.
// For a repo with many stargazers it fetches only ~SAMPLE_PAGES evenly-spaced
// pages instead of every page, keeping each repo to ~18 GitHub requests.

import type { ParsedRepo } from "./parse-repo";
import { acquireToken, benchToken, hasTokens } from "./token-pool";
import {
  GithubError,
  NetworkError,
  RateLimitedError,
  RepoNotFoundError,
  type RepoSeries,
  type StarRecord,
} from "./types";

const API_BASE = "https://api.github.com";
const PER_PAGE = 100;
const SAMPLE_PAGES = 16;
/** GitHub caps stargazer pagination at 400 pages (~40k stars). */
const MAX_PAGE = 400;
/** This Accept header makes GitHub include `starred_at` on each stargazer. */
const STAR_ACCEPT = "application/vnd.github.v3.star+json";
const JSON_ACCEPT = "application/vnd.github+json";
const TIMEOUT_MS = 10_000;
const REVALIDATE_SECONDS = 86_400;

interface StargazerEntry {
  starred_at: string;
}

interface GithubResponse {
  data: unknown;
  headers: Headers;
}

/** Single GitHub API call with token rotation, caching, timeout and error mapping. */
async function ghFetch(path: string, accept: string, slug: string): Promise<GithubResponse> {
  const token = acquireToken();
  // Tokens are configured but every one is benched → treat as rate-limited.
  if (!token && hasTokens()) throw new RateLimitedError();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: {
        Accept: accept,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "evilcharts-star-history",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new NetworkError();
  }

  // 401 = the token is invalid/expired; 403/429 = rate limited. Either way the
  // token is unusable — bench it so it leaves the rotation and a retry can pick
  // a fresh one, rather than reusing the bad token and failing again.
  if (res.status === 401 || res.status === 403 || res.status === 429) {
    if (token) benchToken(token);
    throw new RateLimitedError();
  }
  if (res.status === 404) throw new RepoNotFoundError(slug);
  if (!res.ok) throw new GithubError(res.status);

  return { data: await res.json(), headers: res.headers };
}

/** Extract the `rel="last"` page number from a GitHub `Link` header. */
function parseLastPage(linkHeader: string | null): number {
  if (!linkHeader) return 1;
  const match = /[?&]page=(\d+)[^>]*>;\s*rel="last"/.exec(linkHeader);
  if (match) {
    const n = Number(match[1]);
    if (Number.isInteger(n) && n > 0) return n;
  }
  return 1;
}

function range(start: number, end: number): number[] {
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

/** Choose which stargazer pages to fetch — all of them, or an even sample. */
function selectPages(pageCount: number, sampleSize: number): number[] {
  if (pageCount <= sampleSize) return range(1, pageCount);

  const pages = new Set<number>([1]); // always anchor on page 1
  for (let i = 1; i <= sampleSize; i++) {
    const p = Math.round((i * pageCount) / sampleSize) - 1;
    pages.add(Math.max(1, Math.min(p, pageCount)));
  }
  return [...pages].sort((a, b) => a - b);
}

function asEntries(data: unknown): StargazerEntry[] {
  return Array.isArray(data) ? (data as StargazerEntry[]) : [];
}

/** Keep one record per timestamp, preferring the higher star count. */
function dedupeByDate(sorted: StarRecord[]): StarRecord[] {
  const out: StarRecord[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && last.date === r.date) {
      if (r.stars > last.stars) out[out.length - 1] = r;
    } else {
      out.push(r);
    }
  }
  return out;
}

/** Fetch a repo's sampled cumulative star history. */
export async function fetchStarRecords(repo: ParsedRepo): Promise<RepoSeries> {
  const slug = `${repo.owner}/${repo.repo}`;
  const stargazersPath = (page: number) =>
    `/repos/${slug}/stargazers?per_page=${PER_PAGE}&page=${page}`;

  // 1. Page 1 also gives us the `Link` header for the total page count.
  const firstPage = await ghFetch(stargazersPath(1), STAR_ACCEPT, slug);
  const firstData = asEntries(firstPage.data);

  let pageCount = parseLastPage(firstPage.headers.get("link"));
  const truncated = pageCount > MAX_PAGE;
  pageCount = Math.min(pageCount, MAX_PAGE);

  // 2. Pick pages, then fetch the ones we don't already have.
  const pages = selectPages(pageCount, SAMPLE_PAGES);
  const pageData = new Map<number, StargazerEntry[]>([[1, firstData]]);
  const toFetch = pages.filter((p) => p !== 1);
  const fetched = await Promise.all(
    toFetch.map((p) => ghFetch(stargazersPath(p), STAR_ACCEPT, slug)),
  );
  toFetch.forEach((p, i) => pageData.set(p, asEntries(fetched[i].data)));

  // 3. Build cumulative star records.
  const records: StarRecord[] = [];
  if (pageCount <= SAMPLE_PAGES) {
    // Small repo: we have every stargazer — sample evenly across all of them.
    const all: StargazerEntry[] = [];
    for (const p of pages) all.push(...(pageData.get(p) ?? []));
    const step = Math.max(1, Math.floor(all.length / SAMPLE_PAGES));
    for (let i = 0; i < all.length; i += step) {
      records.push({ date: new Date(all[i].starred_at).getTime(), stars: i + 1 });
    }
  } else {
    // Large repo: page p's first stargazer is the (p-1)*100+1-th star.
    for (const p of pages) {
      const entries = pageData.get(p);
      if (entries && entries.length > 0) {
        records.push({
          date: new Date(entries[0].starred_at).getTime(),
          stars: PER_PAGE * (p - 1) + 1,
        });
      }
    }
  }

  // 4. Append the current total from the repo-info endpoint.
  const repoInfo = await ghFetch(`/repos/${slug}`, JSON_ACCEPT, slug);
  const totalStars = (repoInfo.data as { stargazers_count?: number }).stargazers_count ?? 0;
  records.push({ date: Date.now(), stars: totalStars });

  // 5. Sort by date, drop bad timestamps, dedupe.
  const cleaned = dedupeByDate(
    records.filter((r) => Number.isFinite(r.date)).sort((a, b) => a.date - b.date),
  );

  return { owner: repo.owner, repo: repo.repo, label: slug, records: cleaned, truncated };
}

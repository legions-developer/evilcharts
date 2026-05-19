// The /api/star-history query contract: the star-history-specific schema +
// parser + URL builder, composed from the shared chart query module. The
// shared styling constants are re-exported so the tool UI keeps one import.

import { z } from "zod";
import {
  appendChartStyleParams,
  chartStyleShape,
  parseChartStyleParams,
  type ChartStyleUrlInput,
} from "@/lib/chart-svg/query";

export * from "@/lib/chart-svg/query";

/** Most repositories that can be compared on one chart. */
export const MAX_REPOS = 8;

export const starHistoryQuerySchema = z.object({
  ...chartStyleShape,
  repos: z
    .array(z.string().trim().min(1))
    .min(1, "Add at least one repository")
    .max(MAX_REPOS, `At most ${MAX_REPOS} repositories`),
});

export type StarHistoryQuery = z.infer<typeof starHistoryQuerySchema>;

/** Parse + validate an incoming request's query params. */
export function parseStarHistoryQuery(params: URLSearchParams) {
  return starHistoryQuerySchema.safeParse({
    ...parseChartStyleParams(params),
    repos: params.getAll("repo"),
  });
}

export interface StarHistoryUrlInput extends ChartStyleUrlInput {
  /** Each repo carries its color so `repo`/`color` params stay positionally aligned. */
  repos: { value: string; color: string }[];
}

/** Build the /api/star-history URL from page config. `base` may be an absolute origin. */
export function buildStarHistoryUrl(input: StarHistoryUrlInput, base = ""): string {
  const params = new URLSearchParams();
  for (const repo of input.repos) {
    const value = repo.value.trim();
    if (!value) continue;
    params.append("repo", value);
    params.append("color", repo.color);
  }
  appendChartStyleParams(params, input);
  return `${base}/api/star-history?${params.toString()}`;
}

// Client-side validation for the repository input — accepts a plain
// "owner/repo" slug or a github.com URL, and rejects everything else.

import { z } from "zod";

/** GitHub's allowed charset for an owner or repo name segment. */
const SEGMENT = /^[A-Za-z0-9._-]+$/;

/**
 * Pull a canonical "owner/repo" out of a plain slug or a github.com URL.
 * Returns null for anything else — localhost, other hosts, malformed input.
 */
function extractRepoSlug(input: string): string | null {
  let path = input.trim();

  // URL-ish input (a scheme, or a leading "host.tld/") must live on github.com.
  if (/^https?:\/\//i.test(path) || /^[\w-]+(\.[\w-]+)+\//.test(path)) {
    let url: URL;
    try {
      url = new URL(path.startsWith("http") ? path : `https://${path}`);
    } catch {
      return null;
    }
    if (url.hostname.replace(/^www\./i, "").toLowerCase() !== "github.com") {
      return null;
    }
    path = url.pathname;
  }

  const parts = path.split("/").filter(Boolean);
  if (parts.length !== 2) return null;

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, "");
  if (!SEGMENT.test(owner) || !SEGMENT.test(repo)) return null;

  return `${owner}/${repo}`;
}

/** Validates a repo input and normalizes it to a canonical "owner/repo". */
export const repoInputSchema = z
  .string()
  .trim()
  .min(1, "Enter a repository")
  .transform((value, ctx) => {
    const slug = extractRepoSlug(value);
    if (!slug) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a GitHub repo — owner/repo or a github.com URL",
      });
      return z.NEVER;
    }
    return slug;
  });

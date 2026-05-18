import { BadRepoError } from "./types";

/** GitHub's allowed charset for an owner or repo name segment. */
const SEGMENT = /^[A-Za-z0-9._-]+$/;

export interface ParsedRepo {
  owner: string;
  repo: string;
}

/**
 * Parse a GitHub repo from either a full URL (https://github.com/owner/repo)
 * or a plain "owner/repo" string. Throws `BadRepoError` on anything malformed.
 */
export function parseRepo(input: string): ParsedRepo {
  const trimmed = input.trim();
  if (!trimmed) throw new BadRepoError(input);

  let ownerRepo = trimmed;

  // URL-ish input (a scheme, or a leading "host.tld/") must live on github.com.
  if (/^https?:\/\//i.test(trimmed) || /^[\w-]+(\.[\w-]+)+\//.test(trimmed)) {
    let url: URL;
    try {
      url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    } catch {
      throw new BadRepoError(input);
    }
    if (url.hostname.replace(/^www\./i, "").toLowerCase() !== "github.com") {
      throw new BadRepoError(input);
    }
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length < 2) throw new BadRepoError(input);
    ownerRepo = `${segments[0]}/${segments[1]}`;
  }

  const parts = ownerRepo.split("/").filter(Boolean);
  if (parts.length !== 2) throw new BadRepoError(input);

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/, "");

  if (!SEGMENT.test(owner) || !SEGMENT.test(repo)) throw new BadRepoError(input);

  return { owner, repo };
}

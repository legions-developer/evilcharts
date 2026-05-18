"use client";

import { ArrowRightIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MAX_REPOS } from "@/lib/star-history/query-schema";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";

import { defaultColor, newRepoId, type RepoEntry } from "../_lib/state";
import { repoInputSchema } from "../_lib/repo-input";

interface RepoInputListProps {
  repos: RepoEntry[];
  onChange: (repos: RepoEntry[]) => void;
}

/**
 * A single repo input with a color picker — Enter or the arrow button commits
 * it. Committed repos render below as removable, color-tagged badges.
 */
export function RepoInputList({ repos, onChange }: RepoInputListProps) {
  const [draft, setDraft] = useState("");
  const [color, setColor] = useState(() => defaultColor(0));
  const [error, setError] = useState<string | null>(null);

  const atCapacity = repos.length >= MAX_REPOS;

  const submit = () => {
    if (atCapacity) return;

    const parsed = repoInputSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid repository");
      return;
    }

    const slug = parsed.data;
    // Ignore duplicates — same repo, regardless of casing.
    if (repos.some((r) => r.value.toLowerCase() === slug.toLowerCase())) {
      setError("That repository is already added");
      return;
    }

    onChange([...repos, { id: newRepoId(), value: slug, color }]);
    setColor(defaultColor(repos.length + 1));
    setDraft("");
    setError(null);
  };

  const remove = (id: string) => onChange(repos.filter((r) => r.id !== id));

  return (
    <div className="space-y-3">
      <div>
        <div className="relative">
          {/* Absolutely placed so it reads as "inside" the input without
              overlapping its click target — the swatch keeps its own. */}
          <ColorPicker
            value={color}
            onChange={setColor}
            className="absolute top-1/2 left-1.5 z-10 size-5 -translate-y-1/2"
          />
          <Input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={
              atCapacity ? `Repository limit reached (${MAX_REPOS})` : "Add a GitHub repository…"
            }
            disabled={atCapacity}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="GitHub repository"
            aria-invalid={error ? true : undefined}
            className="pr-9 pl-8"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim() || atCapacity}
            aria-label="Add repository"
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1.5 z-10 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-default disabled:opacity-30"
          >
            <ArrowRightIcon className="size-4" />
          </button>
        </div>
        {error && <p className="text-destructive mt-1.5 text-xs">{error}</p>}
      </div>

      {repos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {repos.map((repo) => (
            <Tooltip key={repo.id}>
              <TooltipTrigger asChild>
                <span className="group bg-muted/60 text-foreground/80 hover:bg-muted relative flex max-w-[220px] items-center gap-1.5 overflow-hidden rounded-md border px-1 py-1 pr-2 text-xs whitespace-nowrap transition-colors">
                  <span
                    className="size-4 shrink-0 rounded-[3px]"
                    style={{ backgroundColor: repo.color }}
                  />
                  <span className="min-w-0 truncate font-mono">{repo.value.split("/").pop()}</span>
                  {/* Overlaid on the right; a gradient fades the text beneath
                      it so the cross stays readable without reserving space. */}
                  <button
                    type="button"
                    onClick={() => remove(repo.id)}
                    aria-label={`Remove ${repo.value}`}
                    className="from-muted via-muted text-muted-foreground hover:text-primary focus-visible:text-primary absolute inset-y-0 right-0 flex cursor-pointer items-center bg-linear-to-l to-transparent pr-1 pl-6 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <XIcon className="size-3" />
                  </button>
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-md text-balance">{repo.value}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { ArrowRightIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MAX_PACKAGES } from "@/lib/npm-downloads/query-schema";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";

import { defaultColor, newPackageId, type PackageEntry } from "../_lib/state";
import { packageInputSchema } from "../_lib/package-input";

interface PackageInputListProps {
  packages: PackageEntry[];
  onChange: (packages: PackageEntry[]) => void;
}

/**
 * A single package input with a color picker — Enter or the arrow button
 * commits it. Committed packages render below as removable, color-tagged badges.
 */
export function PackageInputList({ packages, onChange }: PackageInputListProps) {
  const [draft, setDraft] = useState("");
  const [color, setColor] = useState(() => defaultColor(0));
  const [error, setError] = useState<string | null>(null);

  const atCapacity = packages.length >= MAX_PACKAGES;

  const submit = () => {
    if (atCapacity) return;

    const parsed = packageInputSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid package");
      return;
    }

    const name = parsed.data;
    // Ignore duplicates — same package, regardless of casing.
    if (packages.some((p) => p.value.toLowerCase() === name.toLowerCase())) {
      setError("That package is already added");
      return;
    }

    onChange([...packages, { id: newPackageId(), value: name, color }]);
    setColor(defaultColor(packages.length + 1));
    setDraft("");
    setError(null);
  };

  const remove = (id: string) => onChange(packages.filter((p) => p.id !== id));

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
              atCapacity ? `Package limit reached (${MAX_PACKAGES})` : "Add an npm package…"
            }
            disabled={atCapacity}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="npm package"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "npm-package-error" : undefined}
            className="pr-9 pl-8"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim() || atCapacity}
            aria-label="Add package"
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1.5 z-10 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-default disabled:opacity-30"
          >
            <ArrowRightIcon className="size-4" />
          </button>
        </div>
        {error && (
          <p id="npm-package-error" role="alert" className="text-destructive mt-1.5 text-xs">
            {error}
          </p>
        )}
      </div>

      {packages.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {packages.map((pkg) => (
            <Tooltip key={pkg.id}>
              <TooltipTrigger asChild>
                <span className="group bg-muted/60 text-foreground/80 hover:bg-muted relative flex max-w-[220px] items-center gap-1.5 overflow-hidden rounded-md px-1.5 py-1.5 pr-2.5 text-xs whitespace-nowrap transition-colors">
                  <span
                    className="size-4 shrink-0 rounded-[3px]"
                    style={{ backgroundColor: pkg.color }}
                  />
                  <span className="min-w-0 truncate font-mono">{pkg.value}</span>
                  {/* Overlaid on the right; a gradient fades the text beneath
                      it so the cross stays readable without reserving space. */}
                  <button
                    type="button"
                    onClick={() => remove(pkg.id)}
                    aria-label={`Remove ${pkg.value}`}
                    className="from-muted via-muted text-muted-foreground hover:text-primary focus-visible:text-primary absolute inset-y-0 right-0 flex cursor-pointer items-center bg-linear-to-l to-transparent pr-1 pl-6 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <XIcon className="size-3" />
                  </button>
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-md text-balance">{pkg.value}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useClipboard } from "@mantine/hooks";
import { CheckIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";

import { SvgActions } from "./svg-actions";

/** Embed-tab content: copy-paste snippets for dropping the chart anywhere. */
interface EmbedSnippetsProps {
  /** Relative /api/star-history URL. */
  embedUrl: string;
  /** Absolute origin, resolved client-side; empty before mount. */
  origin: string;
  /** Fetches the exported SVG markup — a shared, cached query. */
  fetchSvg: () => Promise<string>;
  hasRepos: boolean;
}

export function EmbedSnippets({ embedUrl, origin, fetchSvg, hasRepos }: EmbedSnippetsProps) {
  if (!hasRepos) {
    return (
      <div className="text-muted-foreground flex aspect-video items-center justify-center p-6 text-xs">
        Add a repository below to generate an embeddable chart.
      </div>
    );
  }

  const fullUrl = `${origin}${embedUrl}`;
  // Theme-forced variants of the current config — used by the <picture> snippet
  // so a README renders the matching chart for the reader's color scheme.
  const darkUrl = fullUrl.replace(/([?&]theme=)[^&]*/, "$1dark");
  const lightUrl = fullUrl.replace(/([?&]theme=)[^&]*/, "$1light");

  const snippets = [
    { label: "Markdown", code: `![GitHub Star History Chart](${fullUrl})` },
    { label: "HTML", code: `<img src="${fullUrl}" alt="GitHub Star History Chart" />` },
    {
      label: "Themed HTML",
      code: `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="${darkUrl}" />
  <source media="(prefers-color-scheme: light)" srcset="${lightUrl}" />
  <img alt="GitHub Star History Chart" src="${lightUrl}" />
</picture>`,
    },
    { label: "Direct URL", code: fullUrl },
  ];

  return (
    <div className="aspect-video space-y-4 overflow-y-auto p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          Paste a snippet into a README or webpage — the chart refreshes itself daily.
        </p>
        <SvgActions embedUrl={embedUrl} origin={origin} fetchSvg={fetchSvg} />
      </div>
      {snippets.map((snippet) => (
        <Snippet key={snippet.label} {...snippet} />
      ))}
    </div>
  );
}

function Snippet({ label, code }: { label: string; code: string }) {
  const clipboard = useClipboard({ timeout: 1500 });

  const copy = () => {
    clipboard.copy(code);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <div className="bg-muted/40 flex items-center gap-2 rounded-md border p-3">
        <code className="text-foreground/90 min-w-0 flex-1 truncate font-mono text-xs">
          {code}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer transition-colors"
        >
          {clipboard.copied ? (
            <CheckIcon className="size-3.5" />
          ) : (
            <CopyIcon className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

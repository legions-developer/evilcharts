"use client";

import { useState } from "react";
import { useClipboard } from "@mantine/hooks";
import { CopyIcon, DownloadIcon, LinkIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface ActionsBarProps {
  /** Relative /api/star-history embed URL (GitHub-canvas background). */
  embedUrl: string;
  /** Absolute origin, resolved client-side; empty before mount. */
  origin: string;
  /** Fetches the exported SVG markup — a shared, cached query. */
  fetchSvg: () => Promise<string>;
  hasRepos: boolean;
}

export function ActionsBar({ embedUrl, origin, fetchSvg, hasRepos }: ActionsBarProps) {
  const clipboard = useClipboard({ timeout: 1500 });
  const [busy, setBusy] = useState<"copy" | "download" | null>(null);

  const copyEmbedUrl = () => {
    clipboard.copy(`${origin}${embedUrl}`);
    toast.success("Embed URL copied to clipboard");
  };

  // Copy / download both need the exported SVG bytes — fetch, then act.
  const withSvg = async (action: "copy" | "download", run: (svg: string) => void) => {
    setBusy(action);
    try {
      run(await fetchSvg());
    } catch {
      toast.error("Couldn't fetch the SVG — try again");
    } finally {
      setBusy(null);
    }
  };

  const copySvg = () =>
    withSvg("copy", (svg) => {
      clipboard.copy(svg);
      toast.success("SVG markup copied to clipboard");
    });

  const downloadSvg = () =>
    withSvg("download", (svg) => {
      const href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      const link = document.createElement("a");
      link.href = href;
      link.download = "star-history.svg";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
      toast.success("SVG downloaded");
    });

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!hasRepos}
        onClick={copyEmbedUrl}
      >
        <LinkIcon /> Copy embed URL
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!hasRepos || busy !== null}
        onClick={copySvg}
      >
        {busy === "copy" ? <Loader2Icon className="animate-spin" /> : <CopyIcon />} Copy SVG
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!hasRepos || busy !== null}
        onClick={downloadSvg}
      >
        {busy === "download" ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <DownloadIcon />
        )}{" "}
        Download SVG
      </Button>
    </div>
  );
}

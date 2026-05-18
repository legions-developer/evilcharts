"use client";

import { useClipboard } from "@mantine/hooks";
import { CopyIcon, DownloadIcon, LinkIcon } from "lucide-react";
import { CaretDown } from "@carbon/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SvgActionsProps {
  /** Relative /api/star-history embed URL (GitHub-canvas background). */
  embedUrl: string;
  /** Absolute origin, resolved client-side; empty before mount. */
  origin: string;
  /** Fetches the exported SVG markup — a shared, cached query. */
  fetchSvg: () => Promise<string>;
}

/**
 * Dropdown of export actions — copy the embed URL, copy the SVG markup, or
 * download the SVG file. Styled to match the date-range split button.
 */
export function SvgActions({ embedUrl, origin, fetchSvg }: SvgActionsProps) {
  const clipboard = useClipboard({ timeout: 1500 });

  const copyEmbedUrl = () => {
    clipboard.copy(`${origin}${embedUrl}`);
    toast.success("Embed URL copied to clipboard");
  };

  // Copy / download both need the exported SVG bytes — fetch, then act.
  const withSvg = async (run: (svg: string) => void) => {
    try {
      run(await fetchSvg());
    } catch {
      toast.error("Couldn't fetch the SVG — try again");
    }
  };

  const copySvg = () =>
    withSvg((svg) => {
      clipboard.copy(svg);
      toast.success("SVG markup copied to clipboard");
    });

  const downloadSvg = () =>
    withSvg((svg) => {
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

  const itemClass =
    "hover:bg-muted/50! text-muted-foreground/80 hover:text-primary! cursor-pointer text-[13px]";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="bg-background hover:bg-background text-muted-foreground hover:text-primary hover:border-primary/20 border px-2.5! duration-0"
        >
          SVG actions
          <CaretDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background rounded-lg">
        <DropdownMenuItem className={itemClass} onClick={copyEmbedUrl}>
          <LinkIcon />
          Copy embed URL
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClass} onClick={copySvg}>
          <CopyIcon />
          Copy SVG
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClass} onClick={downloadSvg}>
          <DownloadIcon />
          Download SVG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

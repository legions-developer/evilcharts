"use client";

import { PackageIcon, RotateCwIcon } from "lucide-react";
import { useState } from "react";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import type { ThemeName } from "@/lib/chart-svg/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { EmbedSnippets } from "./embed-snippets";
import { PREVIEW_SURFACE } from "../_lib/url";

interface PreviewPanelProps {
  /** Preview SVG markup, or undefined before the first load. */
  svg: string | undefined;
  isFetching: boolean;
  isError: boolean;
  hasPackages: boolean;
  /** Chart theme — drives the surface the preview sits on. */
  theme: ThemeName;
  /** Card title — always "npm Download Trends". */
  title: string;
  embedUrl: string;
  origin: string;
  /** Fetches the exported SVG markup — used by the embed tab's actions. */
  fetchSvg: () => Promise<string>;
}

/** The big preview card — mirrors the docs chart-preview styling 1:1. */
export function PreviewPanel({
  svg,
  isFetching,
  isError,
  hasPackages,
  theme,
  title,
  embedUrl,
  origin,
  fetchSvg,
}: PreviewPanelProps) {
  // Bumping this remounts the SVG, replaying its SMIL draw-on animation.
  const [replayKey, setReplayKey] = useState(0);

  return (
    <div className="group relative w-full">
      <Tabs defaultValue="preview" className="w-full">
        <div className="dark:bg-primary-foreground rounded-[8px] bg-[#F5F5F5] p-1">
          <div className="flex items-center justify-between gap-2 px-2">
            <span className="text-muted-foreground dark:text-muted-foreground/80 flex min-w-0 items-center gap-1.5 font-mono text-xs">
              <PackageIcon className="size-3.5 shrink-0" />
              <span className="truncate">{title}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReplayKey((key) => key + 1)}
                aria-label="Replay animation"
                className="text-muted-foreground hover:text-foreground flex size-4 shrink-0 translate-x-1 cursor-pointer items-center justify-center opacity-0 transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100"
              >
                <RotateCwIcon
                  className="size-3.5 transition-transform duration-500 ease-out"
                  style={{ transform: `rotate(${replayKey * 360}deg)` }}
                />
              </button>
              <TabsList variant="underline">
                <TabsTab className="h-5! px-1.5 hover:bg-transparent!" value="embed">
                  Embed
                </TabsTab>
                <TabsTab className="h-5! px-1.5 hover:bg-transparent!" value="preview">
                  Preview
                </TabsTab>
              </TabsList>
            </div>
          </div>

          <div className="bg-background overflow-hidden rounded-[5px] border">
            <TabsPanel value="preview">
              <div
                className="bg-background flex aspect-video items-center justify-center overflow-hidden"
                // The chart-theme surface only applies once a chart is actually
                // rendered; idle/loading/error states blend into the site so a
                // light-themed export doesn't flash a white card in dark mode.
                style={
                  svg && hasPackages && !isError
                    ? { background: PREVIEW_SURFACE[theme] }
                    : undefined
                }
              >
                {!hasPackages ? (
                  <p className="text-muted-foreground text-xs">
                    Add a package below to preview its download trend.
                  </p>
                ) : isError ? (
                  <p className="text-destructive text-xs">
                    Couldn&apos;t reach the server — try again.
                  </p>
                ) : !svg ? (
                  <Skeleton className="h-[260px] w-full max-w-[760px] sm:h-[380px]" />
                ) : (
                  <div
                    key={replayKey}
                    className={cn(
                      "flex h-full w-full items-center justify-center transition-opacity",
                      "[&>svg]:mx-auto [&>svg]:h-auto [&>svg]:max-h-full [&>svg]:w-full",
                      isFetching && "opacity-60",
                    )}
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                )}
              </div>
            </TabsPanel>

            <TabsPanel value="embed">
              <EmbedSnippets
                embedUrl={embedUrl}
                origin={origin}
                fetchSvg={fetchSvg}
                hasPackages={hasPackages}
              />
            </TabsPanel>
          </div>
        </div>
      </Tabs>
    </div>
  );
}

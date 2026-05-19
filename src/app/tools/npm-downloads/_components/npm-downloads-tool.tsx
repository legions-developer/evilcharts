"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useDebouncedValue } from "@mantine/hooks";
import {
  QueryClient,
  QueryClientProvider,
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { DateRangePicker } from "@/components/ui/date-range-picker";

import { createDefaultConfig, type NpmDownloadsConfig } from "../_lib/state";
import { buildChartUrl } from "../_lib/url";
import { ConfigPanel } from "./config-panel";
import { PreviewPanel } from "./preview-panel";

/** Fetch SVG markup, throwing on a non-OK response. */
async function fetchSvg(url: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.text();
}

// Client-only origin — "" on the server, the real origin once hydrated.
const subscribeOrigin = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";

function NpmDownloadsToolInner() {
  const [config, setConfig] = useState<NpmDownloadsConfig>(createDefaultConfig);
  const origin = useSyncExternalStore(subscribeOrigin, getOrigin, getServerOrigin);

  // The site theme drives the chart theme: every toggle of the header
  // light/dark switch forces it. The Theme select below can still override
  // for the current theme, but never feeds back to the site. Synced during
  // render (not in an effect) so a theme flip applies before paint.
  const { resolvedTheme } = useTheme();
  const [syncedSiteTheme, setSyncedSiteTheme] = useState<string | undefined>(undefined);
  if (resolvedTheme && resolvedTheme !== syncedSiteTheme) {
    setSyncedSiteTheme(resolvedTheme);
    setConfig((prev) => ({ ...prev, theme: resolvedTheme === "dark" ? "dark" : "light" }));
  }

  const queryClient = useQueryClient();

  const activePackages = config.packages.filter((p) => p.value.trim());
  const hasPackages = activePackages.length > 0;
  // Static card title — the package value is shown in the inputs, not the header.
  const title = "Npm Download Trends";

  // The chart SVG is transparent — preview and embed fetch the same URL.
  const chartUrl = hasPackages ? buildChartUrl(config) : "";

  // Debounce so typing / dragging a color doesn't spam the API.
  const [debouncedPreviewUrl] = useDebouncedValue(chartUrl, 400);

  // React Query is the single source for the preview SVG — cached per config,
  // with no-flicker updates while a new request is in flight.
  const svgQuery = useQuery({
    queryKey: ["npm-downloads-preview", debouncedPreviewUrl],
    queryFn: ({ signal }) => fetchSvg(debouncedPreviewUrl, signal),
    enabled: debouncedPreviewUrl.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  // Copy/download read the exported SVG — fetched once, cached.
  const fetchExportSvg = useCallback(
    () =>
      queryClient.fetchQuery({
        queryKey: ["npm-downloads-export", chartUrl],
        queryFn: () => fetchSvg(chartUrl),
        staleTime: 5 * 60 * 1000,
      }),
    [queryClient, chartUrl],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight xl:text-4xl">
            Npm Download Trends
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm">
            Generate an animated SVG of an npm package&apos;s download history. Compare
            packages, switch metrics, tweak the style, then copy or embed it anywhere.
          </p>
        </div>
        <DateRangePicker
          value={config.range}
          onChange={(range) => setConfig({ ...config, range })}
        />
      </div>

      <PreviewPanel
        svg={svgQuery.data}
        isFetching={svgQuery.isFetching}
        isError={svgQuery.isError}
        hasPackages={hasPackages}
        theme={config.theme}
        title={title}
        embedUrl={chartUrl}
        origin={origin}
        fetchSvg={fetchExportSvg}
      />

      <ConfigPanel config={config} onChange={setConfig} />
    </div>
  );
}

export function NpmDownloadsTool() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NpmDownloadsToolInner />
    </QueryClientProvider>
  );
}

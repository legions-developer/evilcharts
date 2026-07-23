"use client";

import {
  getStartedOptions,
  getChartComponentOptions,
  DocumentationOptions,
} from "@/globals/constants/docs-sidebar";
import { rememberProvider, useLastProvider } from "@/globals/functions/useLastProvider";
import { DEFAULT_PROVIDER, providerFromPathname } from "@/globals/constants/providers";
import type { Root as PageTreeRoot } from "fumadocs-core/page-tree";
import { RenderDefaultOptions } from "./render-default-options";
import { ProviderSwitcher } from "./provider-switcher";
import { flattenTree } from "fumadocs-core/page-tree";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { NavMain } from "./nav-main";

/**
 * The provider-aware half of the sidebar. Split out from DocsSidebar because the
 * active provider comes from the pathname, which is client-only — while the page
 * tree must be read on the server. The tree arrives here as a plain prop.
 */
export function SidebarSections({ tree }: { tree: PageTreeRoot }) {
  const pathname = usePathname();
  const pathProvider = providerFromPathname(pathname);

  // Shared pages (/docs, /docs/chart-config) belong to no provider. Instead of
  // snapping back to the default, stay on the engine the reader was last in —
  // tracked in an external store (see useLastProvider) that survives navigation
  // and hard reloads.
  const lastProvider = useLastProvider();

  useEffect(() => {
    if (pathProvider) rememberProvider(pathProvider);
  }, [pathProvider]);

  const provider = pathProvider ?? lastProvider ?? DEFAULT_PROVIDER;

  // The groups below are hand-written lists, not derived from content, so they'd
  // happily link to pages a provider doesn't have yet. Checking each URL against the
  // tree keeps a half-built provider from showing links that 404.
  const existingUrls = useMemo(
    () => new Set(flattenTree(tree.children).map((item) => item.url)),
    [tree.children],
  );

  return (
    <>
      <div className="px-2 group-data-[collapsible=icon]:hidden">
        <ProviderSwitcher
          existingUrls={existingUrls}
          activeProvider={provider}
          onProviderChange={rememberProvider}
        />
      </div>
      <RenderDefaultOptions
        options={getStartedOptions(provider)}
        label="Get Started"
        existingUrls={existingUrls}
      />
      <NavMain tree={tree} provider={provider} />
      <RenderDefaultOptions
        options={getChartComponentOptions(provider)}
        label="Chart Components"
        existingUrls={existingUrls}
      />
      <RenderDefaultOptions
        options={DocumentationOptions}
        label="Documentation"
        existingUrls={existingUrls}
      />
    </>
  );
}

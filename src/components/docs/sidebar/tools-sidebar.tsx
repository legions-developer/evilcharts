import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar";
import { ToolsOptions } from "@/globals/constants/docs-sidebar";
import EvilChartWordmark from "@/assets/logos/evilchart";
import { cn } from "@/lib/utils";
import Link from "next/link";
import * as React from "react";

import { RenderDefaultOptions } from "./render-default-options";

/**
 * Sidebar for the /tools route tree. Shares the docs sidebar chrome but lists
 * only the Tools section — no chart-component nav. The wordmark links back to
 * the docs, since /tools has no docs navigation of its own.
 */
export function ToolsSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4 pt-6">
        <Link href="/docs" aria-label="Evil Charts — back to docs" className="z-10 w-fit">
          <EvilChartWordmark height="20" width="130" />
        </Link>
      </SidebarHeader>
      <SidebarContent className={cn("docs-sidebar-top-fade select-none", "pt-2 pb-14")}>
        <RenderDefaultOptions options={ToolsOptions} label="Tools" />
      </SidebarContent>
    </Sidebar>
  );
}

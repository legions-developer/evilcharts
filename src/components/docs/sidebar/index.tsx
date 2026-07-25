import {
  Sidebar,
  SidebarContent,
  // SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SidebarSections } from "./sidebar-sections";
import EvilChartWordmark from "@/assets/logos/evilchart";
import { source } from "@/lib/source";
import { cn } from "@/lib/utils";
import Link from "next/link";
import * as React from "react";

// DocsSidebar must stay a server component — `source` transitively imports
// fs/promises; referencing it from a "use client" module breaks the browser
// bundle. The page tree crosses into SidebarSections as a serializable prop.
export function DocsSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="px-4 pt-6 pb-3">
        <Link
          href="/docs"
          aria-label="EvilCharts docs home"
          className="w-fit rounded-sm outline-none transition-opacity hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <EvilChartWordmark height="20" width="130" className="z-10" />
        </Link>
      </SidebarHeader>
      <SidebarContent className={cn("scroll-fade select-none", "pt-2 pb-14")}>
        <SidebarSections tree={source.pageTree} />
      </SidebarContent>
    </Sidebar>
  );
}

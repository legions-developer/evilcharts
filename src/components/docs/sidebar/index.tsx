import {
  Sidebar,
  SidebarContent,
  // SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import EvilChartWordmark from "@/assets/logos/evilchart";
import { SidebarSections } from "./sidebar-sections";
import { source } from "@/lib/source";
import { cn } from "@/lib/utils";
import * as React from "react";

// Stays a server component on purpose. `source` reaches into fumadocs' server code,
// which imports fs/promises — referencing it as a value from a "use client" module
// drags all of that into the browser bundle and the build fails to resolve fs.
// The page tree crosses the boundary as a serializable prop instead.
export function DocsSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4 pt-6">
        <EvilChartWordmark height="20" width="130" className="z-10" />
      </SidebarHeader>
      {/* scroll-fade-t masks the top edge only once you actually scroll, so the
          provider switcher sits crisp at rest. The old static overlay painted a
          sidebar-colored gradient at a fixed offset and covered it. */}
      <SidebarContent className={cn("scroll-fade-t select-none", "pt-2 pb-14")}>
        <SidebarSections tree={source.pageTree} />
      </SidebarContent>
    </Sidebar>
  );
}

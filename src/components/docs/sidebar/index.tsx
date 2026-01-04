import {
  Sidebar,
  SidebarContent,
  // SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import EvilChartWordmark from "@/assets/logos/evilchart";
import { GetStarted } from "./get-started";
import { source } from "@/lib/source";
import { NavMain } from "./nav-main";
import * as React from "react";

export function DocsSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4 pt-6">
        <EvilChartWordmark height="16" width="130" className="z-10" />
      </SidebarHeader>
      <SidebarContent>
        <GetStarted />
        <NavMain tree={source.pageTree} />
      </SidebarContent>
    </Sidebar>
  );
}

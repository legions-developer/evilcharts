import {
  Sidebar,
  SidebarContent,
  // SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { getStartedOptions, ChartComponentOptions } from "@/globals/constants/docs-sidebar";
import { RenderDefaultOptions } from "./render-default-options";
import EvilChartWordmark from "@/assets/logos/evilchart";
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
        <RenderDefaultOptions options={getStartedOptions} label="Get Started" />
        <NavMain tree={source.pageTree} />
        <RenderDefaultOptions options={ChartComponentOptions} label="Chart Components" />
      </SidebarContent>
    </Sidebar>
  );
}

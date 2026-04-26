import {
  getStartedOptions,
  ChartComponentOptions,
  DocumentationOptions,
} from "@/globals/constants/docs-sidebar";
import {
  Sidebar,
  SidebarContent,
  // SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { RenderDefaultOptions } from "./render-default-options";
import EvilChartWordmark from "@/assets/logos/evilchart";
import { source } from "@/lib/source";
import { NavMain } from "./nav-main";
import { cn } from "@/lib/utils";
import * as React from "react";

export function DocsSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4 pt-6">
        <EvilChartWordmark height="20" width="130" className="z-10" />
      </SidebarHeader>
      <SidebarContent className={cn("docs-sidebar-top-fade", "pt-2 pb-14")}>
        <RenderDefaultOptions options={getStartedOptions} label="Get Started" />
        <NavMain tree={source.pageTree} />
        <RenderDefaultOptions options={ChartComponentOptions} label="Chart Components" />
        <RenderDefaultOptions options={DocumentationOptions} label="Documentation" />
      </SidebarContent>
    </Sidebar>
  );
}

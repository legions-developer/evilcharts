"use client";

import * as React from "react";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { getIconForLanguageExtension } from "@/assets/language/icons";
import { cn } from "@/lib/utils";

export function ComponentPreviewTabs({
  className,
  align = "center",
  hideCode = false,
  component,
  source,
  title,
  ...props
}: React.ComponentProps<"div"> & {
  align?: "center" | "start" | "end";
  hideCode?: boolean;
  component: React.ReactNode;
  source: React.ReactNode;
  title?: string;
}) {
  return (
    <div className={cn("group relative mt-4 mb-12", className)} {...props}>
      <Tabs defaultValue="preview" className="relative w-full">
        <div className="dark:bg-primary-foreground bg-muted-foreground/5 flex flex-col rounded-[8px] p-1">
          <div className="flex flex-row items-center justify-between px-2">
            <span className="text-muted-foreground/80 flex items-center gap-1.5 font-mono text-xs [&_svg]:size-3.5">
              {getIconForLanguageExtension("component")} {title}
            </span>
            {!hideCode && (
              <TabsList variant="underline">
                <TabsTab className="h-5! px-1.5 hover:bg-transparent!" value="code">
                  Code
                </TabsTab>
                <TabsTab className="h-5! px-1.5 hover:bg-transparent!" value="preview">
                  Preview
                </TabsTab>
              </TabsList>
            )}
          </div>

          <div className="bg-background overflow-hidden rounded-[5px] border">
            <TabsPanel value="preview">
              <div
                className={cn(
                  "flex h-64 w-full justify-center overflow-y-auto data-[align=center]:items-center data-[align=end]:items-end data-[align=start]:items-start sm:h-90",
                )}
                data-align={align}
              >
                <div className="no-scrollbar h-full w-full [&>svg]:select-none" data-slot="preview">
                  {component}
                </div>
              </div>
            </TabsPanel>

            <TabsPanel value="code">
              <div className="flex h-64 w-full flex-col overflow-hidden sm:h-90">
                <div className="no-scrollbar relative size-full overflow-y-auto">{source}</div>
              </div>
            </TabsPanel>
          </div>
        </div>
      </Tabs>
    </div>
  );
}

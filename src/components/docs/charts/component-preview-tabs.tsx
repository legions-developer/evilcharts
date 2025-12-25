"use client";

import * as React from "react";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
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
        <div className="dark:bg-primary-foreground bg-muted-foreground/10 flex flex-col rounded-[8px] p-1">
          <div className="flex flex-row items-center justify-between px-2">
            <span className="text-primary/50 text-[13px] font-medium">{title}</span>
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
                  "flex h-90 w-full justify-center overflow-y-auto data-[align=center]:items-center data-[align=end]:items-end data-[align=start]:items-start",
                )}
                data-align={align}
              >
                <div className="no-scrollbar h-full w-full" data-slot="preview">
                  {component}
                </div>
              </div>
            </TabsPanel>

            <TabsPanel value="code">
              <div className="flex h-90 w-full flex-col overflow-hidden">
                <div className="no-scrollbar relative size-full overflow-y-auto">{source}</div>
              </div>
            </TabsPanel>
          </div>
        </div>
      </Tabs>
    </div>
  );
}

"use client";

import * as React from "react";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { getIconForLanguageExtension } from "@/assets/language/icons";
import { LazyMount } from "@/components/docs/charts/lazy-mount";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { cn } from "@/lib/utils";

export function ComponentPreviewTabs({
  className,
  containerClassName,
  align = "center",
  hideCode = false,
  component,
  source,
  title,
  ...props
}: React.ComponentProps<"div"> & {
  containerClassName?: string;
  align?: "center" | "start" | "end";
  hideCode?: boolean;
  component: React.ReactNode;
  source: React.ReactNode;
  title?: string;
}) {
  const isMobile = useBreakpoint(768);
  const displayTitle = title?.includes("=") && isMobile ? title.split("=")[0] : title;

  return (
    <div className={cn("group relative mt-4 mb-12", className)} {...props}>
      <Tabs defaultValue="preview" className="relative w-full">
        <div
          className={cn(
            "dark:bg-primary-foreground flex flex-col rounded-[8px] bg-[#F5F5F5] p-1",
            containerClassName,
          )}
        >
          <div className="flex flex-row items-center justify-between px-2">
            <span className="text-muted-foreground dark:text-muted-foreground/80 flex items-center gap-1.5 font-mono text-xs [&_svg]:size-3.5">
              {getIconForLanguageExtension("component")}{" "}
              <span className="line-clamp-1">{displayTitle}</span>
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
                  <LazyMount
                    fallback={<div className="flex size-full items-center justify-center" />}
                  >
                    {component}
                  </LazyMount>
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

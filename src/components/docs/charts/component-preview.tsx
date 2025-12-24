"use client";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { CheckIcon, CopyIcon } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@mantine/hooks";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ComponentPreviewAndCodeProps {
  title: string;
  children: React.ReactNode;
}

function ComponentPreviewAndCode({ title, children }: ComponentPreviewAndCodeProps) {
  return (
    <Tabs defaultValue="preview">
      <div className="dark:bg-primary-foreground bg-muted-foreground/10 group mt-6 flex flex-col rounded-[8px] p-1">
        <div className="flex flex-row items-center justify-between px-2">
          <span className="text-primary text-[13px] font-medium">{title}</span>
          <TabsList variant="underline">
            <TabsTab className="h-5! px-1.5 hover:bg-transparent!" value="code">
              Code
            </TabsTab>
            <TabsTab className="h-5! px-1.5 hover:bg-transparent!" value="preview">
              Preview
            </TabsTab>
          </TabsList>
        </div>
        <div className="bg-background overflow-hidden rounded-[5px] border">{children}</div>
      </div>
    </Tabs>
  );
}

function ComponentPreview({ children }: { children: React.ReactNode }) {
  return (
    <TabsPanel value="preview">
      <div className="relative h-96 p-4">{children}</div>
    </TabsPanel>
  );
}

function ComponentCode({ children }: { children: React.ReactNode }) {
  const { copied, copy } = useClipboard({ timeout: 1000 });
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TabsPanel value="code">
      <div className={cn("no-scrollbar relative overflow-y-auto", isOpen ? "max-h-full" : "max-h-96")}>
        <div className="sticky top-2 right-0 z-10">
          <Button className="h-6 w-6 rounded" variant="ghost" size="icon" onClick={() => copy(children)}>
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </div>
        <>{children}</>
        {!isOpen && (
          <div className="to-background via-background/80 sticky right-0 bottom-0 left-0 z-20 flex h-20 w-full items-end justify-center bg-linear-to-b from-transparent p-2">
            <Button className="hover:dark:bg-[#1F1F1F]" variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? "Collapse" : "Expand"}
            </Button>
          </div>
        )}
      </div>
    </TabsPanel>
  );
}

export { ComponentPreviewAndCode, ComponentPreview, ComponentCode };

"use client";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { CheckIcon, CopyIcon } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@mantine/hooks";
import { useState } from "react";

type PackageManager = "npm" | "yarn" | "bun" | "pnpm";

interface CliBlockProps {
  name: string;
}

const packageCommands: Record<PackageManager, string> = {
  npm: "npx shadcn@latest add",
  yarn: "yarn shadcn@latest add",
  bun: "bunx --bun shadcn@latest add",
  pnpm: "pnpm dlx shadcn@latest add",
};

function CliBlock({ name }: CliBlockProps) {
  const { copied, copy } = useClipboard({ timeout: 1000 });
  const [activeTab, setActiveTab] = useState<PackageManager>("npm");
  return (
    <Tabs defaultValue="npm" onValueChange={(value) => setActiveTab(value as PackageManager)}>
      <div className="dark:bg-primary-foreground bg-muted-foreground/10 group mt-6 flex flex-col rounded-[8px] p-1">
        <div className="flex flex-row items-center justify-between pr-1 pl-1.5">
          <TabsList variant="underline">
            <TabsTab className="h-5! px-1.5 hover:bg-transparent!" value="npm">
              npm
            </TabsTab>
            <TabsTab className="h-5! px-1.5 hover:bg-transparent!" value="yarn">
              yarn
            </TabsTab>
            <TabsTab className="h-5! px-1.5 hover:bg-transparent!" value="bun">
              bun
            </TabsTab>
            <TabsTab className="h-5! px-1.5 hover:bg-transparent!" value="pnpm">
              pnpm
            </TabsTab>
          </TabsList>
          <Button
            className="h-6 w-6 rounded"
            variant="ghost"
            size="icon"
            onClick={() => copy(packageCommands[activeTab] + " " + name)}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </div>
        <div className="bg-background text-muted-foreground rounded-[5px] border p-3 text-[13px]">
          {Object.keys(packageCommands).map((manager) => (
            <TabsPanel key={manager} value={manager}>
              {packageCommands[activeTab]} {name}
            </TabsPanel>
          ))}
        </div>
      </div>
    </Tabs>
  );
}

export { CliBlock };

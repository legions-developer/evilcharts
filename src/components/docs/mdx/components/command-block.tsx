"use client";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { BunIcon, NpmIcon, PnpmIcon, YarnIcon } from "@/assets/icons";
import { useConfig } from "@/hooks/use-config";
import CopyButton from "./copy-button";
import { cn } from "@/lib/utils";

type PackageManager = "npm" | "yarn" | "bun" | "pnpm";

interface CommandBlockProps {
  commands: string[];
}

const packageCommands: Record<PackageManager, string> = {
  npm: "npm install",
  yarn: "yarn add",
  bun: "bun add",
  pnpm: "pnpm add",
};

function CommandBlock({ commands }: CommandBlockProps) {
  const { packageManager, setConfig } = useConfig();

  return (
    <Tabs
      defaultValue="npm"
      value={packageManager}
      onValueChange={(value) => setConfig({ packageManager: value as PackageManager })}
    >
      <div className="dark:bg-primary-foreground group mt-2 flex flex-col rounded-[8px] bg-[#F5F5F5] p-1">
        <div className="flex flex-row items-center justify-between pr-1 pl-2">
          <TabsList
            variant="underline"
            indicatorClassName={cn(
              packageManager === "npm" && "bg-[#C3292F]!",
              packageManager === "yarn" && "bg-[#3592BD]!",
              packageManager === "bun" && "bg-primary!",
              packageManager === "pnpm" && "bg-[#FAAF18]!",
            )}
          >
            <TabsTab
              className="h-5! gap-2 px-1.5 hover:bg-transparent! data-active:text-[#C3292F]"
              value="npm"
            >
              <NpmIcon className="size-3" />
              npm
            </TabsTab>
            <TabsTab
              className="h-5! gap-2 px-1.5 hover:bg-transparent! data-active:text-[#3592BD]"
              value="yarn"
            >
              <YarnIcon className="size-3" />
              yarn
            </TabsTab>
            <TabsTab
              className="data-active:text-primary h-5! gap-2 px-1.5 hover:bg-transparent!"
              value="bun"
            >
              <BunIcon className="size-3" />
              bun
            </TabsTab>
            <TabsTab
              className="h-5! gap-2 px-1.5 hover:bg-transparent! data-active:text-[#FAAF18]"
              value="pnpm"
            >
              <PnpmIcon className="size-3" />
              pnpm
            </TabsTab>
          </TabsList>
          <CopyButton code={packageCommands[packageManager] + " " + commands.join(" ")} />
        </div>
        <div className="bg-background text-muted-foreground rounded-[5px] border p-3 text-[13px]">
          {Object.keys(packageCommands).map((manager) => (
            <TabsPanel className="font-mono" key={manager} value={manager}>
              {packageCommands[packageManager]} {commands.join(" ")}
            </TabsPanel>
          ))}
        </div>
      </div>
    </Tabs>
  );
}

export { CommandBlock };

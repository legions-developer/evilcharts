"use client";

import { Button } from "@/components/ui/button";
import CopyButton from "@/components/ui/code-block/copy-button";
import React from "react";
import { ChartCodeSheetClient } from "./chart-code-sheet-client";
import { cn } from "@/lib/utils";
import { usePackageManager } from "@/contexts/package-manager-context";
import { BundledLanguage } from "shiki";

interface PackageManagerSnippet {
  code: string;
  language: BundledLanguage;
  html: string;
}

interface PackageManagerSnippets {
  npm: PackageManagerSnippet;
  yarn: PackageManagerSnippet;
  pnpm: PackageManagerSnippet;
  bun: PackageManagerSnippet;
}

interface ChartDisplayClientProps {
  name: string;
  code: string;
  codeHtml: string;
  fileName: string;
  children: React.ReactNode;
  className?: string;
  shadcnSnippets: PackageManagerSnippets;
}

export const ChartDisplayClient = ({
  name,
  code,
  codeHtml,
  fileName,
  children,
  className,
  shadcnSnippets,
}: ChartDisplayClientProps) => {
  const { getCommand } = usePackageManager();

  return (
    <div
      className={cn(
        "bg-border/40 p-1 rounded-[14px] group dark:shadow-md",
        className
      )}
    >
      <div className="pb-1.5 py-1 pl-3 pr-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium leading-none">
            {name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton code={code} />
          <ChartCodeSheetClient code={code} codeHtml={codeHtml} shadcnSnippets={shadcnSnippets}>
            <Button variant="outline" className="text-[11px] h-6 px-2">
              {getCommand("shadcn@latest add")}
            </Button>
          </ChartCodeSheetClient>
        </div>
      </div>
      {children}
    </div>
  );
};

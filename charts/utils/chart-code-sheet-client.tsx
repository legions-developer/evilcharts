"use client";

import React from "react";
import {
  CodeBlockClient,
} from "@/components/ui/code-block/code-block";
import { PackageManagerSwitcher } from "@/components/ui/package-manager-switcher";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

interface ChartCodeSheetClientProps {
  code: string;
  codeHtml: string;
  children: React.ReactNode;
  shadcnSnippets: PackageManagerSnippets;
}

export function ChartCodeSheetClient({
  code,
  codeHtml,
  children,
  shadcnSnippets,
}: ChartCodeSheetClientProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="px-4">
        <SheetHeader className="p-0 pt-4 gap-0">
          <SheetTitle>Code</SheetTitle>
          <SheetDescription>
            You can copy the code to your clipboard.
          </SheetDescription>
        </SheetHeader>
        <PackageManagerSwitcher snippets={shadcnSnippets} heightAuto={true} />
        <CodeBlockClient
          code={code}
          html={codeHtml}
          language="tsx"
        />
      </SheetContent>
    </Sheet>
  );
}

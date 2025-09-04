"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CodeBlockClient } from "@/components/ui/code-block/code-block";
import { usePackageManager } from "@/contexts/package-manager-context";
import type { PreparedSnippets } from "@/types/docs/snippet-types";

interface PackageManagerSwitcherProps {
  snippets: PreparedSnippets;
  heightAuto?: boolean;
}

export const PackageManagerSwitcher: React.FC<PackageManagerSwitcherProps> = ({
  snippets,
  heightAuto = true,
}) => {
  const { packageManager, setPackageManager } = usePackageManager();
  
  return (
    <Tabs value={packageManager} onValueChange={(value) => setPackageManager(value as "npm" | "yarn" | "pnpm" | "bun")} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="npm">npm</TabsTrigger>
        <TabsTrigger value="yarn">yarn</TabsTrigger>
        <TabsTrigger value="pnpm">pnpm</TabsTrigger>
        <TabsTrigger value="bun">bun</TabsTrigger>
      </TabsList>
      
      <TabsContent value="npm">
        <CodeBlockClient
          html={snippets.npm.html}
          code={snippets.npm.code}
          language={snippets.npm.language}
          heightAuto={heightAuto}
        />
      </TabsContent>
      
      <TabsContent value="yarn">
        <CodeBlockClient
          html={snippets.yarn.html}
          code={snippets.yarn.code}
          language={snippets.yarn.language}
          heightAuto={heightAuto}
        />
      </TabsContent>
      
      <TabsContent value="pnpm">
        <CodeBlockClient
          html={snippets.pnpm.html}
          code={snippets.pnpm.code}
          language={snippets.pnpm.language}
          heightAuto={heightAuto}
        />
      </TabsContent>
      
      <TabsContent value="bun">
        <CodeBlockClient
          html={snippets.bun.html}
          code={snippets.bun.code}
          language={snippets.bun.language}
          heightAuto={heightAuto}
        />
      </TabsContent>
    </Tabs>
  );
};

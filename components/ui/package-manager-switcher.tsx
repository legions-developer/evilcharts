"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CodeBlockClient } from "@/components/ui/code-block/code-block";
import { usePackageManager, type PackageManager } from "@/contexts/package-manager-context";
import type { PreparedSnippets } from "@/types/docs/snippet-types";

// Define package managers as a constant array for consistency
const PACKAGE_MANAGERS = ["npm", "yarn", "pnpm", "bun"] as const;

interface PackageManagerSwitcherProps {
  snippets: PreparedSnippets;
  heightAuto?: boolean;
}

export const PackageManagerSwitcher: React.FC<PackageManagerSwitcherProps> = ({
  snippets,
  heightAuto = true,
}) => {
  const { packageManager, setPackageManager } = usePackageManager();
  
  const handleValueChange = (value: string) => {
    if (PACKAGE_MANAGERS.includes(value as PackageManager)) {
      setPackageManager(value as PackageManager);
    }
  };

  return (
    <Tabs 
      value={packageManager} 
      onValueChange={handleValueChange} 
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-4">
        {PACKAGE_MANAGERS.map((pm) => (
          <TabsTrigger key={pm} value={pm}>
            {pm}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {PACKAGE_MANAGERS.map((pm) => (
        <TabsContent key={pm} value={pm}>
          <CodeBlockClient
            html={snippets[pm].html}
            code={snippets[pm].code}
            language={snippets[pm].language}
            heightAuto={heightAuto}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};

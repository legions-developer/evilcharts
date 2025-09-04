"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type PackageManager = "npm" | "yarn" | "pnpm" | "bun";

interface PackageManagerContextType {
  packageManager: PackageManager;
  setPackageManager: (pm: PackageManager) => void;
  getCommand: (baseCommand: string) => string;
}

const PackageManagerContext = createContext<PackageManagerContextType | undefined>(undefined);

export const usePackageManager = () => {
  const context = useContext(PackageManagerContext);
  if (!context) {
    throw new Error("usePackageManager must be used within PackageManagerProvider");
  }
  return context;
};

export const PackageManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [packageManager, setPackageManagerState] = useState<PackageManager>("npm");

  useEffect(() => {
    const saved = localStorage.getItem("preferred-package-manager");
    if (saved && ["npm", "yarn", "pnpm", "bun"].includes(saved)) {
      setPackageManagerState(saved as PackageManager);
    }
  }, []);

  const setPackageManager = (pm: PackageManager) => {
    setPackageManagerState(pm);
    localStorage.setItem("preferred-package-manager", pm);
  };

  const getCommand = (baseCommand: string) => {
    const commands = {
      npm: `npx ${baseCommand}`,
      yarn: `yarn dlx ${baseCommand}`,
      pnpm: `pnpm dlx ${baseCommand}`,
      bun: `bunx ${baseCommand}`,
    };
    return commands[packageManager];
  };

  return (
    <PackageManagerContext.Provider value={{ packageManager, setPackageManager, getCommand }}>
      {children}
    </PackageManagerContext.Provider>
  );
};

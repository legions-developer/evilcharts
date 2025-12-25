import { persist } from "zustand/middleware";
import { create } from "zustand";

type Config = {
  packageManager: "npm" | "yarn" | "pnpm" | "bun";
  installationType: "cli" | "manual";
};

type ConfigStore = Config & {
  setConfig: (config: Partial<Config>) => void;
};

export const useConfig = create<ConfigStore>()(
  persist(
    (set) => ({
      installationType: "cli",
      packageManager: "npm",
      setConfig: (config) => set(config),
    }),
    {
      name: "config",
    },
  ),
);

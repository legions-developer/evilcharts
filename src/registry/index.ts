import type { Registry } from "shadcn/schema";

import { charts } from "@/registry/registry-chart";

export const registry = {
  homepage: "https://evilcharts.com",
  name: "EvilCharts",
  items: [...charts],
} satisfies Registry;

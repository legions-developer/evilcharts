import type { Registry } from "shadcn/schema";

import { charts } from "@/registry/registry-chart";
import { examples } from "./registry-example";

export const registry = {
  homepage: "https://evilcharts.com",
  name: "EvilCharts",
  items: [...charts, ...examples],
} satisfies Registry;

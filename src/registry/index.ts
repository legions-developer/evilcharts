import type { Registry } from "shadcn/schema";

import { examples } from "@/registry/registry-example";
import { charts } from "@/registry/registry-chart";
import { ui } from "@/registry/registry-ui";

export const registry = {
  homepage: "https://evilcharts.com",
  name: "EvilCharts",
  items: [...ui, ...charts, ...examples],
} satisfies Registry;

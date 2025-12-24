import type { Registry } from "shadcn/schema";

export const charts: Registry["items"] = [
  {
    name: "area-chart",
    description: "Area chart component",
    dependencies: ["recharts"],
    type: "registry:component",
    files: [
      {
        path: "charts/area-chart.tsx",
        type: "registry:component",
      },
    ],
  },
];

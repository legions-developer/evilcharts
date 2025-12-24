import type { Registry } from "shadcn/schema";

export const charts: Registry["items"] = [
  {
    name: "area-simple-chart",
    dependencies: ["recharts"],
    type: "registry:ui",
    files: [
      {
        path: "charts/area-simple-chart.tsx",
        type: "registry:ui",
      },
    ],
  },
];

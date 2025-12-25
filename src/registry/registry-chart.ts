import type { Registry } from "shadcn/schema";

const TARGET_BASE_PATH = "components/evilcharts/chart";

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
        target: TARGET_BASE_PATH + "/area-chart.tsx",
      },
    ],
  },
];

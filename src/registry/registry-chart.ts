import type { Registry } from "shadcn/schema";

const TARGET_BASE_PATH = "components/evilcharts/charts";

export const charts: Registry["items"] = [
  {
    name: "area-chart",
    description: "Area chart component",
    registryDependencies: ["@evilcharts/chart", "@evilcharts/tooltip", "@evilcharts/legend"],
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
  {
    name: "line-chart",
    description: "Line chart component",
    registryDependencies: ["@evilcharts/chart", "@evilcharts/tooltip", "@evilcharts/legend"],
    dependencies: ["recharts"],
    type: "registry:component",
    files: [
      {
        path: "charts/line-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/line-chart.tsx",
      },
    ],
  },
  {
    name: "bar-chart",
    description: "Bar chart component",
    registryDependencies: ["@evilcharts/chart", "@evilcharts/tooltip", "@evilcharts/legend"],
    dependencies: ["recharts"],
    type: "registry:component",
    files: [
      {
        path: "charts/bar-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/bar-chart.tsx",
      },
    ],
  },
];

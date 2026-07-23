import type { Registry } from "shadcn/schema";

const TARGET_BASE_PATH = "components/evilcharts/blocks";

export const blocks: Registry["items"] = [
  {
    name: "monospace-bar-chart",
    description: "Monospace bar chart component",
    dependencies: ["recharts", "motion"],
    registryDependencies: ["@evilcharts/recharts-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/recharts/b-monospace-bar-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/recharts/monospace-bar-chart.tsx",
      },
    ],
  },
  {
    name: "hover-trace-bar-chart",
    description: "Bar chart with active value line and animated marker",
    dependencies: ["recharts", "motion", "@number-flow/react"],
    registryDependencies: ["@evilcharts/recharts-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/recharts/b-hover-trace-bar-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/recharts/hover-trace-bar-chart.tsx",
      },
    ],
  },
  {
    name: "grid-bar-chart",
    description: "Bar chart where each bar is composed of stacked 10x10px squares",
    dependencies: ["recharts"],
    registryDependencies: ["@evilcharts/recharts-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/recharts/b-grid-bar-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/recharts/grid-bar-chart.tsx",
      },
    ],
  },
  {
    name: "isometric-bar-chart",
    description: "Bar chart with isometric 3D-extruded bars and a highlighted max value",
    dependencies: ["recharts", "motion"],
    registryDependencies: ["@evilcharts/recharts-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/recharts/b-isometric-bar-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/recharts/isometric-bar-chart.tsx",
      },
    ],
  },
  {
    name: "latency-echarts-area-chart",
    description: "Latency percentile monitor with an HTML stat row, on the ECharts area chart",
    dependencies: ["echarts", "motion"],
    registryDependencies: ["@evilcharts/echarts-area-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/echarts/b-latency-echarts-area-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/echarts/latency-echarts-area-chart.tsx",
      },
    ],
  },
];

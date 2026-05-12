import type { Registry } from "shadcn/schema";

const TARGET_BASE_PATH = "components/evilcharts/blocks";

export const blocks: Registry["items"] = [
  {
    name: "monospace-bar-chart",
    description: "Monospace bar chart component",
    dependencies: ["recharts", "motion"],
    registryDependencies: ["@evilcharts/chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/b-monospace-bar-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/monospace-bar-chart.tsx",
      },
    ],
  },
  {
    name: "hover-trace-bar-chart",
    description: "Bar chart with active value line and animated marker",
    dependencies: ["recharts", "motion", "@number-flow/react"],
    registryDependencies: ["@evilcharts/chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/b-hover-trace-bar-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/hover-trace-bar-chart.tsx",
      },
    ],
  },
  {
    name: "grid-bar-chart",
    description: "Bar chart where each bar is composed of stacked 10x10px squares",
    dependencies: ["recharts"],
    registryDependencies: ["@evilcharts/chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/b-grid-bar-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/grid-bar-chart.tsx",
      },
    ],
  },
  {
    name: "isometric-bar-chart",
    description: "Bar chart with isometric 3D-extruded bars and a highlighted max value",
    dependencies: ["recharts", "motion"],
    registryDependencies: ["@evilcharts/chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/b-isometric-bar-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/isometric-bar-chart.tsx",
      },
    ],
  },
];

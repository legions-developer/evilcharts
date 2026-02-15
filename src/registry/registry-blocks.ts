import type { Registry } from "shadcn/schema";

const TARGET_BASE_PATH = "components/evilcharts/blocks";

export const blocks: Registry["items"] = [
  {
    name: "monospace-bar-chart",
    description: "Monospace bar chart component",
    dependencies: ["recharts", "motion"],
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
    type: "registry:block",
    files: [
      {
        path: "blocks/b-hover-trace-bar-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/hover-trace-bar-chart.tsx",
      },
    ],
  },
];

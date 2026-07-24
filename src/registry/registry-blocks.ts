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
        target: TARGET_BASE_PATH + "/monospace-bar-chart.tsx",
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
        target: TARGET_BASE_PATH + "/hover-trace-bar-chart.tsx",
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
        target: TARGET_BASE_PATH + "/grid-bar-chart.tsx",
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
        target: TARGET_BASE_PATH + "/isometric-bar-chart.tsx",
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
        target: TARGET_BASE_PATH + "/latency-echarts-area-chart.tsx",
      },
    ],
  },
  {
    name: "portfolio-echarts-area-chart",
    description: "Portfolio comparison card with hover-reveal, on the ECharts area chart",
    dependencies: ["echarts", "motion"],
    registryDependencies: ["@evilcharts/echarts-area-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/echarts/b-portfolio-echarts-area-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/portfolio-echarts-area-chart.tsx",
      },
    ],
  },
  {
    name: "benchmark-echarts-area-chart",
    description: "Growth against a dashed benchmark — hatched lead area, rounded step plateaus",
    dependencies: ["echarts", "motion"],
    registryDependencies: ["@evilcharts/echarts-area-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/echarts/b-benchmark-echarts-area-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/benchmark-echarts-area-chart.tsx",
      },
    ],
  },
  {
    name: "audience-echarts-area-chart",
    description: "Audience growth card with a multi-stop gradient line and faded wash",
    dependencies: ["echarts", "motion"],
    registryDependencies: ["@evilcharts/echarts-area-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/echarts/b-audience-echarts-area-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/audience-echarts-area-chart.tsx",
      },
    ],
  },
  {
    name: "market-share-echarts-pie-chart",
    description: "Grayscale donut with a center total and a two-column value legend",
    dependencies: ["echarts", "motion"],
    registryDependencies: ["@evilcharts/echarts-pie-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/echarts/b-market-share-echarts-pie-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/market-share-echarts-pie-chart.tsx",
      },
    ],
  },
  {
    name: "progress-rings-echarts-pie-chart",
    description: "Dotted progress rings with a centered stat, built from per-dot pie sectors",
    dependencies: ["echarts", "motion"],
    registryDependencies: ["@evilcharts/echarts-pie-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/echarts/b-progress-rings-echarts-pie-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/progress-rings-echarts-pie-chart.tsx",
      },
    ],
  },
  {
    name: "budget-echarts-radial-chart",
    description: "Budget breakdown card with four gauges and a value list, on the radial chart",
    dependencies: ["echarts", "motion"],
    registryDependencies: ["@evilcharts/echarts-radial-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/echarts/b-budget-echarts-radial-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/budget-echarts-radial-chart.tsx",
      },
    ],
  },
  {
    name: "revenue-mix-echarts-pie-chart",
    description: "Gapped donut with a center total and a side legend of amounts",
    dependencies: ["echarts", "motion"],
    registryDependencies: ["@evilcharts/echarts-pie-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/echarts/b-revenue-mix-echarts-pie-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/revenue-mix-echarts-pie-chart.tsx",
      },
    ],
  },
  {
    name: "reliability-score-echarts-pie-chart",
    description: "Banded score arc with a range scale, built from pie sectors",
    dependencies: ["echarts", "motion"],
    registryDependencies: ["@evilcharts/echarts-pie-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/echarts/b-reliability-score-echarts-pie-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/reliability-score-echarts-pie-chart.tsx",
      },
    ],
  },
  {
    name: "payouts-echarts-line-chart",
    description: "Payout trend card with a glowing gradient line and stat rows",
    dependencies: ["echarts", "motion"],
    registryDependencies: ["@evilcharts/echarts-line-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/echarts/b-payouts-echarts-line-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/payouts-echarts-line-chart.tsx",
      },
    ],
  },
  {
    name: "shipments-echarts-line-chart",
    description: "Week-over-week comparison with a solid and a dashed grayscale line",
    dependencies: ["echarts", "motion"],
    registryDependencies: ["@evilcharts/echarts-line-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/echarts/b-shipments-echarts-line-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/shipments-echarts-line-chart.tsx",
      },
    ],
  },
  {
    name: "grid-echarts-bar-chart",
    description: "Bar chart whose columns are stacks of blocks, on the ECharts blocks variant",
    dependencies: ["echarts", "motion"],
    registryDependencies: ["@evilcharts/echarts-bar-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/echarts/b-grid-echarts-bar-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/grid-echarts-bar-chart.tsx",
      },
    ],
  },
  {
    name: "monospace-echarts-bar-chart",
    description:
      "Monospace sales card whose hairline bars expand on hover, on the ECharts bar chart",
    dependencies: ["echarts", "motion"],
    registryDependencies: ["@evilcharts/echarts-bar-chart"],
    type: "registry:block",
    files: [
      {
        path: "blocks/echarts/b-monospace-echarts-bar-chart.tsx",
        type: "registry:block",
        target: TARGET_BASE_PATH + "/monospace-echarts-bar-chart.tsx",
      },
    ],
  },
];

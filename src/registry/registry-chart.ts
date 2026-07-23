import type { Registry } from "shadcn/schema";

const TARGET_BASE_PATH = "components/evilcharts/charts";

export const charts: Registry["items"] = [
  {
    // ECharts twin of area-chart. Its shared UI (tooltip/legend/dot/brush + the
    // color core) lives in @evilcharts/echarts-* modules — never any recharts dep.
    name: "echarts-area-chart",
    description: "Area chart component rendered with Apache ECharts",
    registryDependencies: [
      "@evilcharts/echarts-chart",
      "@evilcharts/echarts-tooltip",
      "@evilcharts/echarts-legend",
      "@evilcharts/echarts-dot",
      "@evilcharts/echarts-brush",
    ],
    dependencies: ["echarts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/echarts/area-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/echarts/area-chart.tsx",
      },
    ],
  },
  {
    name: "echarts-line-chart",
    description: "Line chart component rendered with Apache ECharts",
    registryDependencies: [
      "@evilcharts/echarts-chart",
      "@evilcharts/echarts-dot",
      "@evilcharts/echarts-tooltip",
      "@evilcharts/echarts-legend",
      "@evilcharts/echarts-brush",
    ],
    dependencies: ["echarts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/echarts/line-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/echarts/line-chart.tsx",
      },
    ],
  },
  {
    name: "echarts-bar-chart",
    description: "Bar chart component rendered with Apache ECharts",
    registryDependencies: [
      "@evilcharts/echarts-chart",
      "@evilcharts/echarts-tooltip",
      "@evilcharts/echarts-dot",
      "@evilcharts/echarts-legend",
      "@evilcharts/echarts-brush",
    ],
    dependencies: ["echarts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/echarts/bar-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/echarts/bar-chart.tsx",
      },
    ],
  },
  {
    name: "echarts-composed-chart",
    description: "Composed chart component rendered with Apache ECharts",
    registryDependencies: [
      "@evilcharts/echarts-chart",
      "@evilcharts/echarts-tooltip",
      "@evilcharts/echarts-dot",
      "@evilcharts/echarts-legend",
      "@evilcharts/echarts-brush",
    ],
    dependencies: ["echarts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/echarts/composed-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/echarts/composed-chart.tsx",
      },
    ],
  },
  {
    name: "echarts-radar-chart",
    description: "Radar chart component rendered with Apache ECharts",
    registryDependencies: [
      "@evilcharts/echarts-chart",
      "@evilcharts/echarts-tooltip",
      "@evilcharts/echarts-dot",
      "@evilcharts/echarts-legend",
    ],
    dependencies: ["echarts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/echarts/radar-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/echarts/radar-chart.tsx",
      },
    ],
  },
  {
    name: "echarts-pie-chart",
    description: "Pie chart component rendered with Apache ECharts",
    registryDependencies: [
      "@evilcharts/echarts-chart",
      "@evilcharts/echarts-tooltip",
      "@evilcharts/echarts-legend",
    ],
    dependencies: ["echarts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/echarts/pie-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/echarts/pie-chart.tsx",
      },
    ],
  },
  {
    name: "echarts-radial-chart",
    description: "Radial chart component rendered with Apache ECharts",
    registryDependencies: [
      "@evilcharts/echarts-chart",
      "@evilcharts/echarts-tooltip",
      "@evilcharts/echarts-legend",
    ],
    dependencies: ["echarts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/echarts/radial-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/echarts/radial-chart.tsx",
      },
    ],
  },
  {
    name: "echarts-sankey-chart",
    description: "Sankey chart component rendered with Apache ECharts",
    registryDependencies: [
      "@evilcharts/echarts-chart",
      "@evilcharts/echarts-tooltip",
      "@evilcharts/echarts-dot",
    ],
    dependencies: ["echarts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/echarts/sankey-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/echarts/sankey-chart.tsx",
      },
    ],
  },
  {
    name: "recharts-area-chart",
    description: "Area chart component",
    registryDependencies: [
      "@evilcharts/recharts-chart",
      "@evilcharts/recharts-tooltip",
      "@evilcharts/recharts-legend",
      "@evilcharts/recharts-dot",
      "@evilcharts/recharts-brush",
      "@evilcharts/recharts-background",
    ],
    dependencies: ["recharts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/recharts/area-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/recharts/area-chart.tsx",
      },
    ],
  },
  {
    name: "recharts-line-chart",
    description: "Line chart component",
    registryDependencies: [
      "@evilcharts/recharts-chart",
      "@evilcharts/recharts-tooltip",
      "@evilcharts/recharts-legend",
      "@evilcharts/recharts-dot",
      "@evilcharts/recharts-brush",
      "@evilcharts/recharts-background",
    ],
    dependencies: ["recharts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/recharts/line-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/recharts/line-chart.tsx",
      },
    ],
  },
  {
    name: "recharts-bar-chart",
    description: "Bar chart component",
    registryDependencies: [
      "@evilcharts/recharts-chart",
      "@evilcharts/recharts-tooltip",
      "@evilcharts/recharts-legend",
      "@evilcharts/recharts-brush",
      "@evilcharts/recharts-background",
    ],
    dependencies: ["recharts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/recharts/bar-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/recharts/bar-chart.tsx",
      },
    ],
  },
  {
    name: "recharts-composed-chart",
    description: "Composed chart component combining bar and line charts",
    registryDependencies: [
      "@evilcharts/recharts-chart",
      "@evilcharts/recharts-tooltip",
      "@evilcharts/recharts-legend",
      "@evilcharts/recharts-dot",
      "@evilcharts/recharts-brush",
      "@evilcharts/recharts-background",
    ],
    dependencies: ["recharts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/recharts/composed-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/recharts/composed-chart.tsx",
      },
    ],
  },
  {
    name: "recharts-pie-chart",
    description: "Pie chart component with donut, gradient, and glow effects",
    registryDependencies: [
      "@evilcharts/recharts-chart",
      "@evilcharts/recharts-tooltip",
      "@evilcharts/recharts-legend",
      "@evilcharts/recharts-background",
    ],
    dependencies: ["recharts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/recharts/pie-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/recharts/pie-chart.tsx",
      },
    ],
  },
  {
    name: "recharts-radial-chart",
    description: "Radial bar chart component with full and semi-circle variants",
    registryDependencies: [
      "@evilcharts/recharts-chart",
      "@evilcharts/recharts-tooltip",
      "@evilcharts/recharts-legend",
      "@evilcharts/recharts-background",
    ],
    dependencies: ["recharts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/recharts/radial-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/recharts/radial-chart.tsx",
      },
    ],
  },
  {
    name: "recharts-radar-chart",
    description: "Radar chart component with filled and lines variants",
    registryDependencies: [
      "@evilcharts/recharts-chart",
      "@evilcharts/recharts-tooltip",
      "@evilcharts/recharts-legend",
      "@evilcharts/recharts-dot",
      "@evilcharts/recharts-background",
    ],
    dependencies: ["recharts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/recharts/radar-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/recharts/radar-chart.tsx",
      },
    ],
  },
  {
    name: "recharts-sankey-chart",
    description: "Sankey chart component for visualizing flow data with nodes and links",
    registryDependencies: [
      "@evilcharts/recharts-chart",
      "@evilcharts/recharts-tooltip",
      "@evilcharts/recharts-background",
    ],
    dependencies: ["recharts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/recharts/sankey-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/recharts/sankey-chart.tsx",
      },
    ],
  },
];

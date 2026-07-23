import type { Registry } from "shadcn/schema";

const TARGET_BASE_PATH = "components/evilcharts/charts";

export const charts: Registry["items"] = [
  {
    // ECharts twin of area-chart. Self-contained on purpose: no @evilcharts/*
    // registryDependencies, so installing it never drags in recharts.
    name: "echarts-area-chart",
    description: "Area chart component rendered with Apache ECharts",
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
    name: "area-chart",
    description: "Area chart component",
    registryDependencies: [
      "@evilcharts/chart",
      "@evilcharts/tooltip",
      "@evilcharts/legend",
      "@evilcharts/dot",
      "@evilcharts/evil-brush",
      "@evilcharts/background",
    ],
    dependencies: ["recharts", "motion"],
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
    registryDependencies: [
      "@evilcharts/chart",
      "@evilcharts/tooltip",
      "@evilcharts/legend",
      "@evilcharts/dot",
      "@evilcharts/evil-brush",
      "@evilcharts/background",
    ],
    dependencies: ["recharts", "motion"],
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
    registryDependencies: [
      "@evilcharts/chart",
      "@evilcharts/tooltip",
      "@evilcharts/legend",
      "@evilcharts/evil-brush",
      "@evilcharts/background",
    ],
    dependencies: ["recharts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/bar-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/bar-chart.tsx",
      },
    ],
  },
  {
    name: "composed-chart",
    description: "Composed chart component combining bar and line charts",
    registryDependencies: [
      "@evilcharts/chart",
      "@evilcharts/tooltip",
      "@evilcharts/legend",
      "@evilcharts/dot",
      "@evilcharts/evil-brush",
      "@evilcharts/background",
    ],
    dependencies: ["recharts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/composed-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/composed-chart.tsx",
      },
    ],
  },
  {
    name: "pie-chart",
    description: "Pie chart component with donut, gradient, and glow effects",
    registryDependencies: [
      "@evilcharts/chart",
      "@evilcharts/tooltip",
      "@evilcharts/legend",
      "@evilcharts/background",
    ],
    dependencies: ["recharts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/pie-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/pie-chart.tsx",
      },
    ],
  },
  {
    name: "radial-chart",
    description: "Radial bar chart component with full and semi-circle variants",
    registryDependencies: [
      "@evilcharts/chart",
      "@evilcharts/tooltip",
      "@evilcharts/legend",
      "@evilcharts/background",
    ],
    dependencies: ["recharts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/radial-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/radial-chart.tsx",
      },
    ],
  },
  {
    name: "radar-chart",
    description: "Radar chart component with filled and lines variants",
    registryDependencies: [
      "@evilcharts/chart",
      "@evilcharts/tooltip",
      "@evilcharts/legend",
      "@evilcharts/dot",
      "@evilcharts/background",
    ],
    dependencies: ["recharts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/radar-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/radar-chart.tsx",
      },
    ],
  },
  {
    name: "sankey-chart",
    description: "Sankey chart component for visualizing flow data with nodes and links",
    registryDependencies: ["@evilcharts/chart", "@evilcharts/tooltip", "@evilcharts/background"],
    dependencies: ["recharts", "motion"],
    type: "registry:component",
    files: [
      {
        path: "charts/sankey-chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/sankey-chart.tsx",
      },
    ],
  },
];

import type { Registry } from "shadcn/schema";

const TARGET_BASE_PATH = "components/evilcharts/charts";

export const charts: Registry["items"] = [
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

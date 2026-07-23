import type { Registry } from "shadcn/schema";

const TARGET_BASE_PATH = "components/evilcharts/ui";

export const ui: Registry["items"] = [
  {
    name: "recharts-chart",
    type: "registry:component",
    dependencies: ["recharts"],
    files: [
      {
        path: "ui/recharts/chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/recharts/chart.tsx",
      },
    ],
  },
  {
    name: "recharts-tooltip",
    type: "registry:component",
    dependencies: ["recharts"],
    files: [
      {
        path: "ui/recharts/tooltip.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/recharts/tooltip.tsx",
      },
    ],
  },
  {
    name: "recharts-legend",
    type: "registry:component",
    dependencies: ["recharts"],
    files: [
      {
        path: "ui/recharts/legend.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/recharts/legend.tsx",
      },
    ],
  },
  {
    name: "recharts-dot",
    type: "registry:component",
    dependencies: ["recharts"],
    files: [
      {
        path: "ui/recharts/dot.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/recharts/dot.tsx",
      },
    ],
  },
  {
    name: "recharts-brush",
    type: "registry:component",
    registryDependencies: ["@evilcharts/recharts-chart"],
    dependencies: ["recharts"],
    files: [
      {
        path: "ui/recharts/evil-brush.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/recharts/evil-brush.tsx",
      },
    ],
  },
  {
    name: "recharts-background",
    type: "registry:component",
    dependencies: ["recharts"],
    files: [
      {
        path: "ui/recharts/background.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/recharts/background.tsx",
      },
    ],
  },

  // ── ECharts shared UI — the canvas counterparts of the recharts primitives.
  // Each ECharts chart pulls the modules it uses; nothing here touches recharts.
  {
    name: "echarts-chart",
    type: "registry:component",
    dependencies: ["echarts"],
    files: [
      {
        path: "ui/echarts/chart.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/echarts/chart.tsx",
      },
    ],
  },
  {
    name: "echarts-tooltip",
    type: "registry:component",
    dependencies: ["echarts"],
    registryDependencies: ["@evilcharts/echarts-chart"],
    files: [
      {
        path: "ui/echarts/tooltip.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/echarts/tooltip.tsx",
      },
    ],
  },
  {
    name: "echarts-legend",
    type: "registry:component",
    registryDependencies: ["@evilcharts/echarts-chart"],
    files: [
      {
        path: "ui/echarts/legend.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/echarts/legend.tsx",
      },
    ],
  },
  {
    name: "echarts-dot",
    type: "registry:component",
    dependencies: ["echarts"],
    files: [
      {
        path: "ui/echarts/dot.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/echarts/dot.tsx",
      },
    ],
  },
  {
    name: "echarts-brush",
    type: "registry:component",
    dependencies: ["echarts"],
    registryDependencies: ["@evilcharts/echarts-chart"],
    files: [
      {
        path: "ui/echarts/evil-brush.tsx",
        type: "registry:component",
        target: TARGET_BASE_PATH + "/echarts/evil-brush.tsx",
      },
    ],
  },
];

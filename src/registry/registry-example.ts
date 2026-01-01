import type { Registry } from "shadcn/schema";

export const examples: Registry["items"] = [
  // Base Area Chart
  {
    name: "ex-area-chart",
    registryDependencies: ["@evilcharts/area-chart"],
    type: "registry:block",
    files: [
      {
        path: "examples/ex-area-chart.tsx",
        type: "registry:block",
      },
    ],
  },
  // Area Chart Types
  {
    name: "ex-default-type-area-chart",
    registryDependencies: ["@evilcharts/area-chart"],
    type: "registry:block",
    files: [
      {
        path: "examples/ex-default-type-area-chart.tsx",
        type: "registry:block",
      },
    ],
  },
  {
    name: "ex-stacked-type-area-chart",
    registryDependencies: ["@evilcharts/area-chart"],
    type: "registry:block",
    files: [
      {
        path: "examples/ex-stacked-type-area-chart.tsx",
        type: "registry:block",
      },
    ],
  },
  {
    name: "ex-expanded-type-area-chart",
    registryDependencies: ["@evilcharts/area-chart"],
    type: "registry:block",
    files: [
      {
        path: "examples/ex-expanded-type-area-chart.tsx",
        type: "registry:block",
      },
    ],
  },
  // Area Chart Stroke Variants
  {
    name: "ex-solid-stroke-area-chart",
    registryDependencies: ["@evilcharts/area-chart"],
    type: "registry:block",
    files: [
      {
        path: "examples/ex-solid-stroke-area-chart.tsx",
        type: "registry:block",
      },
    ],
  },
  {
    name: "ex-dashed-stroke-area-chart",
    registryDependencies: ["@evilcharts/area-chart"],
    type: "registry:block",
    files: [
      {
        path: "examples/ex-dashed-stroke-area-chart.tsx",
        type: "registry:block",
      },
    ],
  },
  {
    name: "ex-animated-dashed-stroke-area-chart",
    registryDependencies: ["@evilcharts/area-chart"],
    type: "registry:block",
    files: [
      {
        path: "examples/ex-animated-dashed-stroke-area-chart.tsx",
        type: "registry:block",
      },
    ],
  },
];

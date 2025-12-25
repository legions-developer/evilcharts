import type { Registry } from "shadcn/schema";

export const examples: Registry["items"] = [
  {
    name: "ex-area-simple-chart",
    registryDependencies: ["@evilcharts/area-chart"],
    type: "registry:block",
    files: [
      {
        path: "examples/ex-area-simple-chart.tsx",
        type: "registry:block",
      },
    ],
  },
];

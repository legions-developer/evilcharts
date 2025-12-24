import type { Registry } from "shadcn/schema";

export const examples: Registry["items"] = [
  {
    name: "ex-area-simple-chart",
    registryDependencies: ["area-chart"],
    type: "registry:block",
    files: [
      {
        path: "charts/ex-area-simple-chart.tsx",
        type: "registry:block",
      },
    ],
  },
];

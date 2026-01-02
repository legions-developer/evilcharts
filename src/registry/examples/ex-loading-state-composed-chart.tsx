"use client";

import { EvilComposedChart } from "@/registry/charts/composed-chart";
import { type ChartConfig } from "@/registry/ui/chart";

const data = [
  { month: "January", revenue: 4200, profit: 1800 },
  { month: "February", revenue: 5800, profit: 2400 },
  { month: "March", revenue: 4100, profit: 1600 },
  { month: "April", revenue: 6200, profit: 2800 },
  { month: "May", revenue: 5400, profit: 2200 },
  { month: "June", revenue: 7800, profit: 3400 },
];

const barConfig = {
  revenue: {
    label: "Revenue",
    colors: {
      light: ["#3b82f6"],
      dark: ["#6A5ACD"],
    },
  },
} satisfies ChartConfig;

const lineConfig = {
  profit: {
    label: "Profit",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
} satisfies ChartConfig;

export function EvilExampleComposedChart() {
  return (
    <EvilComposedChart
      isLoading // [!code highlight]
      className="h-full w-full p-4"
      xDataKey="month"
      data={data}
      barConfig={barConfig}
      lineConfig={lineConfig}
    />
  );
}

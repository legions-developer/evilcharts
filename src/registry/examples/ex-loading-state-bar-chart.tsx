"use client";

import { EvilBarChart } from "@/registry/charts/bar-chart";
import { type ChartConfig } from "@/registry/ui/chart";

const chartConfig = {
  desktop: {
    label: "Desktop",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  mobile: {
    label: "Mobile",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function EvilExampleBarChart() {
  return (
    <EvilBarChart
      isLoading={true} // [!code highlight]
      className="h-full w-full p-4"
      xDataKey="month"
      barVariant="default"
      data={[]}
      chartConfig={chartConfig}
      xAxisProps={{ tickFormatter: (value) => value.substring(0, 3) }}
    />
  );
}

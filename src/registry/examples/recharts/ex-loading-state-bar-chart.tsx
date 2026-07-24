"use client";

import { EvilBarChart } from "@/registry/charts/recharts-bar-chart";
import { type ChartConfig } from "@/registry/ui/recharts-chart";

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
      data={[]} // if isLoading is true, pass empty array → i.e isLoading ? [] : data
      config={chartConfig}
      className="h-full w-full p-4"
      isLoading={true} // [!code highlight]
    >
      <EvilBarChart.Grid />
      <EvilBarChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <EvilBarChart.Legend />
      <EvilBarChart.Tooltip />
      <EvilBarChart.Bar dataKey="desktop" variant="default" />
      <EvilBarChart.Bar dataKey="mobile" variant="default" />
    </EvilBarChart>
  );
}

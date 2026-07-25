"use client";

import { EChartsBarChart, type ChartConfig } from "@/registry/charts/echarts-bar-chart";

const data: { month: string; desktop: number; mobile: number }[] = [];

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

export function EChartsExampleBarChart() {
  return (
    <EChartsBarChart
      data={data} // if isLoading is true, pass empty array → i.e isLoading ? [] : data
      config={chartConfig}
      className="h-full w-full p-4"
      isLoading={true} // [!code highlight]
    >
      <EChartsBarChart.Grid />
      <EChartsBarChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <EChartsBarChart.Legend />
      <EChartsBarChart.Tooltip />
      <EChartsBarChart.Bar dataKey="desktop" variant="default" />
      <EChartsBarChart.Bar dataKey="mobile" variant="default" />
    </EChartsBarChart>
  );
}

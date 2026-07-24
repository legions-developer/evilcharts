"use client";

import { EChartsBarChart, type ChartConfig } from "@/registry/charts/echarts-bar-chart";

const data = [
  { month: "January", desktop: 342 },
  { month: "February", desktop: 876 },
  { month: "March", desktop: 512 },
  { month: "April", desktop: 629 },
  { month: "May", desktop: 458 },
  { month: "June", desktop: 781 },
  { month: "July", desktop: 394 },
  { month: "August", desktop: 925 },
  { month: "September", desktop: 647 },
  { month: "October", desktop: 532 },
  { month: "November", desktop: 803 },
  { month: "December", desktop: 271 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    colors: {
      light: ["#0a0a0a"],
      dark: ["#fafafa"],
    },
  },
} satisfies ChartConfig;

export function EChartsExampleBarChart() {
  return (
    <EChartsBarChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      barCategoryGap={32}
    >
      <EChartsBarChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <EChartsBarChart.Tooltip />
      <EChartsBarChart.Bar
        dataKey="desktop"
        variant="blocks" // [!code highlight]
      />
    </EChartsBarChart>
  );
}

"use client";

import { EChartsBarChart, type ChartConfig } from "@/registry/charts/echarts-bar-chart";

const data = [
  { month: "January", desktop: 342, mobile: 184 },
  { month: "February", desktop: 876, mobile: 491 },
  { month: "March", desktop: 512, mobile: 290 },
  { month: "April", desktop: 629, mobile: 391 },
  { month: "May", desktop: 458, mobile: 309 },
  { month: "June", desktop: 781, mobile: 449 },
  { month: "July", desktop: 394, mobile: 234 },
  { month: "August", desktop: 925, mobile: 557 },
  { month: "September", desktop: 647, mobile: 367 },
  { month: "October", desktop: 532, mobile: 357 },
  { month: "November", desktop: 803, mobile: 515 },
  { month: "December", desktop: 271, mobile: 149 },
];

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
    <EChartsBarChart data={data} config={chartConfig} className="h-full w-full p-4">
      <EChartsBarChart.Grid />
      <EChartsBarChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <EChartsBarChart.Legend isClickable />
      <EChartsBarChart.Tooltip />
      <EChartsBarChart.Bar
        dataKey="desktop"
        variant="duotone" // [!code highlight]
        isClickable
      />
      <EChartsBarChart.Bar
        dataKey="mobile"
        variant="duotone" // [!code highlight]
        isClickable
      />
    </EChartsBarChart>
  );
}

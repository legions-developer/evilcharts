"use client";

import { EChartsAreaChart, type ChartConfig } from "@/registry/charts/echarts-area-chart";

const data = [
  { month: "January", visitors: 342 },
  { month: "February", visitors: 876 },
  { month: "March", visitors: 512 },
  { month: "April", visitors: 629 },
  { month: "May", visitors: 458 },
  { month: "June", visitors: 781 },
];

const chartConfig = {
  visitors: {
    label: "Visitors",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
} satisfies ChartConfig;

export function EChartsSvgRendererAreaChart() {
  return (
    <EChartsAreaChart
      renderer="svg"
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      xDataKey="month"
    >
      <EChartsAreaChart.Grid />
      <EChartsAreaChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <EChartsAreaChart.Tooltip />
      <EChartsAreaChart.Area dataKey="visitors" variant="gradient">
        <EChartsAreaChart.ActiveDot variant="colored-border" />
      </EChartsAreaChart.Area>
      <EChartsAreaChart.Brush />
    </EChartsAreaChart>
  );
}

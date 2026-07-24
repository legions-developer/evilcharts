"use client";

import { EChartsAreaChart, type ChartConfig } from "@/registry/charts/echarts-area-chart";

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

export function EChartsExampleAreaChart() {
  return (
    <EChartsAreaChart
      data={data} // if isLoading is true, pass empty array → i.e isLoading ? [] : data
      config={chartConfig}
      className="h-full w-full p-4"
      isLoading={true} // [!code highlight]
      stackType="stacked"
      curveType="bump"
    >
      <EChartsAreaChart.Grid />
      <EChartsAreaChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <EChartsAreaChart.YAxis dataKey="desktop" />
      <EChartsAreaChart.Legend isClickable />
      <EChartsAreaChart.Tooltip />
      <EChartsAreaChart.Area dataKey="desktop" variant="gradient" isClickable>
        <EChartsAreaChart.ActiveDot variant="default" />
      </EChartsAreaChart.Area>
      <EChartsAreaChart.Area dataKey="mobile" variant="gradient" isClickable>
        <EChartsAreaChart.ActiveDot variant="default" />
      </EChartsAreaChart.Area>
    </EChartsAreaChart>
  );
}

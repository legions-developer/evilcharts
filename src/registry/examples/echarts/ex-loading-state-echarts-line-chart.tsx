"use client";

import { EChartsLineChart, type ChartConfig } from "@/registry/charts/echarts-line-chart";

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

export function EChartsExampleLineChart() {
  return (
    <EChartsLineChart
      data={data} // if isLoading is true, pass empty array → i.e isLoading ? [] : data
      config={chartConfig}
      className="h-full w-full p-4"
      isLoading={true} // [!code highlight]
      curveType="bump"
    >
      <EChartsLineChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <EChartsLineChart.YAxis dataKey="desktop" />
      <EChartsLineChart.Legend isClickable />
      <EChartsLineChart.Tooltip />
      <EChartsLineChart.Line dataKey="desktop" strokeVariant="solid" isClickable>
        <EChartsLineChart.ActiveDot variant="default" />
      </EChartsLineChart.Line>
      <EChartsLineChart.Line dataKey="mobile" strokeVariant="solid" isClickable>
        <EChartsLineChart.ActiveDot variant="default" />
      </EChartsLineChart.Line>
    </EChartsLineChart>
  );
}

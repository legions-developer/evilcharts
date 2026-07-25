"use client";

import { EChartsRadarChart, type ChartConfig } from "@/registry/charts/echarts-radar-chart";

const chartConfig = {
  desktop: {
    label: "Desktop",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  mobile: {
    label: "Mobile",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
} satisfies ChartConfig;

export function EChartsExampleRadarChart() {
  return (
    <EChartsRadarChart
      data={[]} // if isLoading is true, pass empty array → i.e isLoading ? [] : data
      config={chartConfig}
      className="h-full w-full p-4"
      isLoading={true} // [!code highlight]
    >
      <EChartsRadarChart.PolarGrid />
      <EChartsRadarChart.PolarAngleAxis dataKey="skill" />
      <EChartsRadarChart.Legend />
      <EChartsRadarChart.Tooltip />
      <EChartsRadarChart.Radar dataKey="desktop" variant="filled" />
      <EChartsRadarChart.Radar dataKey="mobile" variant="filled" />
    </EChartsRadarChart>
  );
}

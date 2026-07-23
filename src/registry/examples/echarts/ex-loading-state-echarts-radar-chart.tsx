"use client";

import {
  EChartsRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  Tooltip,
  Legend,
  type ChartConfig,
} from "@/registry/charts/echarts-radar-chart";

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
      <PolarGrid />
      <PolarAngleAxis dataKey="skill" />
      <Legend />
      <Tooltip />
      <Radar dataKey="desktop" variant="filled" />
      <Radar dataKey="mobile" variant="filled" />
    </EChartsRadarChart>
  );
}

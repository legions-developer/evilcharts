"use client";

import {
  EChartsBarChart,
  Bar,
  YAxis,
  Grid,
  Tooltip,
  Legend,
  type ChartConfig,
} from "@/registry/charts/echarts-bar-chart";

const data = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 173 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    colors: {
      light: ["#2563eb"],
      dark: ["#3b82f6"],
    },
  },
} satisfies ChartConfig;

export function EChartsExampleBarChart() {
  return (
    <EChartsBarChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      layout="horizontal" // [!code highlight]
    >
      <Grid />
      <YAxis
        dataKey="month"
        tickFormatter={(value) => value.substring(0, 3)} // [!code highlight]
      />
      <Legend />
      <Tooltip />
      <Bar dataKey="desktop" variant="default" />
    </EChartsBarChart>
  );
}

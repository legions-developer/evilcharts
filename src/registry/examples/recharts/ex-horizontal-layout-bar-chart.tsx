"use client";

import { EvilBarChart } from "@/registry/charts/recharts-bar-chart";
import { type ChartConfig } from "@/registry/ui/recharts-chart";

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

export function EvilExampleBarChart() {
  return (
    <EvilBarChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      layout="horizontal" // [!code highlight]
    >
      <EvilBarChart.Grid />
      <EvilBarChart.YAxis
        dataKey="month"
        tickFormatter={(value) => value.substring(0, 3)} // [!code highlight]
      />
      <EvilBarChart.Legend />
      <EvilBarChart.Tooltip />
      <EvilBarChart.Bar dataKey="desktop" variant="default" />
    </EvilBarChart>
  );
}

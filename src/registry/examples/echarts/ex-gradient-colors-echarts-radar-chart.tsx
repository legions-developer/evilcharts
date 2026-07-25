"use client";

import { EChartsRadarChart, type ChartConfig } from "@/registry/charts/echarts-radar-chart";

const data = [
  { skill: "JavaScript", desktop: 186, mobile: 80 },
  { skill: "TypeScript", desktop: 305, mobile: 200 },
  { skill: "React", desktop: 237, mobile: 120 },
  { skill: "Node.js", desktop: 173, mobile: 190 },
  { skill: "CSS", desktop: 209, mobile: 130 },
  { skill: "Python", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    colors: {
      light: ["#6366f1", "#a855f7", "#ec4899"], // Indigo -> Purple -> Pink // [!code highlight]
      dark: ["red", "orange", "pink"], // [!code highlight]
    },
  },
  mobile: {
    label: "Mobile",
    colors: {
      light: ["#14b8a6", "#06b6d4", "#3b82f6"], // Teal -> Cyan -> Blue // [!code highlight]
      dark: ["#2dd4bf", "#22d3ee", "#60a5fa"], // [!code highlight]
    },
  },
} satisfies ChartConfig;

export function EChartsExampleRadarChart() {
  return (
    <EChartsRadarChart data={data} config={chartConfig} className="h-full w-full p-4">
      <EChartsRadarChart.PolarGrid />
      <EChartsRadarChart.PolarAngleAxis dataKey="skill" />
      <EChartsRadarChart.Legend />
      <EChartsRadarChart.Tooltip />
      <EChartsRadarChart.Radar dataKey="desktop" variant="filled">
        <EChartsRadarChart.Dot variant="colored-border" />
        <EChartsRadarChart.ActiveDot variant="default" />
      </EChartsRadarChart.Radar>
      <EChartsRadarChart.Radar dataKey="mobile" variant="filled">
        <EChartsRadarChart.Dot variant="colored-border" />
        <EChartsRadarChart.ActiveDot variant="default" />
      </EChartsRadarChart.Radar>
    </EChartsRadarChart>
  );
}

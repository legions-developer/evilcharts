"use client";

import { EvilRadarChart } from "@/registry/charts/radar-chart";
import { type ChartConfig } from "@/registry/ui/chart";

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

export function EvilExampleRadarChart() {
  return (
    <EvilRadarChart
      className="h-full w-full p-4"
      data={data}
      dataKey="skill"
      dotVariant="colored-border"
      activeDotVariant="default"
      chartConfig={chartConfig}
      variant="lines" // [!code highlight]
    />
  );
}

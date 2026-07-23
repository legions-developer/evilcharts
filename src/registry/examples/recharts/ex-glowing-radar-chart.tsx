"use client";

import {
  EvilRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  Tooltip,
  Legend,
  Dot,
  ActiveDot,
} from "@/registry/charts/recharts-radar-chart";
import { type ChartConfig } from "@/registry/ui/recharts-chart";

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
    <EvilRadarChart data={data} config={chartConfig} className="h-full w-full p-4">
      <PolarGrid />
      <PolarAngleAxis dataKey="skill" />
      <Legend />
      <Tooltip />
      <Radar
        dataKey="desktop"
        variant="filled"
        isGlowing // [!code highlight]
      >
        <Dot variant="colored-border" />
        <ActiveDot variant="default" />
      </Radar>
      <Radar dataKey="mobile" variant="filled">
        <Dot variant="colored-border" />
        <ActiveDot variant="default" />
      </Radar>
    </EvilRadarChart>
  );
}

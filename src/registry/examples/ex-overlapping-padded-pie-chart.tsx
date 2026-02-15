"use client";

import { EvilPieChart } from "@/registry/charts/pie-chart";
import { type ChartConfig } from "@/registry/ui/chart";

const data = [
  { browser: "chrome", visitors: 275 },
  { browser: "safari", visitors: 200 },
  { browser: "firefox", visitors: 187 },
  { browser: "edge", visitors: 173 },
  { browser: "other", visitors: 90 },
];

const chartConfig = {
  chrome: {
    label: "Chrome",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  safari: {
    label: "Safari",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
  firefox: {
    label: "Firefox",
    colors: {
      light: ["#f59e0b"],
      dark: ["#fbbf24"],
    },
  },
  edge: {
    label: "Edge",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  other: {
    label: "Other",
    colors: {
      light: ["#6b7280"],
      dark: ["#9ca3af"],
    },
  },
} satisfies ChartConfig;

export function EvilExamplePieChart() {
  return (
    <EvilPieChart
      className="h-full w-full p-4"
      data={data}
      dataKey="visitors"
      nameKey="browser"
      chartConfig={chartConfig}
      innerRadius={60}
      paddingAngle={-25}
      cornerRadius={99}
    />
  );
}

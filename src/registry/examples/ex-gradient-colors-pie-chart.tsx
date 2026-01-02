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
      light: ["#93c5fd", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af"], // [!code highlight]
      dark: ["#bfdbfe", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8"], // [!code highlight]
    },
  },
  safari: {
    label: "Safari",
    colors: {
      light: ["#6ee7b7", "#10b981", "#059669", "#047857", "#065f46"], // [!code highlight]
      dark: ["#a7f3d0", "#34d399", "#10b981", "#059669", "#047857"], // [!code highlight]
    },
  },
  firefox: {
    label: "Firefox",
    colors: {
      light: ["#fcd34d", "#f59e0b", "#d97706", "#b45309", "#92400e"], // [!code highlight]
      dark: ["#fde68a", "#fbbf24", "#f59e0b", "#d97706", "#b45309"], // [!code highlight]
    },
  },
  edge: {
    label: "Edge",
    colors: {
      light: ["#c4b5fd", "#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6"], // [!code highlight]
      dark: ["#ddd6fe", "#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9"], // [!code highlight]
    },
  },
  other: {
    label: "Other",
    colors: {
      light: ["#d1d5db", "#9ca3af", "#6b7280", "#4b5563", "#374151"], // [!code highlight]
      dark: ["#e5e7eb", "#d1d5db", "#9ca3af", "#6b7280", "#4b5563"], // [!code highlight]
    },
  },
} satisfies ChartConfig;

export function EvilExamplePieChart() {
  return (
    <EvilPieChart
      isClickable
      className="h-full w-full p-4"
      data={data}
      dataKey="visitors"
      nameKey="browser"
      chartConfig={chartConfig}
    />
  );
}

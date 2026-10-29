"use client";

import { EvilHeatmapChart, type ChartConfig } from "@/registry/charts/recharts-heatmap-chart";

const chartConfig = {
  contributions: {
    label: "Contributions",
    colors: {
      light: ["#9be9a8", "#40c463", "#30a14e", "#216e39"],
      dark: ["#0e4429", "#006d32", "#26a641", "#39d353"],
    },
  },
} satisfies ChartConfig;

export function EvilExampleHeatmapChart() {
  return (
    <EvilHeatmapChart
      className="h-full w-full p-4"
      data={[]}
      range={2025}
      config={chartConfig}
      isLoading // [!code highlight]
    >
      <EvilHeatmapChart.Cell dataKey="contributions" />
      <EvilHeatmapChart.MonthLabel />
      <EvilHeatmapChart.DayLabel />
      <EvilHeatmapChart.Tooltip />
      <EvilHeatmapChart.Legend />
    </EvilHeatmapChart>
  );
}

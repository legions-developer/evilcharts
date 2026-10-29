"use client";

import { EChartsHeatmapChart, type ChartConfig } from "@/registry/charts/echarts-heatmap-chart";

const chartConfig = {
  contributions: {
    label: "Contributions",
    colors: {
      light: ["#9be9a8", "#40c463", "#30a14e", "#216e39"],
      dark: ["#0e4429", "#006d32", "#26a641", "#39d353"],
    },
  },
} satisfies ChartConfig;

export function EChartsExampleHeatmapChart() {
  return (
    <EChartsHeatmapChart
      className="h-full w-full p-4"
      data={[]}
      range={2025}
      config={chartConfig}
      isLoading // [!code highlight]
    >
      <EChartsHeatmapChart.Cell dataKey="contributions" />
      <EChartsHeatmapChart.MonthLabel />
      <EChartsHeatmapChart.DayLabel />
      <EChartsHeatmapChart.Tooltip />
      <EChartsHeatmapChart.Legend />
    </EChartsHeatmapChart>
  );
}

"use client";

import {
  EChartsHeatmapChart,
  type ChartConfig,
  type HeatmapDatum,
} from "@/registry/charts/echarts-heatmap-chart";

// One quarter of daily sales, so the larger cells have room to breathe.
function buildSales(seed: number): HeatmapDatum[] {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  const start = Date.UTC(2025, 9, 1);
  const data: HeatmapDatum[] = [];
  for (let i = 0; i < 92; i++) {
    if (random() < 0.12) continue;
    data.push({
      date: new Date(start + i * 86_400_000).toISOString().slice(0, 10),
      value: Math.round(random() * 4200) + 300,
    });
  }
  return data;
}

const data = buildSales(5);

const chartConfig = {
  sales: {
    label: "Sales",
    colors: {
      light: ["#fed7aa", "#fb923c", "#ea580c", "#9a3412"],
      dark: ["#7c2d12", "#c2410c", "#f97316", "#fdba74"],
    },
  },
} satisfies ChartConfig;

export function EChartsExampleHeatmapChart() {
  return (
    <EChartsHeatmapChart
      className="h-full w-full p-4"
      data={data}
      config={chartConfig}
      range={["2025-10-01", "2025-12-31"]}
    >
      <EChartsHeatmapChart.Cell dataKey="sales" radius={6} gap={5} /> {/* [!code highlight] */}
      <EChartsHeatmapChart.MonthLabel />
      <EChartsHeatmapChart.DayLabel />
      <EChartsHeatmapChart.Tooltip valueFormatter={(value) => `$${value.toLocaleString()}`} />
      <EChartsHeatmapChart.Legend />
    </EChartsHeatmapChart>
  );
}

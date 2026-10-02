"use client";

import {
  EChartsHeatmapChart,
  type ChartConfig,
  type HeatmapDatum,
} from "@/registry/charts/echarts-heatmap-chart";

// A year of daily contributions, seeded so the docs render the same picture every time.
function buildContributions(seed: number): HeatmapDatum[] {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  const end = Date.UTC(2025, 11, 31);
  const data: HeatmapDatum[] = [];
  for (let i = 364; i >= 0; i--) {
    const day = new Date(end - i * 86_400_000);
    const weekend = day.getUTCDay() === 0 || day.getUTCDay() === 6;
    const active = random() < (weekend ? 0.3 : 0.8);
    if (!active) continue;
    const value = Math.round(random() * (weekend ? 6 : 14)) + 1;
    data.push({ date: day.toISOString().slice(0, 10), value });
  }
  return data;
}

const data = buildContributions(7);

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
    <EChartsHeatmapChart className="h-full w-full p-4" data={data} config={chartConfig}>
      <EChartsHeatmapChart.Cell dataKey="contributions" />
      <EChartsHeatmapChart.MonthLabel />
      <EChartsHeatmapChart.DayLabel />
      <EChartsHeatmapChart.Tooltip />
      <EChartsHeatmapChart.Legend />
    </EChartsHeatmapChart>
  );
}

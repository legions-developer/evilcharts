"use client";

import {
  EChartsHeatmapChart,
  type ChartConfig,
  type HeatmapDatum,
} from "@/registry/charts/echarts-heatmap-chart";

// Error-budget burn per day — mostly quiet, with the odd incident spike.
function buildIncidents(seed: number): HeatmapDatum[] {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  const end = Date.UTC(2025, 11, 31);
  const data: HeatmapDatum[] = [];
  for (let i = 364; i >= 0; i--) {
    const roll = random();
    if (roll < 0.45) continue;
    const value = roll > 0.96 ? Math.ceil(random() * 40) + 10 : Math.ceil(random() * 5);
    data.push({ date: new Date(end - i * 86_400_000).toISOString().slice(0, 10), value });
  }
  return data;
}

const data = buildIncidents(19);

const chartConfig = {
  errors: {
    label: "Errors",
    colors: {
      light: ["#fecaca", "#ef4444", "#7f1d1d"],
      dark: ["#7f1d1d", "#ef4444", "#fecaca"],
    },
  },
} satisfies ChartConfig;

export function EChartsExampleHeatmapChart() {
  return (
    <EChartsHeatmapChart
      className="h-full w-full p-4"
      data={data}
      config={chartConfig}
      thresholds={[3, 10]} // [!code highlight]
    >
      <EChartsHeatmapChart.Cell dataKey="errors" />
      <EChartsHeatmapChart.MonthLabel />
      <EChartsHeatmapChart.DayLabel />
      <EChartsHeatmapChart.Tooltip />
      <EChartsHeatmapChart.Legend lessLabel="Quiet" moreLabel="Incident" />
    </EChartsHeatmapChart>
  );
}

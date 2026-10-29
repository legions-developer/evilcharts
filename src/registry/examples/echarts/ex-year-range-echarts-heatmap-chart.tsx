"use client";

import {
  EChartsHeatmapChart,
  type ChartConfig,
  type HeatmapDatum,
} from "@/registry/charts/echarts-heatmap-chart";

// Deploys per day across a calendar year, busier in the second half.
function buildDeploys(seed: number): HeatmapDatum[] {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  const data: HeatmapDatum[] = [];
  for (let month = 0; month < 12; month++) {
    const days = new Date(Date.UTC(2025, month + 1, 0)).getUTCDate();
    for (let day = 1; day <= days; day++) {
      const date = new Date(Date.UTC(2025, month, day));
      if (date.getUTCDay() === 0 || date.getUTCDay() === 6) continue;
      if (random() >= 0.4 + month * 0.04) continue;
      data.push({
        date: date.toISOString().slice(0, 10),
        value: Math.ceil(random() * (2 + month)),
      });
    }
  }
  return data;
}

const data = buildDeploys(41);

const chartConfig = {
  deploys: {
    label: "Deploys",
    colors: {
      light: ["#e9d5ff", "#c084fc", "#9333ea", "#581c87"],
      dark: ["#3b0764", "#6b21a8", "#a855f7", "#e9d5ff"],
    },
  },
} satisfies ChartConfig;

export function EChartsExampleHeatmapChart() {
  return (
    <EChartsHeatmapChart
      className="h-full w-full p-4"
      data={data}
      config={chartConfig}
      range={2025} // [!code highlight]
      scale="linear" // [!code highlight]
    >
      <EChartsHeatmapChart.Cell dataKey="deploys" />
      <EChartsHeatmapChart.MonthLabel />
      <EChartsHeatmapChart.DayLabel />
      <EChartsHeatmapChart.Tooltip />
      <EChartsHeatmapChart.Legend align="left" />
    </EChartsHeatmapChart>
  );
}

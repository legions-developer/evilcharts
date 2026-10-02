"use client";

import {
  EChartsHeatmapChart,
  type ChartConfig,
  type HeatmapDatum,
} from "@/registry/charts/echarts-heatmap-chart";

// Workouts logged per day — weekday-heavy, with rest days scattered through.
function buildWorkouts(seed: number): HeatmapDatum[] {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  const end = Date.UTC(2025, 11, 31);
  const data: HeatmapDatum[] = [];
  for (let i = 364; i >= 0; i--) {
    const day = new Date(end - i * 86_400_000);
    if (random() >= 0.55) continue;
    data.push({ date: day.toISOString().slice(0, 10), value: Math.ceil(random() * 90) });
  }
  return data;
}

const data = buildWorkouts(23);

const chartConfig = {
  minutes: {
    label: "Minutes",
    colors: {
      light: ["#bfdbfe", "#60a5fa", "#2563eb", "#1e3a8a"],
      dark: ["#1e3a8a", "#1d4ed8", "#3b82f6", "#93c5fd"],
    },
  },
} satisfies ChartConfig;

export function EChartsExampleHeatmapChart() {
  return (
    <EChartsHeatmapChart
      className="h-full w-full p-4"
      data={data}
      config={chartConfig}
      weekStart="monday" // [!code highlight]
    >
      <EChartsHeatmapChart.Cell dataKey="minutes" />
      <EChartsHeatmapChart.MonthLabel />
      <EChartsHeatmapChart.DayLabel labels={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]} />
      <EChartsHeatmapChart.Tooltip valueFormatter={(value) => `${value} min`} />
      <EChartsHeatmapChart.Legend />
    </EChartsHeatmapChart>
  );
}

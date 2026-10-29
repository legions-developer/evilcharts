"use client";

import {
  EChartsHeatmapChart,
  type ChartConfig,
  type HeatmapDatum,
  type HeatmapSelection,
} from "@/registry/charts/echarts-heatmap-chart";
import { useState } from "react";

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
    if (random() >= (weekend ? 0.3 : 0.8)) continue;
    data.push({
      date: day.toISOString().slice(0, 10),
      value: Math.round(random() * (weekend ? 6 : 14)) + 1,
    });
  }
  return data;
}

const data = buildContributions(3);

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
  const [selection, setSelection] = useState<HeatmapSelection | null>(null);

  return (
    <div className="flex h-full w-full flex-col p-4">
      <EChartsHeatmapChart
        className="min-h-0 w-full flex-1"
        data={data}
        config={chartConfig}
        onSelectionChange={setSelection} // [!code highlight]
      >
        <EChartsHeatmapChart.Cell dataKey="contributions" isClickable /> {/* [!code highlight] */}
        <EChartsHeatmapChart.MonthLabel />
        <EChartsHeatmapChart.DayLabel />
        <EChartsHeatmapChart.Tooltip />
      </EChartsHeatmapChart>
      <p className="text-muted-foreground mt-3 text-xs">
        {selection
          ? `${selection.value} contributions on ${selection.date}`
          : "Click a day to select it."}
      </p>
    </div>
  );
}

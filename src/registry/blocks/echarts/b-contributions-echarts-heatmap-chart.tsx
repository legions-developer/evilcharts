"use client";

import {
  EChartsHeatmapChart,
  type ChartConfig,
  type HeatmapDatum,
} from "@/registry/charts/echarts-heatmap-chart";

// A year of daily contributions, seeded so the block renders the same picture every time.
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
    const sprint = Math.floor(i / 7) % 6 < 2;
    const chance = (weekend ? 0.25 : 0.75) + (sprint ? 0.2 : 0);
    if (random() >= chance) continue;
    const value = Math.round(random() * (weekend ? 5 : sprint ? 22 : 12)) + 1;
    data.push({ date: day.toISOString().slice(0, 10), value });
  }
  return data;
}

const chartData = buildContributions(2024);

const chartConfig = {
  contributions: {
    label: "Contributions",
    colors: {
      light: ["#9be9a8", "#40c463", "#30a14e", "#216e39"],
      dark: ["#0e4429", "#006d32", "#26a641", "#39d353"],
    },
  },
} satisfies ChartConfig;

const TOTAL = chartData.reduce((sum, day) => sum + day.value, 0);

const LONGEST_STREAK = (() => {
  const active = new Set(chartData.map((day) => day.date));
  const end = Date.UTC(2025, 11, 31);
  let best = 0;
  let run = 0;
  for (let i = 364; i >= 0; i--) {
    const date = new Date(end - i * 86_400_000).toISOString().slice(0, 10);
    run = active.has(date) ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
})();

export function EChartsContributionsHeatmapChart() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-primary text-sm font-medium">
            {TOTAL.toLocaleString("en-US")} contributions in the last year
          </span>
          <span className="text-muted-foreground text-[11px]">
            Longest streak {LONGEST_STREAK} days
          </span>
        </div>
        <span className="text-muted-foreground font-mono text-[11px]">2025</span>
      </div>

      <EChartsHeatmapChart
        className="mt-3 min-h-0 w-full flex-1"
        data={chartData}
        config={chartConfig}
        range={2025}
      >
        <EChartsHeatmapChart.Cell dataKey="contributions" radius={2} gap={3} />
        <EChartsHeatmapChart.MonthLabel />
        <EChartsHeatmapChart.DayLabel />
        <EChartsHeatmapChart.Tooltip variant="frosted-glass" />
        <EChartsHeatmapChart.Legend />
      </EChartsHeatmapChart>
    </div>
  );
}

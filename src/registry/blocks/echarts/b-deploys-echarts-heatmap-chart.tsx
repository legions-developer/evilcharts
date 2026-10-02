"use client";

import {
  EChartsHeatmapChart,
  type ChartConfig,
  type HeatmapDatum,
} from "@/registry/charts/echarts-heatmap-chart";

// Six months of weekday deploys, seeded, with the cadence tightening over time.
function buildDeploys(seed: number): HeatmapDatum[] {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  const start = Date.UTC(2025, 6, 1);
  const end = Date.UTC(2025, 11, 31);
  const data: HeatmapDatum[] = [];
  for (let ms = start; ms <= end; ms += 86_400_000) {
    const day = new Date(ms);
    if (day.getUTCDay() === 0 || day.getUTCDay() === 6) continue;
    const progress = (ms - start) / (end - start);
    if (random() >= 0.45 + progress * 0.4) continue;
    data.push({
      date: day.toISOString().slice(0, 10),
      value: Math.ceil(random() * (2 + progress * 8)),
    });
  }
  return data;
}

const chartData = buildDeploys(77);

const chartConfig = {
  deploys: {
    label: "Deploys",
    colors: {
      light: ["#bae6fd", "#38bdf8", "#0284c7", "#075985"],
      dark: ["#0c4a6e", "#0369a1", "#0ea5e9", "#bae6fd"],
    },
  },
} satisfies ChartConfig;

const TOTAL = chartData.reduce((sum, day) => sum + day.value, 0);
const WEEKDAYS = (() => {
  let count = 0;
  for (let ms = Date.UTC(2025, 6, 1); ms <= Date.UTC(2025, 11, 31); ms += 86_400_000) {
    const day = new Date(ms).getUTCDay();
    if (day !== 0 && day !== 6) count += 1;
  }
  return count;
})();
const BUSIEST = chartData.reduce(
  (best, day) => (day.value > best.value ? day : best),
  chartData[0],
);
const BUSIEST_LABEL = new Date(Date.parse(`${BUSIEST.date}T00:00:00Z`)).toLocaleDateString(
  "en-US",
  {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  },
);

export function EChartsDeploysHeatmapChart() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-[11px]">Deploys</span>
          <span className="text-primary text-xl leading-none font-semibold tracking-tight">
            {TOTAL.toLocaleString("en-US")}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-[11px]">Busiest day</span>
          <span className="text-primary text-xl leading-none font-semibold tracking-tight">
            {BUSIEST_LABEL}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-[11px]">Per weekday</span>
          <span className="text-primary text-xl leading-none font-semibold tracking-tight">
            {(TOTAL / WEEKDAYS).toFixed(1)}
          </span>
        </div>
      </div>

      <EChartsHeatmapChart
        className="mt-4 min-h-0 w-full flex-1"
        data={chartData}
        config={chartConfig}
        range={["2025-07-01", "2025-12-31"]}
        weekStart="monday"
        scale="linear"
      >
        <EChartsHeatmapChart.Cell dataKey="deploys" radius={3} gap={3} />
        <EChartsHeatmapChart.MonthLabel />
        <EChartsHeatmapChart.DayLabel labels={["", "Mon", "", "Wed", "", "Fri", ""]} />
        <EChartsHeatmapChart.Tooltip />
        <EChartsHeatmapChart.Legend align="left" lessLabel="Fewer" moreLabel="More" />
      </EChartsHeatmapChart>
    </div>
  );
}

"use client";

import { EChartsAreaChart, type ChartConfig } from "@/registry/charts/echarts-area-chart";

const chartData = [
  { date: "Jan 1", actual: 240, target: 125 },
  { date: "Jan 8", actual: 240, target: 125 },
  { date: "Jan 15", actual: 175, target: 200 },
  { date: "Jan 22", actual: 175, target: 200 },
  { date: "Feb 1", actual: 175, target: 200 },
  { date: "Feb 8", actual: 260, target: 125 },
  { date: "Feb 15", actual: 260, target: 125 },
  { date: "Feb 22", actual: 260, target: 125 },
  { date: "Mar 1", actual: 260, target: 190 },
  { date: "Mar 8", actual: 335, target: 190 },
  { date: "Mar 15", actual: 335, target: 190 },
  { date: "Mar 22", actual: 335, target: 390 },
  { date: "Apr 1", actual: 335, target: 390 },
  { date: "Apr 8", actual: 335, target: 390 },
  { date: "Apr 15", actual: 190, target: 390 },
  { date: "Apr 22", actual: 215, target: 305 },
  { date: "May 1", actual: 215, target: 305 },
  { date: "May 8", actual: 215, target: 175 },
  { date: "May 15", actual: 215, target: 175 },
  { date: "May 22", actual: 275, target: 175 },
  { date: "Jun 1", actual: 275, target: 245 },
];

const chartConfig = {
  actual: { label: "Actual", colors: { light: ["#0a0a0a"], dark: ["#ffffff"] } },
  target: { label: "Target", colors: { light: ["#a1a1aa"], dark: ["#666"] } },
} satisfies ChartConfig;

const LATEST = chartData[chartData.length - 1];
const DELTA = ((LATEST.actual - LATEST.target) / LATEST.target) * 100;

export function EChartsBenchmarkAreaChart() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Weekly signups</span>
          <div className="flex items-baseline gap-2">
            <span className="text-primary text-2xl font-semibold tracking-tight sm:text-3xl">
              {LATEST.actual}
            </span>
            <span className="text-sm font-medium text-emerald-500">
              +{DELTA.toFixed(1)}% vs target
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 pt-1">
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <svg className="text-primary" width="18" height="2" viewBox="0 0 18 2" aria-hidden>
              <line x1="0" y1="1" x2="18" y2="1" stroke="currentColor" strokeWidth="2" />
            </svg>
            Actual
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <svg width="18" height="2" viewBox="0 0 18 2" aria-hidden>
              <line
                x1="0"
                y1="1"
                x2="18"
                y2="1"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
            </svg>
            Target
          </div>
        </div>
      </div>

      <EChartsAreaChart
        data={chartData}
        config={chartConfig}
        xDataKey="date"
        className="mt-4 min-h-0 w-full flex-1"
        curveType="smooth"
      >
        <EChartsAreaChart.Grid />
        <EChartsAreaChart.XAxis
          dataKey="date"
          tickFormatter={(value) => (value.split(" ")[1] === "1" ? value.split(" ")[0] : "")}
        />
        <EChartsAreaChart.YAxis />
        <EChartsAreaChart.Tooltip />
        <EChartsAreaChart.Area dataKey="target" variant="none" strokeVariant="dashed" />
        <EChartsAreaChart.Area dataKey="actual" variant="lines" strokeVariant="solid" />
      </EChartsAreaChart>
    </div>
  );
}

"use client";

import { EChartsAreaChart, type ChartConfig } from "@/registry/charts/echarts-area-chart";

const chartData = [
  { month: "Jan", listeners: 2980 },
  { month: "Feb", listeners: 3120 },
  { month: "Mar", listeners: 3460 },
  { month: "Apr", listeners: 3380 },
  { month: "May", listeners: 3720 },
  { month: "Jun", listeners: 4180 },
  { month: "Jul", listeners: 4560 },
];

const chartConfig = {
  listeners: {
    label: "Listeners",
    colors: {
      light: ["#10b981", "#0ea5e9", "#8b5cf6"],
      dark: ["#34d399", "#38bdf8", "#a78bfa"],
    },
  },
} satisfies ChartConfig;

const TOTAL = chartData.reduce((sum, { listeners }) => sum + listeners, 0);

export function EChartsAudienceAreaChart() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-start justify-between gap-4 px-4 pt-4">
        <div className="flex flex-col gap-1">
          <span className="text-primary text-base font-medium tracking-tight sm:text-lg">
            Listeners
          </span>
          <span className="text-muted-foreground max-w-[26ch] text-xs leading-snug">
            Monthly reach across every show and episode
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="text-primary text-2xl font-semibold tracking-tight sm:text-4xl">
            {TOTAL.toLocaleString("en-US")}
          </span>
          <span className="text-muted-foreground text-xs">Total listeners</span>
        </div>
      </div>

      <div className="relative mt-2 min-h-0 w-full flex-1">
        <EChartsAreaChart
          data={chartData}
          config={chartConfig}
          xDataKey="month"
          className="h-full w-full"
          curveType="monotone"
          chartOptions={{
            grid: { left: 0, right: 0, top: 16, bottom: 16, outerBoundsMode: "none" },
            yAxis: { type: "value", show: false, scale: true, boundaryGap: ["16%", "20%"] },
          }}
        >
          <EChartsAreaChart.Tooltip variant="frosted-glass" />
          <EChartsAreaChart.Area
            dataKey="listeners"
            variant="gradient"
            strokeVariant="solid"
            strokeWidth={2.5}
          >
            <EChartsAreaChart.ActiveDot variant="ping" />
          </EChartsAreaChart.Area>
          <EChartsAreaChart.XAxis
            dataKey="month"
            tickFormatter={(value) => value.substring(0, 3)}
          />
        </EChartsAreaChart>

        <div className="text-muted-foreground pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-4 pb-3 text-[10px] sm:text-xs">
          {chartData.map(({ month }) => (
            <span key={month}>{month}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

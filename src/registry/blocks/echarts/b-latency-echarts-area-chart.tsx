"use client";

import { EChartsAreaChart, type ChartConfig } from "@/registry/charts/echarts-area-chart";
import { cn } from "@/lib/utils";
import { useState } from "react";

// One palette for both themes — dashboard colors that hold up on light and dark.
const SERIES = [
  { key: "p99", label: "P99", color: "#D41F12", latest: 204 },
  { key: "p95", label: "P95", color: "#F37A00", latest: 98 },
  { key: "p75", label: "P75", color: "#62C9D4", latest: 46 },
  { key: "p50", label: "P50", color: "#007292", latest: 21 },
] as const;

const chartData = [
  { time: "Today 13:06", p99: 188, p95: 92, p75: 44, p50: 20 },
  { time: "Today 13:07", p99: 196, p95: 95, p75: 46, p50: 21 },
  { time: "Today 13:08", p99: 181, p95: 89, p75: 43, p50: 20 },
  { time: "Today 13:09", p99: 192, p95: 94, p75: 47, p50: 22 },
  { time: "Today 13:10", p99: 205, p95: 99, p75: 45, p50: 21 },
  { time: "Today 13:11", p99: 187, p95: 91, p75: 44, p50: 20 },
  { time: "Today 13:12", p99: 179, p95: 88, p75: 42, p50: 19 },
  { time: "Today 13:13", p99: 198, p95: 96, p75: 46, p50: 21 },
  { time: "Today 13:14", p99: 210, p95: 101, p75: 48, p50: 22 },
  { time: "Today 13:15", p99: 194, p95: 93, p75: 45, p50: 21 },
  { time: "Today 13:16", p99: 202, p95: 97, p75: 47, p50: 22 },
  { time: "Today 13:17", p99: 215, p95: 104, p75: 49, p50: 23 },
  { time: "Today 13:18", p99: 231, p95: 112, p75: 52, p50: 23 },
  { time: "Today 13:19", p99: 278, p95: 131, p75: 57, p50: 24 },
  { time: "Today 13:20", p99: 306, p95: 142, p75: 61, p50: 25 },
  { time: "Today 13:21", p99: 289, p95: 135, p75: 58, p50: 24 },
  { time: "Today 13:22", p99: 247, p95: 118, p75: 53, p50: 23 },
  { time: "Today 13:23", p99: 216, p95: 105, p75: 49, p50: 22 },
  { time: "Today 13:24", p99: 201, p95: 97, p75: 46, p50: 21 },
  { time: "Today 13:25", p99: 193, p95: 94, p75: 45, p50: 21 },
  { time: "Today 13:26", p99: 186, p95: 90, p75: 44, p50: 20 },
  { time: "Today 13:27", p99: 199, p95: 96, p75: 46, p50: 21 },
  { time: "Today 13:28", p99: 207, p95: 100, p75: 47, p50: 22 },
  { time: "Today 13:29", p99: 191, p95: 92, p75: 45, p50: 20 },
  { time: "Today 13:30", p99: 184, p95: 89, p75: 43, p50: 20 },
  { time: "Today 13:31", p99: 196, p95: 95, p75: 46, p50: 21 },
  { time: "Today 13:32", p99: 209, p95: 101, p75: 48, p50: 22 },
  { time: "Today 13:33", p99: 198, p95: 96, p75: 46, p50: 21 },
  { time: "Today 13:34", p99: 204, p95: 98, p75: 46, p50: 21 },
];

const chartConfig = {
  p99: { label: "P99", colors: { light: ["#f87171"], dark: ["#D41F12"] } },
  p95: { label: "P95", colors: { light: ["#fbbf24"], dark: ["#F37A00"] } },
  p75: { label: "P75", colors: { light: ["#60a5fa"], dark: ["#62C9D4"] } },
  p50: { label: "P50", colors: { light: ["#93c5fd"], dark: ["#007292"] } },
} satisfies ChartConfig;

export function EChartsLatencyAreaChart() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="grid grid-cols-2 gap-y-2 sm:grid-cols-4 sm:gap-y-4">
        {SERIES.map(({ key, label, color, latest }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelected((prev) => (prev === key ? null : key))}
            // border-l only on column boundaries: 2nd column on mobile
            // (nth-child even), every non-first cell on the 4-col desktop row.
            className={cn(
              "border-border flex cursor-pointer flex-row items-center gap-1.5 px-3 text-left transition-opacity sm:flex-col sm:items-start sm:gap-1.5 sm:px-4 sm:first:pl-1 sm:[&:not(:first-child)]:border-l [&:nth-child(even)]:border-l",
              selected !== null && selected !== key && "opacity-40",
            )}
          >
            <div className="text-primary flex items-center gap-1.5 text-xs font-medium sm:gap-2">
              <span className="size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
              {label}
            </div>
            <span className="text-muted-foreground text-xs sm:hidden">–</span>
            <div className="leading-none">
              <span className="text-primary text-sm font-medium tracking-tight sm:text-xl">
                {latest}
              </span>
              <span className="text-muted-foreground ml-0.5 text-xs font-light sm:ml-1 sm:text-sm">
                ms
              </span>
            </div>
          </button>
        ))}
      </div>
      <EChartsAreaChart
        data={chartData}
        config={chartConfig}
        xDataKey="time"
        className="mt-4 min-h-0 w-full flex-1"
        curveType="linear"
        enableHoverHighlight
        selectedDataKey={selected}
        onSelectionChange={setSelected}
      >
        <EChartsAreaChart.Grid />
        <EChartsAreaChart.XAxis
          dataKey="time"
          label="Time (UTC)"
          tickFormatter={(value) => value.replace("Today ", "")}
        />
        <EChartsAreaChart.YAxis />
        <EChartsAreaChart.Tooltip />
        <EChartsAreaChart.Area dataKey="p50" variant="gradient" strokeVariant="solid" isClickable />
        <EChartsAreaChart.Area dataKey="p75" variant="gradient" strokeVariant="solid" isClickable />
        <EChartsAreaChart.Area dataKey="p95" variant="gradient" strokeVariant="solid" isClickable />
        <EChartsAreaChart.Area dataKey="p99" variant="gradient" strokeVariant="solid" isClickable />
      </EChartsAreaChart>
    </div>
  );
}

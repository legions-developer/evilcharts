"use client";

import { EChartsRadialChart, type ChartConfig } from "@/registry/charts/echarts-radial-chart";
import { cn } from "@/lib/utils";

const TOTAL = 1000;

const TIERS = [
  {
    name: "memory",
    label: "L1 Memory",
    count: 610,
    swatch: "bg-[#dc2626] dark:bg-[#ef4444]",
  },
  {
    name: "regional",
    label: "L2 Regional",
    count: 240,
    swatch: "bg-[#d97706] dark:bg-[#f59e0b]",
  },
  {
    name: "overflow",
    label: "Edge Overflow",
    count: 100,
    swatch: "bg-[#2563eb] dark:bg-[#3b82f6]",
  },
  {
    name: "origin",
    label: "Origin Fetch",
    count: 50,
    swatch: "bg-[#0f172a] dark:bg-white",
  },
];

const STATS = [
  { name: "warm", label: "Served Warm", value: 9150 },
  { name: "revalidated", label: "Revalidated", value: 1280 },
  { name: "evictions", label: "Evictions", value: 412 },
  { name: "purges", label: "Purges", value: 96 },
];

const chartConfig = {
  memory: { label: "L1 Memory", colors: { light: ["#dc2626"], dark: ["#ef4444"] } },
  regional: { label: "L2 Regional", colors: { light: ["#d97706"], dark: ["#f59e0b"] } },
  overflow: { label: "Edge Overflow", colors: { light: ["#2563eb"], dark: ["#3b82f6"] } },
  origin: { label: "Origin Fetch", colors: { light: ["#0f172a"], dark: ["#ffffff"] } },
} satisfies ChartConfig;

const chartData = [...TIERS]
  .reverse()
  .map(({ name, count }) => ({ name, share: (count / TOTAL) * 100 }));

const count = (value: number) => value.toLocaleString("en-US");

export function EChartsCacheTiersRadialChart() {
  return (
    <div className="flex h-full w-full flex-col gap-3 p-4">
      <div className="flex min-h-0 flex-1 flex-col gap-4 sm:flex-row">
        <div className="relative -mb-10 min-h-0 flex-1">
          <EChartsRadialChart
            data={chartData}
            config={chartConfig}
            nameKey="name"
            variant="semi"
            max={100}
            innerRadius="38%"
            outerRadius="96%"
            className="h-full w-full"
          >
            <EChartsRadialChart.RadialBar dataKey="share" barSize={13} cornerRadius={7} />
          </EChartsRadialChart>
        </div>

        <div className="grid shrink-0 grid-cols-2 content-center gap-x-4 gap-y-5 sm:w-[40%] sm:max-w-64">
          {STATS.map(({ name, label, value }) => (
            <div key={name} className="flex flex-col gap-1">
              <span className="text-muted-foreground truncate text-xs sm:text-sm">{label}</span>
              <span className="text-primary text-lg leading-none font-medium tabular-nums sm:text-xl">
                {count(value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-3 border-t pt-3 sm:grid-cols-4">
        {TIERS.map(({ name, label, count: hits, swatch }) => (
          <div key={name} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className={cn("size-2.5 shrink-0 rounded-[3px]", swatch)} />
              <span className="text-primary truncate text-xs">{label}</span>
            </div>
            <span className="text-muted-foreground text-xs tabular-nums">
              {count(hits)}/{count(TOTAL)} ({Math.round((hits / TOTAL) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

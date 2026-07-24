"use client";

import { EChartsPieChart, type ChartConfig } from "@/registry/charts/echarts-pie-chart";
import { cn } from "@/lib/utils";

const chartData = [
  {
    channel: "direct",
    label: "Direct",
    value: 52400,
    swatch: "bg-[#7c3aed] dark:bg-[#a78bfa]",
  },
  {
    channel: "marketplace",
    label: "Marketplace",
    value: 38900,
    swatch: "bg-[#4f46e5] dark:bg-[#818cf8]",
  },
  {
    channel: "wholesale",
    label: "Wholesale",
    value: 24150,
    swatch: "bg-[#0284c7] dark:bg-[#38bdf8]",
  },
  {
    channel: "affiliate",
    label: "Affiliate",
    value: 16300,
    swatch: "bg-[#059669] dark:bg-[#34d399]",
  },
];

const chartConfig = {
  direct: {
    label: "Direct",
    colors: { light: ["#7c3aed", "#a855f7"], dark: ["#a78bfa", "#c4b5fd"] },
  },
  marketplace: {
    label: "Marketplace",
    colors: { light: ["#4f46e5", "#6366f1"], dark: ["#818cf8", "#a5b4fc"] },
  },
  wholesale: {
    label: "Wholesale",
    colors: { light: ["#0284c7", "#0ea5e9"], dark: ["#38bdf8", "#7dd3fc"] },
  },
  affiliate: {
    label: "Affiliate",
    colors: { light: ["#059669", "#10b981"], dark: ["#34d399", "#6ee7b7"] },
  },
} satisfies ChartConfig;

const ORDERS = 1284;

const money = (value: number) => value.toLocaleString("en-US");

export function EChartsRevenueMixPieChart() {
  return (
    <div className="flex h-full w-full items-center gap-3 p-4 sm:gap-6">
      <div className="relative aspect-square w-[40%] max-w-72 shrink-0">
        <EChartsPieChart
          data={chartData}
          config={chartConfig}
          dataKey="value"
          nameKey="channel"
          className="h-full w-full"
        >
          <EChartsPieChart.Tooltip />
          <EChartsPieChart.Pie
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={6}
            cornerRadius={12}
            startAngle={90}
            endAngle={-270}
          />
        </EChartsPieChart>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="border-border flex aspect-square w-[56%] flex-col items-center justify-center rounded-full border border-dashed">
            <span className="text-primary text-lg leading-none font-semibold tracking-tight sm:text-2xl">
              {money(ORDERS)}
            </span>
            <span className="text-muted-foreground mt-1 text-[10px] sm:text-xs">Total orders</span>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center">
        {chartData.map(({ channel, label, value, swatch }) => (
          <div key={channel} className="flex items-center gap-2 py-1.5 sm:py-2">
            <span className={cn("size-2.5 shrink-0 rounded-[3px]", swatch)} />
            <span className="text-muted-foreground truncate text-xs">{label}</span>
            <span className="text-primary ml-auto text-xs font-semibold">${money(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { EChartsLineChart, type ChartConfig } from "@/registry/charts/echarts-line-chart";
import { cn } from "@/lib/utils";

const chartData = [
  { month: "Jan", payouts: 312, pending: 548 },
  { month: "Feb", payouts: 388, pending: 502 },
  { month: "Mar", payouts: 342, pending: 561 },
  { month: "Apr", payouts: 455, pending: 470 },
  { month: "May", payouts: 521, pending: 398 },
  { month: "Jun", payouts: 486, pending: 441 },
  { month: "Jul", payouts: 573, pending: 372 },
  { month: "Aug", payouts: 640, pending: 316 },
  { month: "Sep", payouts: 598, pending: 358 },
  { month: "Oct", payouts: 662, pending: 284 },
  { month: "Nov", payouts: 617, pending: 331 },
  { month: "Dec", payouts: 690, pending: 262 },
];

const chartConfig = {
  payouts: {
    label: "Payouts",
    colors: {
      light: ["#f97316", "#ec4899"],
      dark: ["#fb923c", "#f472b6"],
    },
  },
  pending: {
    label: "Pending",
    colors: {
      light: ["#0891b2", "#7c3aed"],
      dark: ["#22d3ee", "#a78bfa"],
    },
  },
} satisfies ChartConfig;

const STATS = [
  {
    key: "month",
    label: "Monthly",
    value: "$12,480",
    delta: "+8.4%",
    sub: "11,512 last month",
    swatch: "bg-[#f97316] dark:bg-[#fb923c]",
  },
  {
    key: "year",
    label: "Yearly",
    value: "$164,320",
    delta: "+3.1%",
    sub: "159,380 last year",
    swatch: "bg-[#ec4899] dark:bg-[#f472b6]",
  },
];

const CITIES = [
  { city: "Berlin", amount: "84,210" },
  { city: "Toronto", amount: "61,940" },
];

export function EChartsPayoutsLineChart() {
  return (
    <div className="flex h-full w-full flex-col px-3 pt-2 pb-1 sm:px-4 sm:pt-4 sm:pb-2">
      <div className="min-h-24 w-full flex-1 sm:min-h-0">
        <EChartsLineChart
          data={chartData}
          config={chartConfig}
          xDataKey="month"
          className="h-full w-full"
          curveType="monotone"
        >
          <EChartsLineChart.Grid />
          <EChartsLineChart.YAxis />
          <EChartsLineChart.Tooltip variant="frosted-glass" />
          <EChartsLineChart.Line dataKey="payouts" strokeVariant="solid" strokeWidth={2} glowing>
            <EChartsLineChart.ActiveDot variant="ping" />
          </EChartsLineChart.Line>
          <EChartsLineChart.Line dataKey="pending" strokeVariant="solid" strokeWidth={2} glowing>
            <EChartsLineChart.ActiveDot variant="ping" />
          </EChartsLineChart.Line>
        </EChartsLineChart>
      </div>

      <div className="mt-2 grid shrink-0 grid-cols-2 gap-3 sm:mt-3 sm:gap-4">
        {STATS.map(({ key, label, value, delta, sub, swatch }) => (
          <div key={key} className="flex flex-col gap-0.5">
            <span className="text-primary flex items-center gap-1.5 text-[10px] leading-3.5 font-medium sm:text-[11px] sm:leading-normal">
              <span className={cn("size-2 shrink-0 rounded-[3px]", swatch)} />
              {label}
            </span>
            <span className="text-primary text-xl leading-6 font-semibold tracking-tight sm:text-2xl sm:leading-8">
              {value}
            </span>
            <span className="flex items-center gap-1.5 text-[10px] leading-3.5 sm:text-[11px] sm:leading-normal">
              <span className="font-medium text-emerald-500">{delta}</span>
              <span className="text-muted-foreground">{sub}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-2 shrink-0 sm:mt-3">
        {CITIES.map(({ city, amount }, i) => (
          <div
            key={city}
            className={cn(
              "border-border flex items-center justify-between py-1 text-xs sm:py-1.5 sm:text-sm",
              i > 0 && "border-t",
            )}
          >
            <span className="text-muted-foreground">{city}</span>
            <span className="text-primary font-medium">{amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

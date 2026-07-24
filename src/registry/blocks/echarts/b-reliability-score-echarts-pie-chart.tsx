"use client";

import { EChartsPieChart, type ChartConfig } from "@/registry/charts/echarts-pie-chart";
import { cn } from "@/lib/utils";

const MAX = 1000;
const SCORE = 842;
const START_ANGLE = 210;

const chartData = [
  { band: "atrisk", label: "At risk", from: 0, value: 450, bar: "bg-[#e11d48] dark:bg-[#fb7185]" },
  { band: "fair", label: "Fair", from: 450, value: 200, bar: "bg-[#f59e0b] dark:bg-[#fbbf24]" },
  { band: "good", label: "Good", from: 650, value: 170, bar: "bg-[#84cc16] dark:bg-[#a3e635]" },
  {
    band: "excellent",
    label: "Excellent",
    from: 820,
    value: 180,
    bar: "bg-[#059669] dark:bg-[#34d399]",
  },
];

const chartConfig = {
  atrisk: { label: "At risk", colors: { light: ["#e11d48"], dark: ["#fb7185"] } },
  fair: { label: "Fair", colors: { light: ["#f59e0b"], dark: ["#fbbf24"] } },
  good: { label: "Good", colors: { light: ["#84cc16"], dark: ["#a3e635"] } },
  excellent: { label: "Excellent", colors: { light: ["#059669"], dark: ["#34d399"] } },
} satisfies ChartConfig;

const BAND = [...chartData].reverse().find(({ from }) => SCORE >= from) ?? chartData[0];

export function EChartsReliabilityScorePieChart() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <span className="text-primary text-base font-medium tracking-tight sm:text-lg">
        Delivery Reliability
      </span>

      <div className="relative mx-auto mt-1 aspect-square w-full max-w-50 shrink-0">
        <EChartsPieChart
          data={[...chartData].reverse()}
          config={chartConfig}
          dataKey="value"
          nameKey="band"
          className="h-full w-full"
        >
          <EChartsPieChart.Pie
            innerRadius="74%"
            outerRadius="94%"
            paddingAngle={6}
            cornerRadius={10}
            startAngle={-30}
            endAngle={START_ANGLE}
          />
        </EChartsPieChart>

        <svg
          viewBox="0 0 100 100"
          className="text-muted-foreground/50 pointer-events-none absolute inset-0"
          aria-hidden
        >
          <path
            d="M 23.15 65.5 A 31 31 0 1 1 76.85 65.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="0.1 5"
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-primary text-3xl font-semibold tracking-tight sm:text-4xl">
            {SCORE}
          </span>
        </div>
      </div>

      <div className="-mt-6 text-center">
        <p className="text-primary text-xs font-medium sm:text-sm">
          Reliability is {BAND.label.toLowerCase()}
        </p>
        <p className="text-muted-foreground text-[10px] sm:text-xs">Updated 12 Mar 2026</p>
      </div>

      <div className="mt-auto shrink-0 pt-2">
        <div className="text-muted-foreground flex text-[10px]">
          {chartData.map(({ band, from, value }) => (
            <span key={band} style={{ flexGrow: value, flexBasis: 0 }}>
              {from}
            </span>
          ))}
          <span>{MAX}</span>
        </div>
        <div className="mt-1 flex gap-1">
          {chartData.map(({ band, bar, value }) => (
            <span
              key={band}
              className={cn("h-1.5 rounded-full", bar)}
              style={{ flexGrow: value, flexBasis: 0 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

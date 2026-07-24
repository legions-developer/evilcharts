"use client";

import { EChartsAreaChart, type ChartConfig } from "@/registry/charts/echarts-area-chart";

const SERIES = [
  { key: "robinhood", label: "Robinhood", color: "#c3f000", pct: -4.41, delta: -2377.66 },
  { key: "coinbase", label: "Coinbase", color: "#2f6bff", pct: 1.15, delta: 617.22 },
] as const;

// A month of daily portfolio values — Robinhood peaks early then drifts down,
// Coinbase dips to a mid-month trough then rallies past it (the crossover the
// card highlights). Gentle point-to-point moves keep the smoothed curve clean.
const chartData = [
  { date: "Dec 22", robinhood: 53916, coinbase: 53670 },
  { date: "Dec 23", robinhood: 54380, coinbase: 53080 },
  { date: "Dec 24", robinhood: 54760, coinbase: 52460 },
  { date: "Dec 25", robinhood: 54480, coinbase: 51880 },
  { date: "Dec 26", robinhood: 54060, coinbase: 51340 },
  { date: "Dec 27", robinhood: 53820, coinbase: 50900 },
  { date: "Dec 28", robinhood: 53520, coinbase: 50520 },
  { date: "Dec 29", robinhood: 53240, coinbase: 50200 },
  { date: "Dec 30", robinhood: 53080, coinbase: 49960 },
  { date: "Dec 31", robinhood: 52840, coinbase: 49760 },
  { date: "Jan 1", robinhood: 52700, coinbase: 49640 },
  { date: "Jan 2", robinhood: 52520, coinbase: 49600 },
  { date: "Jan 3", robinhood: 52420, coinbase: 49720 },
  { date: "Jan 4", robinhood: 52340, coinbase: 49980 },
  { date: "Jan 5", robinhood: 52240, coinbase: 50360 },
  { date: "Jan 6", robinhood: 52140, coinbase: 50820 },
  { date: "Jan 7", robinhood: 52080, coinbase: 51340 },
  { date: "Jan 8", robinhood: 52020, coinbase: 51900 },
  { date: "Jan 9", robinhood: 51960, coinbase: 52440 },
  { date: "Jan 10", robinhood: 51900, coinbase: 52960 },
  { date: "Jan 11", robinhood: 51860, coinbase: 53420 },
  { date: "Jan 12", robinhood: 51800, coinbase: 53780 },
  { date: "Jan 13", robinhood: 51740, coinbase: 54040 },
  { date: "Jan 14", robinhood: 51700, coinbase: 54200 },
  { date: "Jan 15", robinhood: 51640, coinbase: 54300 },
  { date: "Jan 16", robinhood: 51580, coinbase: 54320 },
  { date: "Jan 17", robinhood: 51538, coinbase: 54287 },
];

const chartConfig = {
  robinhood: { label: "Robinhood", colors: { light: ["#a6cc00"], dark: ["#c3f000"] } },
  coinbase: { label: "Coinbase", colors: { light: ["#2f6bff"], dark: ["#4c86ff"] } },
} satisfies ChartConfig;

const money = (value: number) =>
  Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function EChartsPortfolioAreaChart() {
  return (
    <div className="flex h-full w-full flex-col pt-4">
      <div className="grid grid-cols-2 gap-x-8 px-4">
        {SERIES.map(({ key, label, color, pct, delta }) => (
          <div key={key} className="flex flex-col gap-1">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <span
                className="size-3 shrink-0 rounded-full border-2"
                style={{ borderColor: color }}
              />
              {label}
            </div>
            <div className="text-primary text-2xl font-semibold tracking-tight sm:text-3xl">
              {pct > 0 ? "+" : "−"}
              {Math.abs(pct).toFixed(2)}%
            </div>
            <div className={delta < 0 ? "text-rose-500" : "text-emerald-500"}>
              {delta < 0 ? "−" : "+"}${money(delta)}
            </div>
          </div>
        ))}
      </div>

      <EChartsAreaChart
        data={chartData}
        config={chartConfig}
        xDataKey="date"
        className="mt-4 min-h-0 w-full flex-1"
        curveType="step"
        enableHoverReveal
        chartOptions={{
          grid: { left: 0, right: 0, top: 16, bottom: 0 },
          yAxis: { type: "value", show: false, scale: true, boundaryGap: ["12%", "16%"] },
        }}
      >
        <EChartsAreaChart.Tooltip variant="frosted-glass" />
        <EChartsAreaChart.Area dataKey="robinhood" variant="dotted" strokeVariant="solid">
          <EChartsAreaChart.ActiveDot variant="ping" />
        </EChartsAreaChart.Area>
        <EChartsAreaChart.Area dataKey="coinbase" variant="dotted" strokeVariant="solid">
          <EChartsAreaChart.ActiveDot variant="ping" />
        </EChartsAreaChart.Area>
      </EChartsAreaChart>
    </div>
  );
}

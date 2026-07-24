"use client";

import { EChartsBarChart, type ChartConfig } from "@/registry/charts/echarts-bar-chart";
import { cn } from "@/lib/utils";

const chartData = [
  { week: "W01", organic: 128, paid: 74 },
  { week: "W02", organic: 164, paid: 91 },
  { week: "W03", organic: 142, paid: 66 },
  { week: "W04", organic: 199, paid: 108 },
  { week: "W05", organic: 176, paid: 84 },
  { week: "W06", organic: 231, paid: 167 },
  { week: "W07", organic: 208, paid: 96 },
  { week: "W08", organic: 287, paid: 158 },
  { week: "W09", organic: 244, paid: 112 },
  { week: "W10", organic: 196, paid: 88 },
  { week: "W11", organic: 221, paid: 103 },
  { week: "W12", organic: 173, paid: 79 },
];

const chartConfig = {
  organic: { label: "Organic", colors: { light: ["#7c3aed"], dark: ["#a78bfa"] } },
  paid: { label: "Paid", colors: { light: ["#0891b2"], dark: ["#22d3ee"] } },
} satisfies ChartConfig;

const LEGEND = [
  { key: "organic", label: "Organic", swatch: "bg-[#7c3aed] dark:bg-[#a78bfa]" },
  { key: "paid", label: "Paid", swatch: "bg-[#0891b2] dark:bg-[#22d3ee]" },
];

const PEAK = chartData.reduce(
  (best, row) => (row.organic + row.paid > best.organic + best.paid ? row : best),
  chartData[0],
);
const PEAK_TOTAL = PEAK.organic + PEAK.paid;

export function EChartsPeakBarChart() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Best week</span>
          <div className="flex items-baseline gap-2">
            <span className="text-primary text-2xl font-semibold tracking-tight sm:text-3xl">
              {PEAK_TOTAL}
            </span>
            <span className="text-muted-foreground text-sm">signups in {PEAK.week}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5 pt-1">
          {LEGEND.map(({ key, label, swatch }) => (
            <span
              key={key}
              className="text-muted-foreground flex items-center gap-2 text-[11px] sm:text-xs"
            >
              <span className={cn("size-2.5 shrink-0 rounded-[3px]", swatch)} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 min-h-0 w-full flex-1">
        <EChartsBarChart
          data={chartData}
          config={chartConfig}
          xDataKey="week"
          className="h-full w-full"
          stackType="stacked"
          enableMaxValueHighlight
        >
          <EChartsBarChart.XAxis dataKey="week" hideDots />
          <EChartsBarChart.Tooltip />
          <EChartsBarChart.Bar dataKey="paid" radius={6} />
          <EChartsBarChart.Bar dataKey="organic" radius={6} />
        </EChartsBarChart>
      </div>
    </div>
  );
}

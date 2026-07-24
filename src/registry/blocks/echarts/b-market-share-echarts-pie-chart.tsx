"use client";

import { EChartsPieChart, type ChartConfig } from "@/registry/charts/echarts-pie-chart";
import { cn } from "@/lib/utils";
import { useState } from "react";

const SERIES = [
  { key: "quicksync", label: "QuickSync", value: 26, swatch: "bg-[#0a0a0a] dark:bg-[#ffffff]" },
  { key: "datapulse", label: "DataPulse", value: 22, swatch: "bg-[#262626] dark:bg-[#dedede]" },
  { key: "cloudnest", label: "CloudNest", value: 12, swatch: "bg-[#3d3d3d] dark:bg-[#bebebe]" },
  { key: "taskflow", label: "TaskFlow", value: 22, swatch: "bg-[#545454] dark:bg-[#a0a0a0]" },
  { key: "insighthub", label: "InsightHub", value: 7, swatch: "bg-[#6b6b6b] dark:bg-[#868686]" },
  {
    key: "streamlinepro",
    label: "StreamlinePro",
    value: 11,
    swatch: "bg-[#7d7d7d] dark:bg-[#6f6f6f]",
  },
] as const;

const chartData = [...SERIES].reverse().map(({ key, value }) => ({
  product: key,
  value,
  share: `${value}%`,
}));

const chartConfig = {
  quicksync: { label: "QuickSync", colors: { light: ["#0a0a0a"], dark: ["#ffffff"] } },
  datapulse: { label: "DataPulse", colors: { light: ["#262626"], dark: ["#dedede"] } },
  cloudnest: { label: "CloudNest", colors: { light: ["#3d3d3d"], dark: ["#bebebe"] } },
  taskflow: { label: "TaskFlow", colors: { light: ["#545454"], dark: ["#a0a0a0"] } },
  insighthub: { label: "InsightHub", colors: { light: ["#6b6b6b"], dark: ["#868686"] } },
  streamlinepro: { label: "StreamlinePro", colors: { light: ["#7d7d7d"], dark: ["#6f6f6f"] } },
} satisfies ChartConfig;

const TOTAL = SERIES.reduce((sum, { value }) => sum + value, 0);

export function EChartsMarketSharePieChart() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="relative min-h-0 w-full flex-1">
        <EChartsPieChart
          data={chartData}
          config={chartConfig}
          dataKey="value"
          nameKey="product"
          className="h-full w-full"
          selectedSector={selected}
          onSelectionChange={(selection) => setSelected(selection?.dataKey ?? null)}
        >
          <EChartsPieChart.Tooltip />
          <EChartsPieChart.Pie
            isClickable
            innerRadius="52%"
            outerRadius="94%"
            paddingAngle={3}
            startAngle={90}
            endAngle={-270}
          >
            <EChartsPieChart.Label dataKey="share" />
          </EChartsPieChart.Pie>
        </EChartsPieChart>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="text-primary text-xl font-semibold tracking-tight sm:text-3xl">
            ${TOTAL}B
          </span>
          <span className="text-muted-foreground text-[10px] sm:text-xs">Ecosystem value</span>
        </div>
      </div>

      <div className="border-border mt-3 grid grid-flow-col grid-cols-2 grid-rows-3 gap-x-6 gap-y-1.5 border-t pt-3">
        {SERIES.map(({ key, label, value, swatch }) => (
          <button
            key={key}
            type="button"
            aria-pressed={selected === key}
            onClick={() => setSelected((prev) => (prev === key ? null : key))}
            className={cn(
              "flex cursor-pointer items-center gap-2 text-left text-xs transition-opacity",
              selected !== null && selected !== key && "opacity-40",
            )}
          >
            <span className={cn("size-3 shrink-0 rounded-[3px]", swatch)} />
            <span className="text-primary font-medium">{label}</span>
            <span className="text-muted-foreground">${value}B</span>
            <span className="text-muted-foreground/60">({value}%)</span>
          </button>
        ))}
      </div>
    </div>
  );
}

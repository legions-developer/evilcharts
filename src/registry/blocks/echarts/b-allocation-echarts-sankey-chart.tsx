"use client";

import { EChartsSankeyChart, type ChartConfig } from "@/registry/charts/echarts-sankey-chart";
import { cn } from "@/lib/utils";

const chartData = {
  nodes: [
    { name: "Inflow" },
    { name: "Equities" },
    { name: "Bonds" },
    { name: "Cash" },
    { name: "Growth" },
    { name: "Income" },
    { name: "Reserve" },
  ],
  links: [
    { source: 0, target: 1, value: 78 },
    { source: 0, target: 2, value: 46 },
    { source: 0, target: 3, value: 24 },
    { source: 1, target: 4, value: 52 },
    { source: 1, target: 5, value: 26 },
    { source: 2, target: 5, value: 19 },
    { source: 2, target: 6, value: 27 },
    { source: 3, target: 4, value: 9 },
    { source: 3, target: 6, value: 15 },
  ],
};

const chartConfig = {
  Inflow: { label: "Inflow", colors: { light: ["#0d9488"], dark: ["#2dd4bf"] } },
  Equities: { label: "Equities", colors: { light: ["#d97706"], dark: ["#fbbf24"] } },
  Bonds: { label: "Bonds", colors: { light: ["#ea580c"], dark: ["#fb923c"] } },
  Cash: { label: "Cash", colors: { light: ["#b45309"], dark: ["#f59e0b"] } },
  Growth: { label: "Growth", colors: { light: ["#7c3aed"], dark: ["#a78bfa"] } },
  Income: { label: "Income", colors: { light: ["#6d28d9"], dark: ["#8b5cf6"] } },
  Reserve: { label: "Reserve", colors: { light: ["#4f46e5"], dark: ["#818cf8"] } },
} satisfies ChartConfig;

const STATS = [
  { key: "positions", label: "Open positions", value: "204" },
  { key: "aum", label: "Assets under management", value: "$65,430" },
  { key: "hedged", label: "Hedged", value: "87%" },
];

export function EChartsAllocationSankeyChart() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-primary text-base font-medium tracking-tight sm:text-lg">
          Where the fund flows
        </span>
        <span className="text-muted-foreground text-xs">Quarter to date</span>
      </div>

      <div className="mt-2 min-h-0 w-full flex-1">
        <EChartsSankeyChart
          data={chartData}
          config={chartConfig}
          className="h-full w-full"
          nodeWidth={92}
          nodePadding={12}
          linkCurvature={0.55}
        >
          <EChartsSankeyChart.Tooltip variant="frosted-glass" />
          <EChartsSankeyChart.Link variant="gradient" />
          <EChartsSankeyChart.Node radius={6}>
            <EChartsSankeyChart.NodeLabel
              position="inside"
              showValues
              valueFormatter={(value) => `$${(value * 1000).toLocaleString("en-US")}`}
            />
          </EChartsSankeyChart.Node>
        </EChartsSankeyChart>
      </div>

      <div className="mt-3 grid shrink-0 grid-cols-3 gap-4">
        {STATS.map(({ key, label, value }, i) => (
          <div
            key={key}
            className={cn(
              "flex flex-col gap-0.5",
              i === 1 && "items-center text-center",
              i === STATS.length - 1 && "items-end text-right",
            )}
          >
            <span className="text-muted-foreground truncate text-[10px] tracking-wide uppercase sm:text-[11px]">
              {label}
            </span>
            <span className="text-primary text-lg font-semibold tracking-tight sm:text-2xl">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

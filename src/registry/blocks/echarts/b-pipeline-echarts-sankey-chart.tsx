"use client";

import { EChartsSankeyChart, type ChartConfig } from "@/registry/charts/echarts-sankey-chart";

const chartData = {
  nodes: [
    { name: "Retail" },
    { name: "Wholesale" },
    { name: "Licensing" },
    { name: "Services" },
    { name: "Pipeline" },
    { name: "Expansion" },
    { name: "Tooling" },
    { name: "Support" },
    { name: "Reserve" },
  ],
  links: [
    { source: 0, target: 4, value: 31480 },
    { source: 1, target: 4, value: 46220 },
    { source: 2, target: 4, value: 14960 },
    { source: 3, target: 4, value: 28340 },
    { source: 4, target: 5, value: 52640 },
    { source: 4, target: 6, value: 9180 },
    { source: 4, target: 7, value: 12470 },
    { source: 4, target: 8, value: 46710 },
  ],
};

const chartConfig = {
  Retail: { label: "Retail", colors: { light: ["#1d4ed8"], dark: ["#3b82f6"] } },
  Wholesale: { label: "Wholesale", colors: { light: ["#2563eb"], dark: ["#60a5fa"] } },
  Licensing: { label: "Licensing", colors: { light: ["#4338ca"], dark: ["#6366f1"] } },
  Services: { label: "Services", colors: { light: ["#4f46e5"], dark: ["#818cf8"] } },
  // The hub is a waist, not a category: no label, and a mid tone so the bands
  // read blue -> violet -> red straight across instead of fading out at centre.
  Pipeline: { label: "", colors: { light: ["#6d28d9"], dark: ["#8b5cf6"] } },
  Expansion: { label: "Expansion", colors: { light: ["#be123c"], dark: ["#f43f5e"] } },
  Tooling: { label: "Tooling", colors: { light: ["#c2410c"], dark: ["#fb923c"] } },
  Support: { label: "Support", colors: { light: ["#9f1239"], dark: ["#fb7185"] } },
  Reserve: { label: "Reserve", colors: { light: ["#b91c1c"], dark: ["#ef4444"] } },
} satisfies ChartConfig;

const TOTAL = chartData.links
  .filter((link) => link.target === 4)
  .reduce((sum, link) => sum + link.value, 0);

export function EChartsPipelineSankeyChart() {
  return (
    <div className="relative h-full w-full p-4">
      <EChartsSankeyChart
        data={chartData}
        config={chartConfig}
        className="h-full w-full"
        nodeWidth={10}
        nodePadding={18}
        linkCurvature={0.55}
      >
        <EChartsSankeyChart.Tooltip variant="frosted-glass" />
        <EChartsSankeyChart.Link variant="gradient" />
        <EChartsSankeyChart.Node radius={5}>
          <EChartsSankeyChart.NodeLabel
            position="outside"
            showValues
            valueFormatter={(value) => `$${value.toLocaleString("en-US")}`}
          />
        </EChartsSankeyChart.Node>
      </EChartsSankeyChart>

      <div className="pointer-events-none absolute inset-0 flex items-stretch justify-center">
        <div className="flex h-full flex-col items-center justify-center bg-[linear-gradient(to_right,transparent_0%,var(--background)_32%,var(--background)_68%,transparent_100%)] px-14">
          <span className="text-muted-foreground text-[11px] sm:text-xs">Total booked</span>
          <span className="text-primary text-2xl leading-none font-semibold tracking-tight sm:text-4xl">
            ${TOTAL.toLocaleString("en-US")}
          </span>
          <span className="text-muted-foreground mt-1 text-[11px] sm:text-xs">
            4 sources &middot; 4 routes
          </span>
        </div>
      </div>
    </div>
  );
}

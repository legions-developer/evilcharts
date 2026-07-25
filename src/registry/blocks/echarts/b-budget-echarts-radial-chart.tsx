"use client";

import { EChartsRadialChart, type ChartConfig } from "@/registry/charts/echarts-radial-chart";
import { cn } from "@/lib/utils";

const chartData = [
  {
    name: "payroll",
    label: "Payroll",
    value: 46,
    amount: 920000,
    swatch: "bg-[#d97706] dark:bg-[#fbbf24]",
  },
  {
    name: "infrastructure",
    label: "Infrastructure",
    value: 21,
    amount: 420000,
    swatch: "bg-[#2563eb] dark:bg-[#60a5fa]",
  },
  {
    name: "marketing",
    label: "Marketing",
    value: 14,
    amount: 280000,
    swatch: "bg-[#e11d48] dark:bg-[#fb7185]",
  },
  {
    name: "tooling",
    label: "Tooling",
    value: 10,
    amount: 200000,
    swatch: "bg-[#475569] dark:bg-[#94a3b8]",
  },
  {
    name: "support",
    label: "Support",
    value: 9,
    amount: 180000,
    swatch: "bg-[#0d9488] dark:bg-[#2dd4bf]",
  },
];

const chartConfig = {
  payroll: { label: "Payroll", colors: { light: ["#d97706"], dark: ["#fbbf24"] } },
  infrastructure: { label: "Infrastructure", colors: { light: ["#2563eb"], dark: ["#60a5fa"] } },
  marketing: { label: "Marketing", colors: { light: ["#e11d48"], dark: ["#fb7185"] } },
  tooling: { label: "Tooling", colors: { light: ["#475569"], dark: ["#94a3b8"] } },
  support: { label: "Support", colors: { light: ["#0d9488"], dark: ["#2dd4bf"] } },
} satisfies ChartConfig;

const TOTAL = chartData.reduce((sum, { amount }) => sum + amount, 0);

const money = (value: number) => value.toLocaleString("en-US");

export function EChartsBudgetRadialChart() {
  return (
    <div className="flex h-full w-full flex-col gap-6 p-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-primary text-base font-medium tracking-tight sm:text-lg">
          Quarterly Spend
        </span>
        <span className="text-muted-foreground text-xs">${money(TOTAL)}</span>
      </div>

      <div className="grid shrink-0 grid-cols-5 gap-2">
        {chartData.map((row) => (
          <div key={row.name} className="flex flex-col items-center gap-1">
            <div className="aspect-square w-full max-w-14">
              <EChartsRadialChart
                data={[row]}
                config={chartConfig}
                nameKey="name"
                max={100}
                innerRadius="66%"
                outerRadius="100%"
                className="h-full w-full"
              >
                <EChartsRadialChart.RadialBar dataKey="value" barSize={8} cornerRadius={6} />
              </EChartsRadialChart>
            </div>
            <span className="text-muted-foreground w-full truncate text-center text-[10px] sm:text-[11px]">
              {row.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {chartData.map(({ name, label, value, amount, swatch }) => (
          <div
            key={name}
            className="odd:bg-muted/30 flex flex-1 items-center gap-2 rounded-md px-3"
          >
            <span className={cn("size-2.5 shrink-0 rounded-[3px]", swatch)} />
            <span className="text-primary text-xs font-medium tabular-nums">{value}%</span>
            <span className="text-muted-foreground truncate text-xs">{label}</span>
            <span className="text-primary ml-auto text-xs font-medium">${money(amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

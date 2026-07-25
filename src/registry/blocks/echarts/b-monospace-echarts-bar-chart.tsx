"use client";

import { EChartsBarChart, type ChartConfig } from "@/registry/charts/echarts-bar-chart";

const chartData = [
  { month: "Jan '24", sales: 342 },
  { month: "Feb '24", sales: 876 },
  { month: "Mar '24", sales: 512 },
  { month: "Apr '24", sales: 629 },
  { month: "May '24", sales: 458 },
  { month: "Jun '24", sales: 781 },
  { month: "Jul '24", sales: 394 },
  { month: "Aug '24", sales: 925 },
  { month: "Sep '24", sales: 647 },
  { month: "Oct '24", sales: 532 },
  { month: "Nov '24", sales: 803 },
  { month: "Dec '24", sales: 271 },
  { month: "Jan '25", sales: 388 },
  { month: "Feb '25", sales: 912 },
  { month: "Mar '25", sales: 564 },
  { month: "Apr '25", sales: 671 },
  { month: "May '25", sales: 499 },
  { month: "Jun '25", sales: 838 },
  { month: "Jul '25", sales: 427 },
  { month: "Aug '25", sales: 968 },
  { month: "Sep '25", sales: 702 },
  { month: "Oct '25", sales: 585 },
  { month: "Nov '25", sales: 861 },
  { month: "Dec '25", sales: 314 },
];

const chartConfig = {
  sales: {
    label: "Sales",
    colors: {
      light: ["#18181b"],
      dark: ["#fafafa"],
    },
  },
} satisfies ChartConfig;

const TOTAL = chartData.reduce((sum, { sales }) => sum + sales, 0);
const TOP = chartData.reduce((max, row) => (row.sales > max.sales ? row : max), chartData[0]);

export function EChartsMonospaceBarChart() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row">
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs">{"[$] Total Sales"}</span>
            <span className="text-primary font-mono text-3xl">
              <span className="text-muted-foreground text-xl font-normal">$</span>
              <span className="tracking-tighter">{TOTAL.toLocaleString()}</span>
            </span>
          </div>
          <hr className="mx-4 h-full border-l border-dashed" />
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs">{"[⬆] Top Month"}</span>
            <span className="text-primary font-mono text-3xl tracking-tighter">{TOP.month}</span>
          </div>
        </div>
        <div className="flex flex-col justify-end gap-1">
          <span className="text-muted-foreground font-mono text-[10px]">
            {"// X-AXIS: "}
            <span className="text-primary">MONTHS</span>
          </span>
          <span className="text-muted-foreground font-mono text-[10px]">
            {"// Y-AXIS: "}
            <span className="text-primary">SALES</span>
          </span>
        </div>
      </div>

      <hr className="my-4 border-t border-dashed" />

      <div className="min-h-0 w-full flex-1">
        <EChartsBarChart
          data={chartData}
          config={chartConfig}
          xDataKey="month"
          className="h-full w-full"
        >
          <EChartsBarChart.XAxis
            dataKey="month"
            tickFormatter={(value) => value.slice(0, 3)}
            hideDots
          />
          <EChartsBarChart.Bar dataKey="sales" variant="expandable" />
        </EChartsBarChart>
      </div>
    </div>
  );
}

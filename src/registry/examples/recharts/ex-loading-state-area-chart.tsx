"use client";

import { EvilAreaChart } from "@/registry/charts/recharts-area-chart";
import { type ChartConfig } from "@/registry/ui/recharts-chart";

const chartConfig = {
  desktop: {
    label: "Desktop",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  mobile: {
    label: "Mobile",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function EvilExampleAreaChart() {
  return (
    <EvilAreaChart
      data={[]} // if isLoading is true, pass empty array → i.e isLoading ? [] : data
      config={chartConfig}
      className="h-full w-full p-4"
      isLoading={true} // [!code highlight]
      stackType="stacked"
      curveType="bump"
    >
      <EvilAreaChart.Grid />
      <EvilAreaChart.XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <EvilAreaChart.YAxis dataKey="desktop" />
      <EvilAreaChart.Legend isClickable />
      <EvilAreaChart.Tooltip />
      <EvilAreaChart.Area dataKey="desktop" variant="gradient" isClickable>
        <EvilAreaChart.ActiveDot variant="default" />
      </EvilAreaChart.Area>
      <EvilAreaChart.Area dataKey="mobile" variant="gradient" isClickable>
        <EvilAreaChart.ActiveDot variant="default" />
      </EvilAreaChart.Area>
    </EvilAreaChart>
  );
}

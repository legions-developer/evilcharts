"use client";

import {
  EvilAreaChart,
  Area,
  XAxis,
  YAxis,
  Grid,
  Tooltip,
  Legend,
  ActiveDot,
} from "@/registry/charts/recharts/area-chart";
import { type ChartConfig } from "@/registry/ui/recharts/chart";

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
      <Grid />
      <XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <YAxis dataKey="desktop" />
      <Legend isClickable />
      <Tooltip />
      <Area dataKey="desktop" variant="gradient" isClickable>
        <ActiveDot variant="default" />
      </Area>
      <Area dataKey="mobile" variant="gradient" isClickable>
        <ActiveDot variant="default" />
      </Area>
    </EvilAreaChart>
  );
}

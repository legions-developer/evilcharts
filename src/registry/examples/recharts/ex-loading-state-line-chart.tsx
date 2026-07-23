"use client";

import {
  EvilLineChart,
  Line,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  ActiveDot,
} from "@/registry/charts/recharts-line-chart";
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

export function EvilExampleLineChart() {
  return (
    <EvilLineChart
      data={[]} // if isLoading is true, pass empty array → i.e isLoading ? [] : data
      config={chartConfig}
      className="h-full w-full p-4"
      isLoading={true} // [!code highlight]
      curveType="bump"
    >
      <XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <YAxis dataKey="desktop" />
      <Legend isClickable />
      <Tooltip />
      <Line dataKey="desktop" strokeVariant="solid" isClickable>
        <ActiveDot variant="default" />
      </Line>
      <Line dataKey="mobile" strokeVariant="solid" isClickable>
        <ActiveDot variant="default" />
      </Line>
    </EvilLineChart>
  );
}

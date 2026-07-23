"use client";

import {
  EChartsComposedChart,
  Bar,
  Line,
  XAxis,
  Grid,
  Tooltip,
  Legend,
  type ChartConfig,
} from "@/registry/charts/echarts-composed-chart";

const data = [
  { month: "January", revenue: 4200, profit: 1800 },
  { month: "February", revenue: 5800, profit: 2400 },
  { month: "March", revenue: 4100, profit: 1600 },
  { month: "April", revenue: 6200, profit: 2800 },
  { month: "May", revenue: 5400, profit: 2200 },
  { month: "June", revenue: 7800, profit: 3400 },
  { month: "July", revenue: 6100, profit: 2600 },
  { month: "August", revenue: 8200, profit: 3800 },
  { month: "September", revenue: 5900, profit: 2500 },
  { month: "October", revenue: 6800, profit: 3000 },
  { month: "November", revenue: 7200, profit: 3200 },
  { month: "December", revenue: 9100, profit: 4200 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    colors: {
      light: ["#3b82f6"],
      dark: ["#6A5ACD"],
    },
  },
  profit: {
    label: "Profit",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
} satisfies ChartConfig;

export function EChartsExampleComposedChart() {
  return (
    <EChartsComposedChart
      className="h-full w-full p-4"
      xDataKey="month"
      data={data}
      config={chartConfig}
    >
      <Grid />
      <XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <Legend isClickable />
      <Tooltip />
      <Bar
        dataKey="revenue"
        variant="gradient" // [!code highlight]
        isClickable
      />
      <Line dataKey="profit" isClickable />
    </EChartsComposedChart>
  );
}

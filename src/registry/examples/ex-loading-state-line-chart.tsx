"use client";

import { EvilLineChart } from "@/registry/charts/line-chart";
import { type ChartConfig } from "@/registry/ui/chart";

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
      isClickable
      isLoading={true} // [!code highlight]
      className="h-full w-full p-4"
      curveType="bump"
      xDataKey="month"
      yDataKey="desktop"
      strokeVariant="solid"
      activeDotVariant="default"
      data={[]} // if isLoading is true, pass empty array → i.e isLoading ? [] : data
      chartConfig={chartConfig}
      xAxisProps={{ tickFormatter: (value) => value.substring(0, 3) }}
    />
  );
}

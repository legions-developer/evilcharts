"use client";

import { EvilAreaChart } from "@/registry/charts/area-chart";
import { type ChartConfig } from "@/registry/ui/chart";

const data = [
  { month: "January", desktop: 342, mobile: 245 },
  { month: "February", desktop: 876, mobile: 654 },
  { month: "March", desktop: 512, mobile: 387 },
  { month: "April", desktop: 629, mobile: 521 },
  { month: "May", desktop: 458, mobile: 412 },
  { month: "June", desktop: 781, mobile: 598 },
  { month: "July", desktop: 394, mobile: 312 },
  { month: "August", desktop: 925, mobile: 743 },
  { month: "September", desktop: 647, mobile: 489 },
  { month: "October", desktop: 532, mobile: 476 },
  { month: "November", desktop: 803, mobile: 687 },
  { month: "December", desktop: 271, mobile: 198 },
];

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
      isClickable
      className="h-full w-full p-4"
      xDataKey="month"
      yDataKey="desktop"
      stackType="stacked"
      strokeVariant="solid" // [!code highlight]
      areaVariant="gradient"
      activeDotVariant="default"
      data={data}
      chartConfig={chartConfig}
      xAxisProps={{ tickFormatter: (value) => value.substring(0, 3) }}
    />
  );
}

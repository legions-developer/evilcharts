"use client";

import { EvilLineChart } from "@/registry/charts/line-chart";
import { type ChartConfig } from "@/registry/ui/chart";

const data = [
  { month: "January", desktop: 342, mobile: 184 },
  { month: "February", desktop: 876, mobile: 491 },
  { month: "March", desktop: 512, mobile: 290 },
  { month: "April", desktop: 629, mobile: 391 },
  { month: "May", desktop: 458, mobile: 309 },
  { month: "June", desktop: 781, mobile: 449 },
  { month: "July", desktop: 394, mobile: 234 },
  { month: "August", desktop: 925, mobile: 557 },
  { month: "September", desktop: 647, mobile: 367 },
  { month: "October", desktop: 532, mobile: 357 },
  { month: "November", desktop: 803, mobile: 515 },
  { month: "December", desktop: 271, mobile: 149 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    colors: {
      light: ["red", "orange", "rosybrown", "purple", "blue"],
      dark: ["red", "orange", "rosybrown", "purple", "blue"],
    },
  },
  mobile: {
    label: "Mobile",
    colors: {
      light: ["gray"],
      dark: ["gray"],
    },
  },
} satisfies ChartConfig;

export function EvilExampleLineChart() {
  return (
    <EvilLineChart
      isClickable
      className="h-full w-full p-4"
      xDataKey="month"
      strokeVariant="solid"
      dotVariant="colored-border"
      activeDotVariant="default"
      glowingLines={["desktop"]} // [!code highlight]
      data={data}
      chartConfig={chartConfig}
      xAxisProps={{ tickFormatter: (value) => value.substring(0, 3) }}
    />
  );
}

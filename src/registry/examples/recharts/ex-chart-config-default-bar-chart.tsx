"use client";

import { EvilBarChart, Bar, XAxis, Grid, Tooltip, Legend } from "@/registry/charts/recharts/bar-chart";
import { type ChartConfig } from "@/registry/ui/recharts/chart";

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
    label: "Desktop", // [!code highlight]
    colors: {
      light: ["#047857"], // [!code highlight]
      dark: ["#10b981"], // [!code highlight]
    },
  },
  mobile: {
    label: "Mobile", // [!code highlight]
    colors: {
      light: ["#be123c"], // [!code highlight]
      dark: ["#f43f5e"], // [!code highlight]
    },
  },
} satisfies ChartConfig;

export function EvilExampleChartConfigDefaultBarChart() {
  return (
    <EvilBarChart data={data} config={chartConfig} className="h-full w-full p-4">
      <Grid />
      <XAxis dataKey="month" tickFormatter={(value: string) => value.substring(0, 3)} />
      <Legend />
      <Tooltip defaultIndex={4} />
      <Bar dataKey="desktop" variant="default" />
      <Bar dataKey="mobile" variant="default" />
    </EvilBarChart>
  );
}

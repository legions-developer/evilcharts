"use client";

import { EvilAreaChart } from "@/registry/charts/recharts-area-chart";
import { type ChartConfig } from "@/registry/ui/recharts-chart";

const data = [
  { date: "June 1", desktop: 412, mobile: 268 },
  { date: "June 2", desktop: 468, mobile: 301 },
  { date: "June 3", desktop: 501, mobile: 334 },
  { date: "June 4", desktop: 486, mobile: 312 },
  { date: "June 5", desktop: 523, mobile: 349 },
  { date: "June 6", desktop: 297, mobile: 198 },
  { date: "June 7", desktop: 264, mobile: 173 },
  { date: "June 8", desktop: 534, mobile: 356 },
  { date: "June 9", desktop: 578, mobile: 384 },
  { date: "June 10", desktop: 612, mobile: 402 },
  { date: "June 11", desktop: 596, mobile: 391 },
  { date: "June 12", desktop: 641, mobile: 428 },
  { date: "June 13", desktop: 351, mobile: 236 },
  { date: "June 14", desktop: 318, mobile: 211 },
  { date: "June 15", desktop: 663, mobile: 441 },
  { date: "June 16", desktop: 702, mobile: 467 },
  { date: "June 17", desktop: 688, mobile: 452 },
  { date: "June 18", desktop: 731, mobile: 489 },
  { date: "June 19", desktop: 754, mobile: 503 },
  { date: "June 20", desktop: 402, mobile: 271 },
  { date: "June 21", desktop: 376, mobile: 249 },
  { date: "June 22", desktop: 769, mobile: 512 },
  { date: "June 23", desktop: 812, mobile: 538 },
  { date: "June 24", desktop: 798, mobile: 524 },
  { date: "June 25", desktop: 843, mobile: 561 },
  { date: "June 26", desktop: 867, mobile: 579 },
  { date: "June 27", desktop: 451, mobile: 302 },
  { date: "June 28", desktop: 428, mobile: 287 },
  { date: "June 29", desktop: 881, mobile: 594 },
  { date: "June 30", desktop: 926, mobile: 618 },
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

export function EvilExampleBrushAreaChart() {
  return (
    <EvilAreaChart
      data={data}
      config={chartConfig}
      className="h-full w-full p-4"
      curveType="monotone"
      xDataKey="date"
    >
      <EvilAreaChart.Grid />
      <EvilAreaChart.XAxis dataKey="date" tickFormatter={(value) => value.split(" ")[1]} />
      <EvilAreaChart.Brush
        height={56} // [!code highlight]
        formatLabel={(value) => String(value)} // [!code highlight]
      />
      <EvilAreaChart.Legend isClickable />
      <EvilAreaChart.Tooltip />
      <EvilAreaChart.Area dataKey="desktop" variant="gradient" isClickable />
      <EvilAreaChart.Area dataKey="mobile" variant="gradient" isClickable />
    </EvilAreaChart>
  );
}

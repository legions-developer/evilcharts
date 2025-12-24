"use client";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

interface EvilAreaChartProps {
  chartConfig: ChartConfig;
  data: unknown[];
}

export function EvilAreaChart({ chartConfig, data }: EvilAreaChartProps) {
  return (
    <ChartContainer config={chartConfig}>
      <AreaChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <defs>
          <linearGradient id="gradient-chart-desktop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.5} />
            <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="gradient-chart-mobile" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.5} />
            <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <Area
          dataKey="mobile"
          fill="url(#gradient-chart-mobile)"
          fillOpacity={0.4}
          stroke="var(--color-mobile)"
          stackId="a"
          strokeWidth={0.8}
          strokeDasharray={"3 3"}
        />
        <Area
          dataKey="desktop"
          fill="url(#gradient-chart-desktop)"
          fillOpacity={0.4}
          stroke="var(--color-desktop)"
          stackId="a"
          strokeWidth={0.8}
          strokeDasharray={"3 3"}
        />
      </AreaChart>
    </ChartContainer>
  );
}

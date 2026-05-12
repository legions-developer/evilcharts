"use client";

import * as React from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { motion } from "motion/react";
import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";
import { ChartTooltip, ChartTooltipContent } from "@/registry/ui/tooltip";

const chartData = [
  { month: "January", revenue: 28 },
  { month: "February", revenue: 34 },
  { month: "March", revenue: 22 },
  { month: "April", revenue: 41 },
  { month: "May", revenue: 47 },
  { month: "June", revenue: 31 },
  { month: "July", revenue: 38 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    colors: {
      light: ["#18181b"],
      dark: ["#fafafa"],
    },
  },
} satisfies ChartConfig;

const DX = 14;
const DY = 14;

interface ShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  payload?: { month: string; revenue: number };
}

function IsoBar({
  x,
  y,
  width,
  height,
  index,
  payload,
  maxValue,
}: ShapeProps & { maxValue: number }) {
  const bx = Number(x ?? 0);
  const by = Number(y ?? 0);
  const bw = Number(width ?? 0);
  const bh = Number(height ?? 0);

  if (bh <= 0) return null;

  const highlight = payload?.revenue === maxValue;
  const topPoints = `${bx},${by} ${bx + bw},${by} ${bx + bw + DX},${by - DY} ${bx + DX},${by - DY}`;
  const rightPoints = `${bx + bw},${by} ${bx + bw + DX},${by - DY} ${bx + bw + DX},${by + bh - DY} ${bx + bw},${by + bh}`;

  const frontFill = highlight ? "url(#iso-front-accent)" : "url(#iso-front-base)";
  const topFill = highlight ? "url(#iso-top-accent)" : "url(#iso-top-base)";
  const rightFill = highlight ? "url(#iso-right-accent)" : "url(#iso-right-base)";
  const hatchFill = highlight ? "url(#iso-hatch-accent)" : "url(#iso-hatch-base)";

  return (
    <motion.g
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{
        duration: 0.7,
        delay: (index ?? 0) * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
    >
      <polygon points={rightPoints} fill={rightFill} />
      <polygon points={topPoints} fill={topFill} />
      <rect x={bx} y={by} width={bw} height={bh} fill={frontFill} />
      <rect x={bx} y={by} width={bw} height={bh} fill={hatchFill} />
      {highlight && (
        <rect x={bx} y={by} width={2} height={bh} fill="rgba(0,0,0,0.15)" />
      )}
    </motion.g>
  );
}

export function EvilIsometricBarChart() {
  const maxValue = React.useMemo(
    () => chartData.reduce((m, d) => (d.revenue > m ? d.revenue : m), 0),
    [],
  );
  const total = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const peak = chartData.find((d) => d.revenue === maxValue)!;

  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row">
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs">{"[$] Total"}</span>
            <span className="text-primary font-mono text-3xl">
              <span className="text-muted-foreground text-xl font-normal">$</span>
              <span className="tracking-tighter">{total}K</span>
            </span>
          </div>
          <hr className="mx-4 h-full border-l border-dashed" />
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs">{"[⬆] Peak"}</span>
            <span className="text-primary font-mono text-3xl tracking-tighter">
              {peak.month.slice(0, 3)}
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-end gap-1">
          <span className="text-muted-foreground font-mono text-[10px]">
            {"// PROJECTION: "}
            <span className="text-primary">ISOMETRIC</span>
          </span>
          <span className="text-muted-foreground font-mono text-[10px]">
            {"// HIGHLIGHT: "}
            <span className="text-primary">MAX</span>
          </span>
        </div>
      </div>
      <hr className="my-4 border-t border-dashed" />
      <ChartContainer config={chartConfig}>
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 30, right: 30, left: 0, bottom: 0 }}
          barCategoryGap="25%"
        >
          <defs>
            <linearGradient id="iso-front-base" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-revenue-0)" stopOpacity={1} />
              <stop offset="100%" stopColor="var(--color-revenue-0)" stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id="iso-top-base" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-revenue-0)" stopOpacity={1} />
              <stop offset="100%" stopColor="var(--color-revenue-0)" stopOpacity={0.9} />
            </linearGradient>
            <linearGradient id="iso-right-base" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-revenue-0)" stopOpacity={0.6} />
              <stop offset="100%" stopColor="var(--color-revenue-0)" stopOpacity={0.45} />
            </linearGradient>

            <linearGradient id="iso-front-accent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e4e4e7" />
            </linearGradient>
            <linearGradient id="iso-top-accent" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f4f4f5" />
            </linearGradient>
            <linearGradient id="iso-right-accent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a1a1aa" />
              <stop offset="100%" stopColor="#52525b" />
            </linearGradient>

            <pattern
              id="iso-hatch-base"
              patternUnits="userSpaceOnUse"
              width="6"
              height="6"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="1" strokeOpacity="0.25" />
            </pattern>
            <pattern
              id="iso-hatch-accent"
              patternUnits="userSpaceOnUse"
              width="6"
              height="6"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="6" stroke="#71717a" strokeWidth="1" strokeOpacity="0.45" />
            </pattern>
          </defs>

          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value: string) => value.slice(0, 3)}
          />
          <YAxis hide domain={[0, "dataMax + 10"]} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar
            dataKey="revenue"
            isAnimationActive={false}
            shape={(props: unknown) => (
              <IsoBar {...(props as ShapeProps)} maxValue={maxValue} />
            )}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

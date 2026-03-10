"use client";

import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";
import { Bar, BarChart, XAxis } from "recharts";
const SQUARE_SIZE = 10;
const GAP = 2;
const CELL_SIZE = SQUARE_SIZE + GAP;

const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 273 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 346 },
  { month: "July", desktop: 181 },
  { month: "August", desktop: 392 },
  { month: "September", desktop: 298 },
  { month: "October", desktop: 215 },
  { month: "November", desktop: 327 },
  { month: "December", desktop: 162 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    colors: {
      light: ["#18181b"],
      dark: ["#fafafa"],
    },
  },
} satisfies ChartConfig;

interface GridBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
}

// Renders ghost squares filling the entire column height — used as the Bar background.
// recharts passes y = chart top, height = full chart area height, so y + height = the
// shared bottom baseline, which perfectly aligns with the data squares in GridBarShape.
const GridBarBackground = (props: GridBarProps) => {
  const { fill, x, y, width, height } = props;

  const xPos = Number(x ?? 0);
  const yPos = Number(y ?? 0);
  const realWidth = Number(width ?? 0);
  const realHeight = Number(height ?? 0);

  if (realHeight <= 0) return null;

  const numSquares = Math.floor(realHeight / CELL_SIZE);
  const squareSize = Math.min(SQUARE_SIZE, Math.max(2, realWidth - 2));
  const squareX = xPos + Math.floor((realWidth - squareSize) / 2);
  const bottomY = yPos + realHeight;

  return (
    <>
      {Array.from({ length: numSquares }, (_, i) => {
        const squareY = bottomY - (i + 1) * CELL_SIZE + GAP;
        return (
          <rect
            className="dark:opacity-[0.1]"
            key={i}
            x={squareX}
            y={squareY}
            width={squareSize}
            height={squareSize}
            fill={fill}
          />
        );
      })}
    </>
  );
};

const GridBarShape = (props: GridBarProps) => {
  const { fill, x, y, width, height } = props;

  const xPos = Number(x ?? 0);
  const yPos = Number(y ?? 0);
  const realWidth = Number(width ?? 0);
  const realHeight = Number(height ?? 0);

  if (realHeight <= 0) return null;

  const numSquares = Math.max(1, Math.floor(realHeight / CELL_SIZE));
  const squareSize = Math.min(SQUARE_SIZE, Math.max(2, realWidth - 2));
  const squareX = xPos + Math.floor((realWidth - squareSize) / 2);
  const bottomY = yPos + realHeight;

  return (
    <>
      {Array.from({ length: numSquares }, (_, i) => {
        const squareY = bottomY - (i + 1) * CELL_SIZE + GAP;
        return (
          <rect
            key={i}
            x={squareX}
            y={squareY}
            width={squareSize}
            height={squareSize}
            fill={fill}
          />
        );
      })}
    </>
  );
};

export function EvilGridBarChart() {
  const total = chartData.reduce((sum, item) => sum + item.desktop, 0);
  const maxData = chartData.reduce(
    (max, item, index) =>
      item.desktop > max.value ? { index, month: item.month, value: item.desktop } : max,
    { index: 0, month: chartData[0].month, value: chartData[0].desktop },
  );

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row">
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs">{"[Σ] Total"}</span>
            <span className="text-primary font-mono text-3xl tracking-tighter">
              {total.toLocaleString()}
            </span>
          </div>
          <hr className="mx-4 h-full border-l border-dashed" />
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs">{"[⬆] Peak"}</span>
            <span className="text-primary font-mono text-3xl tracking-tighter">
              {maxData.month.slice(0, 3)}
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-end gap-1">
          <span className="text-muted-foreground font-mono text-[10px]">
            {"// CELL: "}
            <span className="text-primary">10x10px</span>
          </span>
          <span className="text-muted-foreground font-mono text-[10px]">
            {"// TYPE: "}
            <span className="text-primary">GRID</span>
          </span>
        </div>
      </div>
      <hr className="my-4 border-t border-dashed" />
      <ChartContainer config={chartConfig}>
        <BarChart accessibilityLayer data={chartData}>
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value: string) => value.slice(0, 3)}
          />
          {Object.keys(chartConfig).map((key) => (
            <Bar
              key={key}
              dataKey={key}
              fill={`var(--color-${key}-0)`}
              background={GridBarBackground}
              shape={GridBarShape}
              activeBar={GridBarShape}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
}

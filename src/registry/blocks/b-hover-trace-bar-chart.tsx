"use client";

import {
  Bar,
  BarChart,
  Rectangle,
  ReferenceLine,
  Tooltip,
  XAxis,
  type BarShapeProps,
  type CartesianViewBox,
} from "recharts";
import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";
import { useMotionValueEvent, useSpring } from "motion/react";
import NumberFlow from "@number-flow/react";
import * as React from "react";

const CHART_MARGIN = 38;

const chartData = [
  { month: "January", desktop: 342 },
  { month: "February", desktop: 676 },
  { month: "March", desktop: 512 },
  { month: "April", desktop: 629 },
  { month: "May", desktop: 458 },
  { month: "June", desktop: 781 },
  { month: "July", desktop: 394 },
  { month: "August", desktop: 924 },
  { month: "September", desktop: 647 },
  { month: "October", desktop: 532 },
  { month: "November", desktop: 803 },
  { month: "December", desktop: 271 },
  { month: "January", desktop: 342 },
  { month: "February", desktop: 876 },
  { month: "March", desktop: 512 },
  { month: "April", desktop: 629 },
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

export function EvilHoverTraceBarChart() {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const maxData = React.useMemo(
    () =>
      chartData.reduce(
        (max, item, index) =>
          item.desktop > max.value ? { index, month: item.month, value: item.desktop } : max,
        { index: 0, month: chartData[0].month, value: chartData[0].desktop },
      ),
    [],
  );

  const selectedData =
    activeIndex != null && chartData[activeIndex]
      ? {
          index: activeIndex,
          month: chartData[activeIndex].month,
          value: chartData[activeIndex].desktop,
        }
      : maxData;

  const valueSpring = useSpring(selectedData.value, {
    stiffness: 110,
    damping: 20,
  });
  const [springValue, setSpringValue] = React.useState(selectedData.value);

  const handleBarHover = React.useCallback(
    (index: number) => {
      setActiveIndex(index);
      valueSpring.set(chartData[index]?.desktop ?? maxData.value);
    },
    [maxData.value, valueSpring],
  );

  useMotionValueEvent(valueSpring, "change", (latest) => {
    setSpringValue(Math.round(latest));
  });

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4 flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground font-mono text-xs">{"[desktop] Value"}</p>
          <p className="text-primary font-mono text-3xl tracking-tighter">
            <NumberFlow
              value={selectedData.value}
              format={{ style: "currency", currency: "USD", currencyDisplay: "narrowSymbol" }}
            />
          </p>
        </div>

        <div className="space-y-1 text-right">
          <p className="text-muted-foreground font-mono text-[10px]">{"[month]"}</p>
          <p className="text-primary font-mono text-xs">{selectedData.month}</p>
        </div>
      </div>

      <ChartContainer config={chartConfig}>
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{ left: CHART_MARGIN }}
          onMouseMove={(state) => {
            if (state?.activeTooltipIndex != null) {
              handleBarHover(Number(state.activeTooltipIndex));
            }
          }}
          onMouseLeave={() => {
            setActiveIndex(null);
            valueSpring.set(maxData.value);
          }}
        >
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value: string) => value.slice(0, 3)}
          />

          <Tooltip cursor={false} content={() => null} />

          <Bar
            dataKey="desktop"
            fill="var(--color-desktop-0)"
            radius={4}
            shape={(props: BarShapeProps) => (
              <HoverTraceBarShape {...props} highlightedIndex={selectedData.index} />
            )}
            activeBar={(props: BarShapeProps) => (
              <HoverTraceBarShape {...props} highlightedIndex={selectedData.index} />
            )}
          />

          <ReferenceLine
            y={springValue}
            stroke="var(--foreground)"
            strokeDasharray="3 3"
            label={<HoverTraceLabel value={selectedData.value} />}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

interface HoverTraceLabelProps {
  viewBox?: CartesianViewBox;
  value: number;
}

const HoverTraceLabel = ({ viewBox, value }: HoverTraceLabelProps) => {
  const x = viewBox?.x ?? 0;
  const y = viewBox?.y ?? 0;
  const formattedValue = value.toLocaleString();
  const width = formattedValue.length * 8 + 12;

  return (
    <>
      <rect
        x={x - CHART_MARGIN}
        y={y - 9}
        width={width}
        height={18}
        fill="var(--foreground)"
        rx={4}
      />
      <text
        className="font-mono text-[11px]"
        fontWeight={600}
        x={x - CHART_MARGIN + 7}
        y={y + 4}
        fill="var(--background)"
      >
        {formattedValue}
      </text>
      <ellipse cx={"99.5%"} cy={y} rx={3} ry={3} fill="var(--foreground)" />
    </>
  );
};

type HoverTraceBarShapeProps = BarShapeProps & {
  highlightedIndex: number;
};

const HoverTraceBarShape = (props: HoverTraceBarShapeProps) => {
  const { x, y, width, height, fill, index, isActive, highlightedIndex } = props;

  const fillOpacity = isActive || index === highlightedIndex ? 1 : 0.2;

  return (
    <g>
      <Rectangle {...props} fill="transparent" pointerEvents="all" />
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        radius={4}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={isActive ? "var(--foreground)" : undefined}
        strokeOpacity={isActive ? 0.35 : undefined}
        strokeWidth={isActive ? 1 : undefined}
        className="transition-opacity duration-200"
      />
    </g>
  );
};

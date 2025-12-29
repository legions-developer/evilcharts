"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartTooltip, ChartTooltipContent } from "@/registry/ui/tooltip";
import { ChartLegend, ChartLegendContent } from "@/registry/ui/legend";
import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";
import { ChartDot, DotType } from "@/registry/ui/dot";
import { useState, type ComponentProps } from "react";

// Constants
const STROKE_WIDTH = 0.8;

type ChartProps = ComponentProps<typeof AreaChart>;
type XAxisProps = ComponentProps<typeof XAxis>;
type YAxisProps = ComponentProps<typeof YAxis>;
type AreaType = ComponentProps<typeof Area>["type"];

// Validating Tyes to make sure user have provided valid data according to chartConfig
type ValidateConfigKeys<TData, TConfig> = {
  [K in keyof TConfig]: K extends keyof TData ? ChartConfig[string] : never;
};

type EvilAreaChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = {
  chartConfig: TConfig & ValidateConfigKeys<TData, TConfig>;
  data: TData[];
  xDataKey?: keyof TData & string;
  yDataKey?: keyof TData & string;
  className?: string;
  chartProps?: ChartProps;
  xAxisProps?: XAxisProps;
  yAxisProps?: YAxisProps;
  defaultSelectedDataKey?: string | null;
  areaType?: AreaType;
  variant?: "gradient" | "solid";
  lineVariant?: "solid" | "dashed" | "animated-dashed";
  type?: "default" | "expanded" | "stacked";
  dotType?: DotType;
  // Hide Stuffs
  hideTooltip?: boolean;
  hideCartesianGrid?: boolean;
  hideActiveDot?: boolean;
  hideLegend?: boolean;
  isClickable?: boolean;
};

export function EvilAreaChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>({
  chartConfig,
  data,
  xDataKey,
  yDataKey,
  className,
  chartProps,
  xAxisProps,
  yAxisProps,
  defaultSelectedDataKey = null,
  areaType = "linear",
  variant = "gradient",
  lineVariant = "dashed",
  type = "default",
  dotType = "default",
  hideTooltip = false,
  hideCartesianGrid = false,
  hideActiveDot = false,
  hideLegend = false,
  isClickable = false,
}: EvilAreaChartProps<TData, TConfig>) {
  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(defaultSelectedDataKey);

  const isExpanded = type === "expanded";
  const isStacked = type === "stacked" || type === "expanded";

  return (
    <ChartContainer className={className} config={chartConfig}>
      <AreaChart
        accessibilityLayer
        stackOffset={isExpanded ? "expand" : undefined}
        data={data}
        {...chartProps}
      >
        <ReferenceLine color="white" />
        {!hideCartesianGrid && <CartesianGrid vertical={false} strokeDasharray="3 3" />}
        {!hideLegend && (
          <ChartLegend
            verticalAlign="top"
            align="right"
            content={
              <ChartLegendContent
                selected={selectedDataKey}
                onSelectChange={setSelectedDataKey}
                isClickable={isClickable}
              />
            }
          />
        )}
        {xDataKey && (
          <XAxis
            dataKey={xDataKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            {...xAxisProps}
          />
        )}
        {yDataKey && (
          <YAxis
            dataKey={yDataKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            {...yAxisProps}
          />
        )}
        {!hideTooltip && (
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent selected={selectedDataKey} />}
          />
        )}
        <defs>{variant === "gradient" && <LinearGradientStyle chartConfig={chartConfig} />}</defs>
        {Object.keys(chartConfig).map((dataKey) => {
          const _opacity = getOpacity(isClickable, selectedDataKey, dataKey);

          return (
            <Area
              type={areaType}
              key={dataKey}
              dataKey={dataKey}
              fillOpacity={_opacity.fill}
              strokeOpacity={_opacity.stroke}
              fill={`url(#evil-area-chart-${dataKey})`}
              stroke={`var(--color-${dataKey})`}
              stackId={isStacked ? "evil-stacked" : undefined}
              activeDot={
                hideActiveDot ? (
                  false
                ) : (
                  <ChartDot fillOpacity={_opacity.dot} type={dotType} dataKey={dataKey} />
                )
              }
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={
                lineVariant === "dashed"
                  ? "3 3"
                  : lineVariant === "animated-dashed"
                    ? "3 3"
                    : undefined
              }
              style={isClickable ? { cursor: "pointer" } : undefined}
              onClick={() => {
                if (!isClickable) return;
                // Toggle: if already selected, unselect; otherwise select
                setSelectedDataKey(selectedDataKey === dataKey ? null : dataKey);
              }}
            >
              {lineVariant === "animated-dashed" && <AnimatedDashedStyle />}
            </Area>
          );
        })}
      </AreaChart>
    </ChartContainer>
  );
}

// Returns opacity object for both fill and stroke, same values for both
const getOpacity = (isClickable: boolean, selectedDataKey: string | null, dataKey: string) => {
  if (!isClickable || selectedDataKey === null) {
    return { fill: 0.8, stroke: 0.8, dot: 1 };
  }
  return selectedDataKey === dataKey
    ? { fill: 0.8, stroke: 0.8, dot: 1 }
    : { fill: 0.2, stroke: 0.4, dot: 0.6 };
};

const AnimatedDashedStyle = () => {
  return (
    <>
      <animate
        attributeName="stroke-dasharray"
        values="3 3; 0 3; 3 3"
        dur="1s"
        repeatCount="indefinite"
        keyTimes="0;0.5;1"
      />
      <animate
        attributeName="stroke-dashoffset"
        values="0; -6"
        dur="1s"
        repeatCount="indefinite"
        keyTimes="0;1"
      />
    </>
  );
};

const LinearGradientStyle = ({ chartConfig }: { chartConfig: ChartConfig }) => {
  return (
    <>
      {Object.keys(chartConfig).map((dataKey) => (
        <linearGradient
          key={`evil-area-chart-${dataKey}`}
          id={`evil-area-chart-${dataKey}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={`var(--color-${dataKey})`} stopOpacity={0.2} />
          <stop offset="100%" stopColor={`var(--color-${dataKey})`} stopOpacity={0} />
        </linearGradient>
      ))}
    </>
  );
};

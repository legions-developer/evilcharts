"use client";

import { axisValueToPercentFormatter, type ChartConfig, ChartContainer } from "@/registry/ui/chart";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartTooltip, ChartTooltipContent } from "@/registry/ui/tooltip";
import { ChartLegend, ChartLegendContent } from "@/registry/ui/legend";
import { ChartDot, DotVariant } from "@/registry/ui/dot";
import { useState, type ComponentProps } from "react";

// Constants
const STROKE_WIDTH = 1;

type ChartProps = ComponentProps<typeof AreaChart>;
type XAxisProps = ComponentProps<typeof XAxis>;
type YAxisProps = ComponentProps<typeof YAxis>;
type AreaType = ComponentProps<typeof Area>["type"];
type AreaVariant = "gradient" | "gradient-reverse" | "solid" | "dotted" | "lines" | "hatched";
type StrokeVariant = "solid" | "dashed" | "animated-dashed";
type ChartType = "default" | "expanded" | "stacked";

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
  areaVariant?: AreaVariant;
  strokeVariant?: StrokeVariant;
  type?: ChartType;
  dotVariant?: DotVariant;
  activeDotVariant?: DotVariant;
  // Hide Stuffs
  hideTooltip?: boolean;
  hideCartesianGrid?: boolean;
  hideLegend?: boolean;
  hideCursorLine?: boolean;
  // Interactive Stuffs
  isClickable?: boolean;
  isLoading?: boolean;
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
  areaVariant = "gradient",
  strokeVariant = "dashed",
  type = "default",
  dotVariant,
  activeDotVariant,
  hideTooltip = false,
  hideCartesianGrid = false,
  hideLegend = false,
  hideCursorLine = false,
  isClickable = false,
  isLoading = false,
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
            width="auto"
            tickFormatter={type === "expanded" ? axisValueToPercentFormatter : undefined}
            {...yAxisProps}
          />
        )}
        {!hideTooltip && (
          <ChartTooltip
            cursor={
              hideCursorLine
                ? false
                : {
                    strokeDasharray:
                      strokeVariant === "dashed" || strokeVariant === "animated-dashed"
                        ? "3 3"
                        : undefined,
                    strokeWidth: STROKE_WIDTH,
                  }
            }
            content={<ChartTooltipContent selected={selectedDataKey} />}
          />
        )}
        <defs>
          {areaVariant === "gradient" && <LinearGradientStyle chartConfig={chartConfig} />}
          {areaVariant === "gradient-reverse" && <ReverseGradientStyle chartConfig={chartConfig} />}
          {areaVariant === "lines" && <LinesPatternStyle chartConfig={chartConfig} />}
          {areaVariant === "solid" && <SolidPatternStyle chartConfig={chartConfig} />}
          {areaVariant === "dotted" && <DottedPatternStyle chartConfig={chartConfig} />}
          {areaVariant === "hatched" && <HatchedPatternStyle chartConfig={chartConfig} />}
          <UnselectedDiagonalPatternStyle
            chartConfig={chartConfig}
            selectedDataKey={selectedDataKey}
            isClickable={isClickable}
          />
        </defs>
        {!isLoading &&
          Object.keys(chartConfig).map((dataKey) => {
            const _opacity = getOpacity(isClickable, selectedDataKey, dataKey);
            const isSelected = selectedDataKey === dataKey;
            const hasSelection = selectedDataKey !== null;

            // Get fill pattern based on variant and selection state
            const fillPattern = getFillPattern(
              areaVariant,
              isClickable,
              hasSelection,
              isSelected,
              dataKey,
            );

            return (
              <Area
                type={areaType}
                key={dataKey}
                dataKey={dataKey}
                fillOpacity={_opacity.fill}
                strokeOpacity={_opacity.stroke}
                fill={fillPattern}
                stroke={`var(--color-${dataKey})`}
                stackId={isStacked ? "evil-stacked" : undefined}
                dot={
                  dotVariant ? (
                    <ChartDot fillOpacity={_opacity.dot} type={dotVariant} dataKey={dataKey} />
                  ) : (
                    false
                  )
                }
                activeDot={
                  activeDotVariant ? (
                    <ChartDot
                      fillOpacity={_opacity.dot}
                      type={activeDotVariant}
                      dataKey={dataKey}
                    />
                  ) : (
                    false
                  )
                }
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={
                  strokeVariant === "dashed"
                    ? "3 3"
                    : strokeVariant === "animated-dashed"
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
                {strokeVariant === "animated-dashed" && !hasSelection && <AnimatedDashedStyle />}
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
    : { fill: 0.2, stroke: 0.3, dot: 0.3 };
};

// Returns the appropriate fill pattern based on variant and selection state
const getFillPattern = (
  variant: AreaVariant,
  isClickable: boolean,
  hasSelection: boolean,
  isSelected: boolean,
  dataKey: string,
): string => {
  // If clickable and there's a selection but this item is not selected, use unselected diagonal pattern
  if (isClickable && hasSelection && !isSelected) {
    return `url(#evil-area-chart-unselected-${dataKey})`;
  }

  // Otherwise, use the variant-specific pattern
  switch (variant) {
    case "gradient":
      return `url(#evil-area-chart-gradient-${dataKey})`;
    case "gradient-reverse":
      return `url(#evil-area-chart-gradient-reverse-${dataKey})`;
    case "solid":
      return `url(#evil-area-chart-solid-${dataKey})`;
    case "dotted":
      return `url(#evil-area-chart-dotted-${dataKey})`;
    case "lines":
      return `url(#evil-area-chart-lines-${dataKey})`;
    case "hatched":
      return `url(#evil-area-chart-hatched-pattern-${dataKey})`;
    default:
      return `url(#evil-area-chart-${dataKey})`;
  }
};

// Animated dashed-stroke style for the area chart
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

// Linear gradient for the area chart
const LinearGradientStyle = ({ chartConfig }: { chartConfig: ChartConfig }) => {
  return (
    <>
      {Object.keys(chartConfig).map((dataKey) => (
        <linearGradient
          key={`evil-area-chart-gradient-${dataKey}`}
          id={`evil-area-chart-gradient-${dataKey}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={`var(--color-${dataKey})`} stopOpacity={0.1} />
          <stop offset="100%" stopColor={`var(--color-${dataKey})`} stopOpacity={0} />
        </linearGradient>
      ))}
    </>
  );
};

// Reverse gradient for the area chart
const ReverseGradientStyle = ({ chartConfig }: { chartConfig: ChartConfig }) => {
  return (
    <>
      {Object.keys(chartConfig).map((dataKey) => (
        <linearGradient
          key={`evil-area-chart-gradient-reverse-${dataKey}`}
          id={`evil-area-chart-gradient-reverse-${dataKey}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="10%" stopColor={`var(--color-${dataKey})`} stopOpacity={0} />
          <stop offset="100%" stopColor={`var(--color-${dataKey})`} stopOpacity={0.1} />
        </linearGradient>
      ))}
    </>
  );
};

// Lines pattern for the area chart
const LinesPatternStyle = ({ chartConfig }: { chartConfig: ChartConfig }) => {
  return (
    <>
      {Object.keys(chartConfig).map((dataKey) => (
        <pattern
          key={`evil-area-chart-lines-${dataKey}`}
          id={`evil-area-chart-lines-${dataKey}`}
          patternUnits="userSpaceOnUse"
          width="5"
          height="5"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="5"
            stroke={`var(--color-${dataKey})`}
            strokeWidth="1"
            strokeOpacity="0.3"
          />
        </pattern>
      ))}
    </>
  );
};

// Solid pattern for the area chart
const SolidPatternStyle = ({ chartConfig }: { chartConfig: ChartConfig }) => {
  return (
    <>
      {Object.keys(chartConfig).map((dataKey) => (
        <linearGradient
          key={`evil-area-chart-solid-${dataKey}`}
          id={`evil-area-chart-solid-${dataKey}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={`var(--color-${dataKey})`} stopOpacity={0.1} />
          <stop offset="100%" stopColor={`var(--color-${dataKey})`} stopOpacity={0.1} />
        </linearGradient>
      ))}
    </>
  );
};

// Dotted pattern for the area chart
const DottedPatternStyle = ({ chartConfig }: { chartConfig: ChartConfig }) => {
  return (
    <>
      {Object.keys(chartConfig).map((dataKey) => (
        <pattern
          key={`evil-area-chart-dotted-${dataKey}`}
          id={`evil-area-chart-dotted-${dataKey}`}
          x="0"
          y="0"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="4" cy="4" r="0.5" fill={`var(--color-${dataKey})`} opacity={0.5} />
        </pattern>
      ))}
    </>
  );
};

// Diagonal lines pattern for non-selected areas
const UnselectedDiagonalPatternStyle = ({
  chartConfig,
  selectedDataKey,
  isClickable,
}: {
  chartConfig: ChartConfig;
  selectedDataKey: string | null;
  isClickable: boolean;
}) => {
  if (!isClickable || selectedDataKey === null) return null;

  return (
    <>
      {Object.keys(chartConfig).map((dataKey) => {
        const isSelected = selectedDataKey === dataKey;
        if (isSelected) return null;

        return (
          <pattern
            key={`evil-area-chart-unselected-${dataKey}`}
            id={`evil-area-chart-unselected-${dataKey}`}
            patternUnits="userSpaceOnUse"
            width="5"
            height="5"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="5"
              stroke={`var(--color-${dataKey})`}
              strokeWidth="1"
              strokeOpacity="0.3"
            />
          </pattern>
        );
      })}
    </>
  );
};

// Hatched pattern with striped gradient effect
const HatchedPatternStyle = ({ chartConfig }: { chartConfig: ChartConfig }) => {
  return (
    <>
      {Object.keys(chartConfig).map((dataKey) => (
        <g key={`evil-area-chart-hatched-group-${dataKey}`}>
          <linearGradient
            id={`evil-area-chart-hatched-gradient-${dataKey}`}
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop offset="50%" stopColor={`var(--color-${dataKey})`} stopOpacity={0.2} />
            <stop offset="50%" stopColor={`var(--color-${dataKey})`} />
          </linearGradient>
          <pattern
            id={`evil-area-chart-hatched-pattern-${dataKey}`}
            x="0"
            y="0"
            width="20"
            height="10"
            patternUnits="userSpaceOnUse"
            overflow="visible"
            patternTransform="rotate(20)"
          >
            <rect
              width="20"
              height="10"
              opacity="0.2"
              fill={`url(#evil-area-chart-hatched-gradient-${dataKey})`}
            />
          </pattern>
        </g>
      ))}
    </>
  );
};

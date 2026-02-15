"use client";

import {
  type ChartConfig,
  ChartContainer,
  getColorsCount,
  getLoadingData,
  LoadingIndicator,
} from "@/registry/ui/chart";
import {
  ChartTooltip,
  ChartTooltipContent,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/registry/ui/tooltip";
import { ChartLegend, ChartLegendContent, type ChartLegendVariant } from "@/registry/ui/legend";
import { Bar, ComposedChart, CartesianGrid, Line, ReferenceLine, XAxis, YAxis } from "recharts";
import { useCallback, useId, useMemo, useRef, useState, type ComponentProps } from "react";
import { EvilBrush, useEvilBrush, type EvilBrushRange } from "@/registry/ui/evil-brush";
import { ChartBackground, type BackgroundVariant } from "@/registry/ui/background";
import { ChartDot, DotVariant } from "@/registry/ui/dot";
import { motion } from "motion/react";

// Constants
const STROKE_WIDTH = 2;
const DEFAULT_BAR_RADIUS = 4;
const LOADING_DATA_KEY = "loading";
const LOADING_ANIMATION_DURATION = 2000;

type ChartProps = ComponentProps<typeof ComposedChart>;
type XAxisProps = ComponentProps<typeof XAxis>;
type YAxisProps = ComponentProps<typeof YAxis>;
type LineType = ComponentProps<typeof Line>["type"];
type StrokeVariant = "solid" | "dashed" | "animated-dashed";
type BarVariant = "default" | "hatched" | "duotone" | "duotone-reverse" | "gradient" | "stripped";

// Validating Types to make sure user have provided valid data according to chartConfig
type ValidateConfigKeys<TData, TConfig> = {
  [K in keyof TConfig]: K extends keyof TData ? ChartConfig[string] : never;
};

// Extract only keys from TData where the value is a number
type NumericDataKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

type EvilComposedChartProps<
  TData extends Record<string, unknown>,
  TBarConfig extends Record<string, ChartConfig[string]>,
  TLineConfig extends Record<string, ChartConfig[string]>,
> = {
  // Data
  data: TData[];
  xDataKey?: keyof TData & string;
  yDataKey?: keyof TData & string;
  className?: string;
  chartProps?: ChartProps;
  xAxisProps?: XAxisProps;
  yAxisProps?: YAxisProps;
  tickGap?: number;
  defaultSelectedDataKey?: string | null;

  // Bar Configuration
  barConfig: TBarConfig & ValidateConfigKeys<TData, TBarConfig>;
  barVariant?: BarVariant;
  barRadius?: number;
  barGap?: number;
  barCategoryGap?: number;
  enableHoverHighlight?: boolean;
  glowingBars?: NumericDataKeys<TData>[];

  // Line Configuration
  lineConfig: TLineConfig & ValidateConfigKeys<TData, TLineConfig>;
  curveType?: LineType;
  strokeVariant?: StrokeVariant;
  dotVariant?: DotVariant;
  activeDotVariant?: DotVariant;
  connectNulls?: boolean;
  glowingLines?: NumericDataKeys<TData>[];

  // Hide Stuffs
  hideTooltip?: boolean;
  hideCartesianGrid?: boolean;
  hideLegend?: boolean;
  hideCursorLine?: boolean;
  legendVariant?: ChartLegendVariant;
  // Tooltip
  tooltipRoundness?: TooltipRoundness;
  tooltipVariant?: TooltipVariant;
  tooltipDefaultIndex?: number;

  // Interactive Stuffs
  isLoading?: boolean;
  loadingBars?: number;
  // Brush
  showBrush?: boolean;
  brushHeight?: number;
  brushFormatLabel?: (value: unknown, index: number) => string;
  onBrushChange?: (range: EvilBrushRange) => void;
  // Background
  backgroundVariant?: BackgroundVariant;
};

type EvilComposedChartClickable = {
  isClickable: true;
  onSelectionChange?: (selectedDataKey: string | null) => void;
};

type EvilComposedChartNotClickable = {
  isClickable?: false;
  onSelectionChange?: never;
};

type EvilComposedChartPropsWithCallback<
  TData extends Record<string, unknown>,
  TBarConfig extends Record<string, ChartConfig[string]>,
  TLineConfig extends Record<string, ChartConfig[string]>,
> = EvilComposedChartProps<TData, TBarConfig, TLineConfig> &
  (EvilComposedChartClickable | EvilComposedChartNotClickable);

export function EvilComposedChart<
  TData extends Record<string, unknown>,
  TBarConfig extends Record<string, ChartConfig[string]>,
  TLineConfig extends Record<string, ChartConfig[string]>,
>({
  data,
  xDataKey,
  yDataKey,
  className,
  chartProps,
  xAxisProps,
  yAxisProps,
  tickGap = 8,
  defaultSelectedDataKey = null,
  // Bar props
  barConfig,
  barVariant = "default",
  barRadius = DEFAULT_BAR_RADIUS,
  barGap,
  barCategoryGap,
  enableHoverHighlight = false,
  glowingBars = [],
  // Line props
  lineConfig,
  curveType = "linear",
  strokeVariant = "solid",
  dotVariant,
  activeDotVariant,
  connectNulls = false,
  glowingLines = [],
  // Common props
  hideTooltip = false,
  hideCartesianGrid = false,
  hideLegend = false,
  hideCursorLine = false,
  legendVariant,
  tooltipRoundness,
  tooltipVariant,
  tooltipDefaultIndex,
  isClickable = false,
  isLoading = false,
  loadingBars,
  showBrush = false,
  brushHeight,
  brushFormatLabel,
  onBrushChange,
  onSelectionChange,
  backgroundVariant,
}: EvilComposedChartPropsWithCallback<TData, TBarConfig, TLineConfig>) {
  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(defaultSelectedDataKey);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { loadingData, onShimmerExit } = useLoadingData(isLoading, loadingBars);
  const chartId = useId().replace(/:/g, "");

  // ── Zoom state ──────────────────────────────────────────────────────────
  const { visibleData, brushProps } = useEvilBrush({ data });
  const displayData = showBrush && !isLoading ? visibleData : data;

  // Wrapper function to update state and call parent callback
  const handleSelectionChange = useCallback(
    (newSelectedDataKey: string | null) => {
      setSelectedDataKey(newSelectedDataKey);
      if (isClickable && onSelectionChange) {
        onSelectionChange(newSelectedDataKey);
      }
    },
    [onSelectionChange, isClickable],
  );

  // Combined config for legend and tooltip
  const combinedConfig = { ...barConfig, ...lineConfig };

  return (
    <ChartContainer
      className={className}
      config={combinedConfig}
      footer={
        showBrush &&
        !isLoading && (
          <EvilBrush
            data={data}
            chartConfig={combinedConfig}
            xDataKey={xDataKey}
            variant="area"
            curveType={curveType}
            strokeVariant={strokeVariant}
            connectNulls={connectNulls}
            barRadius={barRadius}
            height={brushHeight}
            formatLabel={brushFormatLabel}
            skipStyle
            className="mt-1"
            {...brushProps}
            onChange={(range) => {
              brushProps.onChange(range);
              onBrushChange?.(range);
            }}
          />
        )
      }
    >
      <LoadingIndicator isLoading={isLoading} />
      <ComposedChart
        id="evil-charts-composed-chart"
        accessibilityLayer
        data={isLoading ? loadingData : displayData}
        barGap={barGap}
        barCategoryGap={barCategoryGap}
        onMouseLeave={() => enableHoverHighlight && setHoveredIndex(null)}
        {...chartProps}
      >
        {backgroundVariant && <ChartBackground variant={backgroundVariant} />}
        <ReferenceLine color="white" />
        {!hideCartesianGrid && !backgroundVariant && (
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
        )}
        {!hideLegend && (
          <ChartLegend
            verticalAlign="top"
            align="right"
            content={
              <ChartLegendContent
                selected={selectedDataKey}
                onSelectChange={handleSelectionChange}
                isClickable={isClickable}
                variant={legendVariant}
              />
            }
          />
        )}
        {xDataKey && !isLoading && (
          <XAxis
            dataKey={xDataKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={tickGap}
            {...xAxisProps}
          />
        )}
        {yDataKey && !isLoading && (
          <YAxis
            dataKey={yDataKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={tickGap}
            width="auto"
            {...yAxisProps}
          />
        )}
        {!hideTooltip && !isLoading && (
          <ChartTooltip
            defaultIndex={tooltipDefaultIndex}
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
            content={
              <ChartTooltipContent
                selected={selectedDataKey}
                roundness={tooltipRoundness}
                variant={tooltipVariant}
              />
            }
          />
        )}

        {/* ======== BARS ======== */}
        {!isLoading &&
          Object.keys(barConfig).map((dataKey) => {
            const isGlowing = glowingBars.includes(dataKey as NumericDataKeys<TData>);
            const isSelectedDataKey = selectedDataKey === null || selectedDataKey === dataKey;

            const getFilter = () => {
              if (isGlowing) return `url(#${chartId}-bar-glow-${dataKey})`;
              return undefined;
            };

            return (
              <Bar
                key={`bar-${dataKey}`}
                dataKey={dataKey}
                fill={`url(#${chartId}-bar-colors-${dataKey})`}
                radius={barRadius}
                style={isClickable || enableHoverHighlight ? { cursor: "pointer" } : undefined}
                shape={(props: unknown) => {
                  const barProps = props as BarShapeProps;
                  const index = barProps.index as number;

                  const getBarOpacity = () => {
                    const clickOpacity =
                      isClickable && selectedDataKey !== null ? (isSelectedDataKey ? 1 : 0.3) : 1;

                    if (enableHoverHighlight && hoveredIndex !== null) {
                      const isHovered = hoveredIndex === index;
                      return isHovered ? clickOpacity : clickOpacity * 0.3;
                    }

                    return clickOpacity;
                  };

                  return (
                    <CustomBar
                      {...barProps}
                      chartId={chartId}
                      dataKey={dataKey}
                      barVariant={barVariant}
                      barRadius={barRadius}
                      filter={getFilter()}
                      fillOpacity={getBarOpacity()}
                      isClickable={isClickable}
                      enableHoverHighlight={enableHoverHighlight}
                      onClick={() => {
                        if (!isClickable) return;
                        handleSelectionChange(selectedDataKey === dataKey ? null : dataKey);
                      }}
                      onMouseEnter={() => {
                        if (enableHoverHighlight) setHoveredIndex(index);
                      }}
                    />
                  );
                }}
              />
            );
          })}

        {/* ======== LINES ======== */}
        {!isLoading &&
          Object.keys(lineConfig).map((dataKey) => {
            const _opacity = getOpacity(isClickable, selectedDataKey, dataKey);
            const hasSelection = selectedDataKey !== null;
            const isGlowing = glowingLines.includes(dataKey as NumericDataKeys<TData>);

            const getFilter = () => {
              if (isGlowing) return `url(#${chartId}-line-glow-${dataKey})`;
              return undefined;
            };

            const handleLineClick = () => {
              if (!isClickable) return;
              setSelectedDataKey(selectedDataKey === dataKey ? null : dataKey);
            };

            return (
              <g key={`line-group-${dataKey}`}>
                {/* Invisible hit area for easier clicking */}
                {isClickable && (
                  <Line
                    type={curveType}
                    dataKey={dataKey}
                    connectNulls={connectNulls}
                    stroke="transparent"
                    strokeWidth={20}
                    dot={false}
                    activeDot={false}
                    legendType="none"
                    tooltipType="none"
                    style={{ cursor: "pointer" }}
                    onClick={handleLineClick}
                  />
                )}
                {/* Visible line */}
                <Line
                  type={curveType}
                  dataKey={dataKey}
                  connectNulls={connectNulls}
                  strokeOpacity={_opacity.stroke}
                  stroke={`url(#${chartId}-line-colors-${dataKey})`}
                  filter={getFilter()}
                  dot={
                    dotVariant ? (
                      <ChartDot
                        fillOpacity={_opacity.dot}
                        type={dotVariant}
                        dataKey={dataKey}
                        chartId={`${chartId}-line`}
                      />
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
                        chartId={`${chartId}-line`}
                      />
                    ) : (
                      false
                    )
                  }
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={
                    strokeVariant === "dashed"
                      ? "5 5"
                      : strokeVariant === "animated-dashed"
                        ? "5 5"
                        : undefined
                  }
                  style={isClickable ? { cursor: "pointer", pointerEvents: "none" } : undefined}
                >
                  {strokeVariant === "animated-dashed" && !hasSelection && <AnimatedDashedStyle />}
                </Line>
              </g>
            );
          })}

        {/* ======== LOADING BAR ======== */}
        {isLoading && (
          <Bar
            dataKey={LOADING_DATA_KEY}
            fill="currentColor"
            fillOpacity={0.15}
            radius={barRadius}
            isAnimationActive={false}
            legendType="none"
            style={{ mask: `url(#${chartId}-loading-mask)` }}
          />
        )}

        {/* ======== CHART STYLES ======== */}
        <defs>
          {isLoading && <LoadingPatternStyle chartId={chartId} onShimmerExit={onShimmerExit} />}

          {/* Bar color gradients (vertical) */}
          <VerticalColorGradientStyle chartConfig={barConfig} chartId={chartId} prefix="bar" />

          {/* Line color gradients (horizontal) */}
          <HorizontalColorGradientStyle chartConfig={lineConfig} chartId={chartId} prefix="line" />

          {/* Bar variant styles */}
          {barVariant === "hatched" && (
            <HatchedPatternStyle chartConfig={barConfig} chartId={chartId} />
          )}
          {barVariant === "duotone" && (
            <DuotonePatternStyle chartConfig={barConfig} chartId={chartId} />
          )}
          {barVariant === "duotone-reverse" && (
            <DuotoneReversePatternStyle chartConfig={barConfig} chartId={chartId} />
          )}
          {barVariant === "gradient" && (
            <GradientPatternStyle chartConfig={barConfig} chartId={chartId} />
          )}
          {barVariant === "stripped" && (
            <StrippedPatternStyle chartConfig={barConfig} chartId={chartId} />
          )}

          {/* Bar glow filters */}
          {glowingBars.length > 0 && (
            <BarGlowFilterStyle chartId={chartId} glowingBars={glowingBars as string[]} />
          )}

          {/* Line glow filters */}
          {glowingLines.length > 0 && (
            <LineGlowFilterStyle chartId={chartId} glowingLines={glowingLines as string[]} />
          )}
        </defs>
      </ComposedChart>
    </ChartContainer>
  );
}

// Calculate opacity values for stroke and dot based on selection state
const getOpacity = (isClickable: boolean, selectedDataKey: string | null, dataKey: string) => {
  if (!isClickable || selectedDataKey === null) {
    return { stroke: 1, dot: 1 };
  }
  return selectedDataKey === dataKey ? { stroke: 1, dot: 1 } : { stroke: 0.3, dot: 0.3 };
};

// Animated dashed-stroke style for lines
const AnimatedDashedStyle = () => {
  return (
    <>
      <animate
        attributeName="stroke-dasharray"
        values="5 5; 0 5; 5 5"
        dur="1s"
        repeatCount="indefinite"
        keyTimes="0;0.5;1"
      />
      <animate
        attributeName="stroke-dashoffset"
        values="0; -10"
        dur="1s"
        repeatCount="indefinite"
        keyTimes="0;1"
      />
    </>
  );
};

// Custom bar shape component with support for variants, glow effects, and interactions
type BarShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  fillOpacity?: number;
  dataKey?: string;
  index?: number;
  background?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
  [key: string]: unknown;
};

type CustomBarProps = {
  chartId: string;
  dataKey: string;
  barVariant: BarVariant;
  barRadius: number;
  filter?: string;
  isClickable?: boolean;
  enableHoverHighlight?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
} & BarShapeProps;

const CustomBar = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fillOpacity = 1,
  background,
  chartId,
  dataKey,
  barVariant,
  barRadius,
  filter,
  isClickable,
  enableHoverHighlight,
  onClick,
  onMouseEnter,
}: CustomBarProps) => {
  const getFill = () => {
    switch (barVariant) {
      case "hatched":
        return `url(#${chartId}-hatched-${dataKey})`;
      case "duotone":
        return `url(#${chartId}-duotone-${dataKey})`;
      case "duotone-reverse":
        return `url(#${chartId}-duotone-reverse-${dataKey})`;
      case "gradient":
        return `url(#${chartId}-gradient-${dataKey})`;
      case "stripped":
        return `url(#${chartId}-stripped-${dataKey})`;
      default:
        return `url(#${chartId}-bar-colors-${dataKey})`;
    }
  };

  const cursorStyle = isClickable || enableHoverHighlight ? { cursor: "pointer" } : undefined;
  const hitAreaX = background?.x ?? x;
  const hitAreaY = background?.y ?? y;
  const hitAreaWidth = background?.width ?? width;
  const hitAreaHeight = background?.height ?? height;

  if (barVariant === "stripped") {
    return (
      <g style={cursorStyle} onClick={onClick}>
        <g filter={filter} opacity={fillOpacity} className="transition-opacity duration-200">
          <rect x={x} y={y} width={width} height={height} fill={getFill()} />
          <rect
            x={x}
            y={y}
            width={width}
            height={2}
            fill={`url(#${chartId}-bar-colors-${dataKey})`}
          />
        </g>
        {enableHoverHighlight && (
          <rect
            x={hitAreaX}
            y={hitAreaY}
            width={hitAreaWidth}
            height={hitAreaHeight}
            fill="transparent"
            onMouseEnter={onMouseEnter}
          />
        )}
      </g>
    );
  }

  return (
    <g style={cursorStyle} onClick={onClick}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={barRadius}
        ry={barRadius}
        fill={getFill()}
        opacity={fillOpacity}
        filter={filter}
        className="transition-opacity duration-200"
      />
      {enableHoverHighlight && (
        <rect
          x={hitAreaX}
          y={hitAreaY}
          width={hitAreaWidth}
          height={hitAreaHeight}
          fill="transparent"
          onMouseEnter={onMouseEnter}
        />
      )}
    </g>
  );
};

// Create vertical color gradient for bars (top to bottom)
const VerticalColorGradientStyle = ({
  chartConfig,
  chartId,
  prefix,
}: {
  chartConfig: ChartConfig;
  chartId: string;
  prefix: string;
}) => {
  return (
    <>
      {Object.entries(chartConfig).map(([dataKey, config]) => {
        const colorsCount = getColorsCount(config);

        return (
          <linearGradient
            key={`${chartId}-${prefix}-colors-${dataKey}`}
            id={`${chartId}-${prefix}-colors-${dataKey}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            {colorsCount === 1 ? (
              <>
                <stop offset="0%" stopColor={`var(--color-${dataKey}-0)`} />
                <stop offset="100%" stopColor={`var(--color-${dataKey}-0)`} />
              </>
            ) : (
              Array.from({ length: colorsCount }, (_, index) => (
                <stop
                  key={index}
                  offset={`${(index / (colorsCount - 1)) * 100}%`}
                  stopColor={`var(--color-${dataKey}-${index}, var(--color-${dataKey}-0))`}
                />
              ))
            )}
          </linearGradient>
        );
      })}
    </>
  );
};

// Horizontal color gradient for lines (left to right)
const HorizontalColorGradientStyle = ({
  chartConfig,
  chartId,
  prefix,
}: {
  chartConfig: ChartConfig;
  chartId: string;
  prefix: string;
}) => {
  return (
    <>
      {Object.entries(chartConfig).map(([dataKey, config]) => {
        const colorsCount = getColorsCount(config);

        return (
          <linearGradient
            key={`${chartId}-${prefix}-colors-${dataKey}`}
            id={`${chartId}-${prefix}-colors-${dataKey}`}
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            {colorsCount === 1 ? (
              <>
                <stop offset="0%" stopColor={`var(--color-${dataKey}-0)`} />
                <stop offset="100%" stopColor={`var(--color-${dataKey}-0)`} />
              </>
            ) : (
              Array.from({ length: colorsCount }, (_, index) => (
                <stop
                  key={index}
                  offset={`${(index / (colorsCount - 1)) * 100}%`}
                  stopColor={`var(--color-${dataKey}-${index}, var(--color-${dataKey}-0))`}
                />
              ))
            )}
          </linearGradient>
        );
      })}
    </>
  );
};

// Create hatched diagonal pattern style for bars using SVG masks
const HatchedPatternStyle = ({
  chartConfig,
  chartId,
}: {
  chartConfig: ChartConfig;
  chartId: string;
}) => {
  return (
    <>
      <pattern
        id={`${chartId}-hatched-mask-pattern`}
        x="0"
        y="0"
        width="5"
        height="5"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-45)"
      >
        <rect width="5" height="5" fill="white" fillOpacity={0.3} />
        <rect width="1.5" height="5" fill="white" fillOpacity={1} />
      </pattern>

      {Object.keys(chartConfig).map((dataKey) => (
        <g key={`${chartId}-hatched-group-${dataKey}`}>
          <mask id={`${chartId}-hatched-mask-${dataKey}`}>
            <rect width="100%" height="100%" fill={`url(#${chartId}-hatched-mask-pattern)`} />
          </mask>
          <pattern
            id={`${chartId}-hatched-${dataKey}`}
            patternUnits="userSpaceOnUse"
            width="100%"
            height="100%"
          >
            <rect
              width="100%"
              height="100%"
              fill={`url(#${chartId}-bar-colors-${dataKey})`}
              mask={`url(#${chartId}-hatched-mask-${dataKey})`}
            />
          </pattern>
        </g>
      ))}
    </>
  );
};

const DuotonePatternStyle = ({
  chartConfig,
  chartId,
}: {
  chartConfig: ChartConfig;
  chartId: string;
}) => {
  return (
    <>
      {Object.entries(chartConfig).map(([dataKey, config]) => {
        const colorsCount = getColorsCount(config);

        return (
          <g key={`${chartId}-duotone-group-${dataKey}`}>
            <linearGradient
              id={`${chartId}-duotone-mask-gradient-${dataKey}`}
              gradientUnits="objectBoundingBox"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="50%" stopColor="white" stopOpacity={0.4} />
              <stop offset="50%" stopColor="white" stopOpacity={1} />
            </linearGradient>

            <linearGradient
              id={`${chartId}-duotone-colors-${dataKey}`}
              gradientUnits="objectBoundingBox"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              {colorsCount === 1 ? (
                <>
                  <stop offset="0%" stopColor={`var(--color-${dataKey}-0)`} />
                  <stop offset="100%" stopColor={`var(--color-${dataKey}-0)`} />
                </>
              ) : (
                Array.from({ length: colorsCount }, (_, index) => (
                  <stop
                    key={index}
                    offset={`${(index / (colorsCount - 1)) * 100}%`}
                    stopColor={`var(--color-${dataKey}-${index}, var(--color-${dataKey}-0))`}
                  />
                ))
              )}
            </linearGradient>

            <mask id={`${chartId}-duotone-mask-${dataKey}`} maskContentUnits="objectBoundingBox">
              <rect
                x="0"
                y="0"
                width="1"
                height="1"
                fill={`url(#${chartId}-duotone-mask-gradient-${dataKey})`}
              />
            </mask>

            <pattern
              id={`${chartId}-duotone-${dataKey}`}
              patternUnits="objectBoundingBox"
              patternContentUnits="objectBoundingBox"
              width="1"
              height="1"
            >
              <rect
                x="0"
                y="0"
                width="1"
                height="1"
                fill={`url(#${chartId}-duotone-colors-${dataKey})`}
                mask={`url(#${chartId}-duotone-mask-${dataKey})`}
              />
            </pattern>
          </g>
        );
      })}
    </>
  );
};

const DuotoneReversePatternStyle = ({
  chartConfig,
  chartId,
}: {
  chartConfig: ChartConfig;
  chartId: string;
}) => {
  return (
    <>
      {Object.entries(chartConfig).map(([dataKey, config]) => {
        const colorsCount = getColorsCount(config);

        return (
          <g key={`${chartId}-duotone-reverse-group-${dataKey}`}>
            <linearGradient
              id={`${chartId}-duotone-reverse-mask-gradient-${dataKey}`}
              gradientUnits="objectBoundingBox"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="50%" stopColor="white" stopOpacity={1} />
              <stop offset="50%" stopColor="white" stopOpacity={0.4} />
            </linearGradient>

            <linearGradient
              id={`${chartId}-duotone-reverse-colors-${dataKey}`}
              gradientUnits="objectBoundingBox"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              {colorsCount === 1 ? (
                <>
                  <stop offset="0%" stopColor={`var(--color-${dataKey}-0)`} />
                  <stop offset="100%" stopColor={`var(--color-${dataKey}-0)`} />
                </>
              ) : (
                Array.from({ length: colorsCount }, (_, index) => (
                  <stop
                    key={index}
                    offset={`${(index / (colorsCount - 1)) * 100}%`}
                    stopColor={`var(--color-${dataKey}-${index}, var(--color-${dataKey}-0))`}
                  />
                ))
              )}
            </linearGradient>

            <mask
              id={`${chartId}-duotone-reverse-mask-${dataKey}`}
              maskContentUnits="objectBoundingBox"
            >
              <rect
                x="0"
                y="0"
                width="1"
                height="1"
                fill={`url(#${chartId}-duotone-reverse-mask-gradient-${dataKey})`}
              />
            </mask>

            <pattern
              id={`${chartId}-duotone-reverse-${dataKey}`}
              patternUnits="objectBoundingBox"
              patternContentUnits="objectBoundingBox"
              width="1"
              height="1"
            >
              <rect
                x="0"
                y="0"
                width="1"
                height="1"
                fill={`url(#${chartId}-duotone-reverse-colors-${dataKey})`}
                mask={`url(#${chartId}-duotone-reverse-mask-${dataKey})`}
              />
            </pattern>
          </g>
        );
      })}
    </>
  );
};

const GradientPatternStyle = ({
  chartConfig,
  chartId,
}: {
  chartConfig: ChartConfig;
  chartId: string;
}) => {
  return (
    <>
      <linearGradient id={`${chartId}-gradient-mask-gradient`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="20%" stopColor="white" stopOpacity={1} />
        <stop offset="90%" stopColor="white" stopOpacity={0} />
      </linearGradient>

      {Object.keys(chartConfig).map((dataKey) => (
        <g key={`${chartId}-gradient-group-${dataKey}`}>
          <mask id={`${chartId}-gradient-mask-${dataKey}`}>
            <rect width="100%" height="100%" fill={`url(#${chartId}-gradient-mask-gradient)`} />
          </mask>
          <pattern
            id={`${chartId}-gradient-${dataKey}`}
            patternUnits="userSpaceOnUse"
            width="100%"
            height="100%"
          >
            <rect
              width="100%"
              height="100%"
              fill={`url(#${chartId}-bar-colors-${dataKey})`}
              mask={`url(#${chartId}-gradient-mask-${dataKey})`}
            />
          </pattern>
        </g>
      ))}
    </>
  );
};

const StrippedPatternStyle = ({
  chartConfig,
  chartId,
}: {
  chartConfig: ChartConfig;
  chartId: string;
}) => {
  return (
    <>
      <linearGradient id={`${chartId}-stripped-mask-gradient`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity={0.4} />
        <stop offset="100%" stopColor="white" stopOpacity={0.1} />
      </linearGradient>

      {Object.keys(chartConfig).map((dataKey) => (
        <g key={`${chartId}-stripped-group-${dataKey}`}>
          <mask id={`${chartId}-stripped-mask-${dataKey}`}>
            <rect width="100%" height="100%" fill={`url(#${chartId}-stripped-mask-gradient)`} />
          </mask>
          <pattern
            id={`${chartId}-stripped-${dataKey}`}
            patternUnits="userSpaceOnUse"
            width="100%"
            height="100%"
          >
            <rect
              width="100%"
              height="100%"
              fill={`url(#${chartId}-bar-colors-${dataKey})`}
              mask={`url(#${chartId}-stripped-mask-${dataKey})`}
            />
          </pattern>
        </g>
      ))}
    </>
  );
};

// Apply soft glow filter effect to bars using SVG filters
const BarGlowFilterStyle = ({
  chartId,
  glowingBars,
}: {
  chartId: string;
  glowingBars: string[];
}) => {
  return (
    <>
      {glowingBars.map((dataKey) => (
        <filter
          key={`${chartId}-bar-glow-${dataKey}`}
          id={`${chartId}-bar-glow-${dataKey}`}
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      ))}
    </>
  );
};

const LineGlowFilterStyle = ({
  chartId,
  glowingLines,
}: {
  chartId: string;
  glowingLines: string[];
}) => {
  return (
    <>
      {glowingLines.map((dataKey) => (
        <filter
          key={`${chartId}-line-glow-${dataKey}`}
          id={`${chartId}-line-glow-${dataKey}`}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 2 0"
            result="glow"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      ))}
    </>
  );
};

// Generate gradient stops with smooth sine-based easing for loading animation
const generateEasedGradientStops = (
  steps: number = 17,
  minOpacity: number = 0.05,
  maxOpacity: number = 0.9,
) => {
  return Array.from({ length: steps }, (_, i) => {
    const t = i / (steps - 1);
    const eased = Math.sin(t * Math.PI) ** 2;
    const opacity = minOpacity + eased * (maxOpacity - minOpacity);
    return { offset: `${(t * 100).toFixed(0)}%`, opacity: Number(opacity.toFixed(3)) };
  });
};

export function useLoadingData(isLoading: boolean, loadingBars: number = 12) {
  const [loadingDataKey, setLoadingDataKey] = useState(false);

  const onShimmerExit = useCallback(() => {
    if (isLoading) {
      setLoadingDataKey((prev) => !prev);
    }
  }, [isLoading]);

  const loadingData = useMemo(
    () => getLoadingData(loadingBars, 20, 80),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadingBars, loadingDataKey],
  );

  return { loadingData, onShimmerExit };
}

const LoadingPatternStyle = ({
  chartId,
  onShimmerExit,
}: {
  chartId: string;
  onShimmerExit: () => void;
}) => {
  const gradientStops = generateEasedGradientStops();
  const patternWidth = 3;
  const startX = -1;
  const endX = 2;
  const lastXRef = useRef(startX);

  return (
    <>
      <linearGradient id={`${chartId}-loading-mask-gradient`} x1="0" y1="0" x2="1" y2="0">
        {gradientStops.map(({ offset, opacity }) => (
          <stop key={offset} offset={offset} stopColor="white" stopOpacity={opacity} />
        ))}
      </linearGradient>
      <pattern
        id={`${chartId}-loading-mask-pattern`}
        patternUnits="objectBoundingBox"
        patternContentUnits="objectBoundingBox"
        patternTransform="rotate(25)"
        width={patternWidth}
        height="1"
        x="0"
        y="0"
      >
        <motion.rect
          y="0"
          width="1"
          height="1"
          fill={`url(#${chartId}-loading-mask-gradient)`}
          initial={{ x: startX }}
          animate={{ x: endX }}
          transition={{
            duration: LOADING_ANIMATION_DURATION / 1000,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop",
          }}
          onUpdate={(latest) => {
            const xValue = typeof latest.x === "number" ? latest.x : startX;
            const lastX = lastXRef.current;
            if (xValue >= 1 && lastX < 1) {
              onShimmerExit();
            }
            lastXRef.current = xValue;
          }}
        />
      </pattern>
      <mask id={`${chartId}-loading-mask`} maskUnits="userSpaceOnUse">
        <rect width="100%" height="100%" fill={`url(#${chartId}-loading-mask-pattern)`} />
      </mask>
    </>
  );
};

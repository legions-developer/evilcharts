"use client";

import {
  type ChartConfig,
  ChartContainer,
  getColorsCount,
  getLoadingData,
  LoadingIndicator,
} from "@/registry/ui/chart";
import { useCallback, useId, useMemo, useRef, useState, type ComponentProps } from "react";
import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartTooltip, ChartTooltipContent } from "@/registry/ui/tooltip";
import { ChartLegend, ChartLegendContent } from "@/registry/ui/legend";
import { motion } from "motion/react";

// Constants
const DEFAULT_BAR_RADIUS = 4;
const LOADING_BAR_DATA_KEY = "loading";
const LOADING_ANIMATION_DURATION = 2000; // in milliseconds

type ChartProps = ComponentProps<typeof BarChart>;
type XAxisProps = ComponentProps<typeof XAxis>;
type YAxisProps = ComponentProps<typeof YAxis>;
type BarVariant = "default" | "hatched" | "duotone" | "duotone-reverse" | "gradient" | "stripped";
type StackType = "default" | "stacked" | "percent";
type BarLayout = "vertical" | "horizontal";

// Validating Types to make sure user have provided valid data according to chartConfig
type ValidateConfigKeys<TData, TConfig> = {
  [K in keyof TConfig]: K extends keyof TData ? ChartConfig[string] : never;
};

// Extract only keys from TData where the value is a number (not string, boolean, etc.)
type NumericDataKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

type EvilBarChartProps<
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
  barVariant?: BarVariant;
  stackType?: StackType;
  layout?: BarLayout;
  barRadius?: number;
  barGap?: number;
  barCategoryGap?: number;
  tickGap?: number;
  // Hide Stuffs
  hideTooltip?: boolean;
  hideCartesianGrid?: boolean;
  hideLegend?: boolean;
  // Interactive Stuffs
  isClickable?: boolean;
  enableHoverHighlight?: boolean;
  isLoading?: boolean;
  loadingBars?: number;
  // Glow Effects
  glowingBars?: NumericDataKeys<TData>[];
  neonBars?: NumericDataKeys<TData>[];
};

export function EvilBarChart<
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
  barVariant = "default",
  stackType = "default",
  layout = "vertical",
  barRadius = DEFAULT_BAR_RADIUS,
  barGap,
  barCategoryGap,
  tickGap = 8,
  hideTooltip = false,
  hideCartesianGrid = false,
  hideLegend = false,
  isClickable = false,
  enableHoverHighlight = false,
  isLoading = false,
  loadingBars,
  glowingBars = [],
  neonBars = [],
}: EvilBarChartProps<TData, TConfig>) {
  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(defaultSelectedDataKey);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { loadingData, onShimmerExit } = useLoadingData(isLoading, loadingBars);
  const chartId = useId().replace(/:/g, ""); // Remove colons for valid CSS selectors

  const isStacked = stackType === "stacked" || stackType === "percent";
  const isHorizontal = layout === "horizontal";

  return (
    <ChartContainer className={className} config={chartConfig}>
      <LoadingIndicator isLoading={isLoading} />
      <BarChart
        id="evil-charts-bar-chart"
        accessibilityLayer
        layout={isHorizontal ? "vertical" : "horizontal"}
        data={isLoading ? loadingData : data}
        barGap={barGap}
        barCategoryGap={barCategoryGap}
        stackOffset={stackType === "percent" ? "expand" : undefined}
        onMouseLeave={() => enableHoverHighlight && setHoveredIndex(null)}
        {...chartProps}
      >
        <ReferenceLine color="white" />
        {!hideCartesianGrid && (
          <CartesianGrid vertical={isHorizontal} horizontal={!isHorizontal} strokeDasharray="3 3" />
        )}
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
        {xDataKey && !isLoading && (
          <XAxis
            dataKey={isHorizontal ? undefined : xDataKey}
            type={isHorizontal ? "number" : "category"}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={tickGap}
            {...xAxisProps}
          />
        )}
        {!isLoading && (
          <YAxis
            dataKey={isHorizontal ? xDataKey : yDataKey}
            type={isHorizontal ? "category" : "number"}
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
            cursor={false}
            content={<ChartTooltipContent selected={selectedDataKey} />}
          />
        )}
        {!isLoading &&
          Object.keys(chartConfig).map((dataKey) => {
            const _opacity = getOpacity(isClickable, selectedDataKey, dataKey);
            const isGlowing = glowingBars.includes(dataKey as NumericDataKeys<TData>);
            const isNeon = neonBars.includes(dataKey as NumericDataKeys<TData>);

            // Determine which filter to apply (neon takes priority over glow)
            const getFilter = () => {
              if (isNeon) return `url(#${chartId}-bar-neon-${dataKey})`;
              if (isGlowing) return `url(#${chartId}-bar-glow-${dataKey})`;
              return undefined;
            };

            return (
              <Bar
                key={dataKey}
                dataKey={dataKey}
                stackId={isStacked ? "evil-stacked" : undefined}
                fill={`url(#${chartId}-colors-${dataKey})`}
                radius={barRadius}
                style={isClickable || enableHoverHighlight ? { cursor: "pointer" } : undefined}
                shape={(props: unknown) => {
                  const barProps = props as BarShapeProps;
                  const index = barProps.index as number;

                  // Calculate opacity based on hover and click state
                  const barOpacity = enableHoverHighlight
                    ? hoveredIndex === null
                      ? _opacity.fill
                      : hoveredIndex === index
                        ? 1
                        : 0.3
                    : _opacity.fill;

                  return (
                    <CustomBar
                      {...barProps}
                      chartId={chartId}
                      dataKey={dataKey}
                      barVariant={barVariant}
                      barRadius={barRadius}
                      filter={getFilter()}
                      fillOpacity={barOpacity}
                      isClickable={isClickable}
                      enableHoverHighlight={enableHoverHighlight}
                      onClick={() => {
                        if (!isClickable) return;
                        setSelectedDataKey(selectedDataKey === dataKey ? null : dataKey);
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
        {/* ======== LOADING BAR ======== */}
        {isLoading && (
          <Bar
            dataKey={LOADING_BAR_DATA_KEY}
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
          {isLoading && <LoadingBarPatternStyle chartId={chartId} onShimmerExit={onShimmerExit} />}
          {/* Shared vertical color gradient - always rendered for fill */}
          <VerticalColorGradientStyle chartConfig={chartConfig} chartId={chartId} />
          {/* Variant-specific styles */}
          {barVariant === "hatched" && (
            <HatchedPatternStyle chartConfig={chartConfig} chartId={chartId} />
          )}
          {barVariant === "duotone" && (
            <DuotonePatternStyle chartConfig={chartConfig} chartId={chartId} />
          )}
          {barVariant === "duotone-reverse" && (
            <DuotoneReversePatternStyle chartConfig={chartConfig} chartId={chartId} />
          )}
          {barVariant === "gradient" && (
            <GradientPatternStyle chartConfig={chartConfig} chartId={chartId} />
          )}
          {barVariant === "stripped" && (
            <StrippedPatternStyle chartConfig={chartConfig} chartId={chartId} />
          )}
          {/* Glow filter for glowing bars */}
          {glowingBars.length > 0 && (
            <GlowFilterStyle chartId={chartId} glowingBars={glowingBars as string[]} />
          )}
          {/* Neon filter for neon bars */}
          {neonBars.length > 0 && (
            <NeonFilterStyle chartId={chartId} neonBars={neonBars as string[]} />
          )}
        </defs>
      </BarChart>
    </ChartContainer>
  );
}

// Types for custom bar shape
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

// Custom bar shape component for different variants
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
        return `url(#${chartId}-colors-${dataKey})`;
    }
  };

  const cursorStyle = isClickable || enableHoverHighlight ? { cursor: "pointer" } : undefined;

  // Use background dimensions for hit area (full column height) when hover highlight is enabled
  const hitAreaX = background?.x ?? x;
  const hitAreaY = background?.y ?? y;
  const hitAreaWidth = background?.width ?? width;
  const hitAreaHeight = background?.height ?? height;

  // For stripped variant, add a top border
  if (barVariant === "stripped") {
    return (
      <g style={cursorStyle} onClick={onClick}>
        {/* Visible bar */}
        <g filter={filter} opacity={fillOpacity} className="transition-opacity duration-200">
          <rect x={x} y={y} width={width} height={height} fill={getFill()} />
          <rect x={x} y={y} width={width} height={2} fill={`url(#${chartId}-colors-${dataKey})`} />
        </g>
        {/* Hit area for hover - covers full column height */}
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
      {/* Visible bar */}
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
      {/* Hit area for hover - covers full column height */}
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

// Returns opacity object for fill
const getOpacity = (isClickable: boolean, selectedDataKey: string | null, dataKey: string) => {
  if (!isClickable || selectedDataKey === null) {
    return { fill: 1 };
  }
  return selectedDataKey === dataKey ? { fill: 1 } : { fill: 0.3 };
};

// Shared vertical color gradient (top to bottom) - used for bar fill
const VerticalColorGradientStyle = ({
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
          <linearGradient
            key={`${chartId}-colors-${dataKey}`}
            id={`${chartId}-colors-${dataKey}`}
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

// Hatched pattern style for bars
const HatchedPatternStyle = ({
  chartConfig,
  chartId,
}: {
  chartConfig: ChartConfig;
  chartId: string;
}) => {
  return (
    <>
      {Object.keys(chartConfig).map((dataKey) => (
        <pattern
          key={`${chartId}-hatched-${dataKey}`}
          id={`${chartId}-hatched-${dataKey}`}
          x="0"
          y="0"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-45)"
        >
          <rect width="5" height="5" fill={`var(--color-${dataKey}-0)`} fillOpacity={0.3} />
          <rect width="1.5" height="5" fill={`var(--color-${dataKey}-0)`} />
        </pattern>
      ))}
    </>
  );
};

// Duotone pattern style for bars (half opacity, half full)
const DuotonePatternStyle = ({
  chartConfig,
  chartId,
}: {
  chartConfig: ChartConfig;
  chartId: string;
}) => {
  return (
    <>
      {Object.keys(chartConfig).map((dataKey) => (
        <linearGradient
          key={`${chartId}-duotone-${dataKey}`}
          id={`${chartId}-duotone-${dataKey}`}
          x1="0"
          y1="0"
          x2="1"
          y2="0"
        >
          <stop offset="50%" stopColor={`var(--color-${dataKey}-0)`} stopOpacity={0.4} />
          <stop offset="50%" stopColor={`var(--color-${dataKey}-0)`} stopOpacity={1} />
        </linearGradient>
      ))}
    </>
  );
};

// Duotone reverse pattern style for bars (full opacity first, then half)
const DuotoneReversePatternStyle = ({
  chartConfig,
  chartId,
}: {
  chartConfig: ChartConfig;
  chartId: string;
}) => {
  return (
    <>
      {Object.keys(chartConfig).map((dataKey) => (
        <linearGradient
          key={`${chartId}-duotone-reverse-${dataKey}`}
          id={`${chartId}-duotone-reverse-${dataKey}`}
          x1="0"
          y1="0"
          x2="1"
          y2="0"
        >
          <stop offset="50%" stopColor={`var(--color-${dataKey}-0)`} stopOpacity={1} />
          <stop offset="50%" stopColor={`var(--color-${dataKey}-0)`} stopOpacity={0.4} />
        </linearGradient>
      ))}
    </>
  );
};

// Gradient pattern style for bars (top to bottom fade)
const GradientPatternStyle = ({
  chartConfig,
  chartId,
}: {
  chartConfig: ChartConfig;
  chartId: string;
}) => {
  return (
    <>
      {Object.keys(chartConfig).map((dataKey) => (
        <linearGradient
          key={`${chartId}-gradient-${dataKey}`}
          id={`${chartId}-gradient-${dataKey}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={`var(--color-${dataKey}-0)`} stopOpacity={0.8} />
          <stop offset="100%" stopColor={`var(--color-${dataKey}-0)`} stopOpacity={0.1} />
        </linearGradient>
      ))}
    </>
  );
};

// Stripped pattern style for bars (low opacity body with full opacity top)
const StrippedPatternStyle = ({
  chartConfig,
  chartId,
}: {
  chartConfig: ChartConfig;
  chartId: string;
}) => {
  return (
    <>
      {Object.keys(chartConfig).map((dataKey) => (
        <linearGradient
          key={`${chartId}-stripped-${dataKey}`}
          id={`${chartId}-stripped-${dataKey}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={`var(--color-${dataKey}-0)`} stopOpacity={0.3} />
          <stop offset="100%" stopColor={`var(--color-${dataKey}-0)`} stopOpacity={0.1} />
        </linearGradient>
      ))}
    </>
  );
};

// Glow filter style for glowing bars
const GlowFilterStyle = ({ chartId, glowingBars }: { chartId: string; glowingBars: string[] }) => {
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
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 0.5 0"
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

// Neon filter style for neon bars - multi-layered glow with white inner core
const NeonFilterStyle = ({ chartId, neonBars }: { chartId: string; neonBars: string[] }) => {
  return (
    <>
      {neonBars.map((dataKey) => (
        <filter
          key={`${chartId}-bar-neon-${dataKey}`}
          id={`${chartId}-bar-neon-${dataKey}`}
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          {/* Outer glow - large, soft, colored */}
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="outerBlur" />
          <feColorMatrix
            in="outerBlur"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 0.8 0"
            result="outerGlow"
          />

          {/* Middle glow - medium, brighter */}
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="middleBlur" />
          <feColorMatrix
            in="middleBlur"
            type="matrix"
            values="1 0 0 0 0.05
                    0 1 0 0 0.05
                    0 0 1 0 0.05
                    0 0 0 1.2 0"
            result="middleGlow"
          />

          {/* White core - very tight, bright white center */}
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="coreBlur" />
          <feColorMatrix
            in="coreBlur"
            type="matrix"
            values="0 0 0 0 1
                    0 0 0 0 1
                    0 0 0 0 1
                    0 0 0 1 0"
            result="whiteCore"
          />

          <feMerge>
            <feMergeNode in="outerGlow" />
            <feMergeNode in="middleGlow" />
            <feMergeNode in="whiteCore" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      ))}
    </>
  );
};

// Generate gradient stops with smooth easing for loading animation
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

/**
 * Hook to manage loading data with pixel-perfect shimmer synchronization.
 */
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

/**
 * Loading bar pattern with animated skeleton effect
 */
const LoadingBarPatternStyle = ({
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

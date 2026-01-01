"use client";

import {
  axisValueToPercentFormatter,
  type ChartConfig,
  ChartContainer,
  getColorsCount,
  getLoadingData,
  LoadingIndicator,
} from "@/components/evilcharts/ui/chart";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartTooltip, ChartTooltipContent } from "@/components/evilcharts/ui/tooltip";
import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { ChartLegend, ChartLegendContent } from "@/components/evilcharts/ui/legend";
import { ChartDot, DotVariant } from "@/components/dot";

// Constants
const STROKE_WIDTH = 0.8;
const LOADING_AREA_DATA_KEY = "loading";
const LOADING_ANIMATION_DURATION = 2500; // in milliseconds CAUTION: must be more than 2000ms to match animation keyframes

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
  loadingPoints?: number;
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
  loadingPoints,
}: EvilAreaChartProps<TData, TConfig>) {
  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(defaultSelectedDataKey);
  const loadingData = useLoadingData(isLoading, loadingPoints, LOADING_ANIMATION_DURATION);

  const isExpanded = type === "expanded";
  const isStacked = type === "stacked" || type === "expanded";

  return (
    <ChartContainer className={className} config={chartConfig}>
      <LoadingIndicator isLoading={isLoading} />
      <AreaChart
        accessibilityLayer
        stackOffset={isExpanded ? "expand" : undefined}
        data={isLoading ? loadingData : data}
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
        {xDataKey && !isLoading && (
          <XAxis
            dataKey={xDataKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            {...xAxisProps}
          />
        )}
        {yDataKey && !isLoading && (
          <YAxis
            dataKey={yDataKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width="auto"
            tickFormatter={
              type === "expanded" ? axisValueToPercentFormatter : yAxisProps?.tickFormatter
            }
            {...yAxisProps}
          />
        )}
        {!hideTooltip && !isLoading && (
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
                stroke={`url(#evil-area-chart-colors-${dataKey})`}
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
        {/* ======== LOADING AREA ======== */}
        {isLoading && (
          <Area
            type={areaType}
            dataKey={LOADING_AREA_DATA_KEY}
            fillOpacity={0.05}
            fill="currentColor"
            stroke="currentColor"
            strokeOpacity={0.5}
            isAnimationActive={false}
            legendType="none"
            tooltipType="none"
            activeDot={false}
            dot={false}
            style={{ mask: "url(#evil-area-chart-loading-mask)" }}
          />
        )}
        {/* ======== CHART STYLES ======== */}
        <defs>
          {isLoading && <LoadingAreaPatternStyle />}
          {/* Shared horizontal color gradient - always rendered for stroke and all variants */}
          <HorizontalColorGradientStyle chartConfig={chartConfig} />
          {/* Variant-specific styles */}
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

// Shared horizontal color gradient (left to right) - used by all variants and stroke
// This is ALWAYS rendered so colors are available for any variant
const HorizontalColorGradientStyle = ({ chartConfig }: { chartConfig: ChartConfig }) => {
  return (
    <>
      {Object.entries(chartConfig).map(([dataKey, config]) => {
        const colorsCount = getColorsCount(config);

        return (
          <linearGradient
            key={`evil-area-chart-colors-${dataKey}`}
            id={`evil-area-chart-colors-${dataKey}`}
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            {colorsCount === 1 ? (
              // Single color: same color at start and end
              <>
                <stop offset="0%" stopColor={`var(--color-${dataKey}-0)`} />
                <stop offset="100%" stopColor={`var(--color-${dataKey}-0)`} />
              </>
            ) : (
              // Multiple colors: distribute evenly
              // Fallback to first color if index doesn't exist in current theme
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

// Linear gradient variant - adds vertical fade mask on top of the shared color gradient
const LinearGradientStyle = ({ chartConfig }: { chartConfig: ChartConfig }) => {
  return (
    <>
      {/* Vertical fade gradient for mask */}
      <linearGradient id="evil-area-chart-vertical-fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity={0.1} />
        <stop offset="100%" stopColor="white" stopOpacity={0} />
      </linearGradient>

      {Object.keys(chartConfig).map((dataKey) => (
        <g key={`evil-area-chart-gradient-group-${dataKey}`}>
          {/* Mask for vertical fade (top visible, bottom transparent) */}
          <mask id={`evil-area-chart-gradient-mask-${dataKey}`}>
            <rect width="100%" height="100%" fill="url(#evil-area-chart-vertical-fade)" />
          </mask>

          {/* Pattern combining shared color gradient + vertical mask */}
          <pattern
            id={`evil-area-chart-gradient-${dataKey}`}
            patternUnits="userSpaceOnUse"
            width="100%"
            height="100%"
          >
            <rect
              width="100%"
              height="100%"
              fill={`url(#evil-area-chart-colors-${dataKey})`}
              mask={`url(#evil-area-chart-gradient-mask-${dataKey})`}
            />
          </pattern>
        </g>
      ))}
    </>
  );
};

// Reverse gradient for the area chart - vertical fade (top transparent, bottom visible)
const ReverseGradientStyle = ({ chartConfig }: { chartConfig: ChartConfig }) => {
  return (
    <>
      {/* Vertical reverse fade gradient for mask */}
      <linearGradient id="evil-area-chart-vertical-fade-reverse" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity={0} />
        <stop offset="100%" stopColor="white" stopOpacity={0.1} />
      </linearGradient>

      {Object.keys(chartConfig).map((dataKey) => (
        <g key={`evil-area-chart-gradient-reverse-group-${dataKey}`}>
          {/* Mask for reverse vertical fade */}
          <mask id={`evil-area-chart-gradient-reverse-mask-${dataKey}`}>
            <rect width="100%" height="100%" fill="url(#evil-area-chart-vertical-fade-reverse)" />
          </mask>

          {/* Pattern: horizontal gradient + reverse vertical mask */}
          <pattern
            id={`evil-area-chart-gradient-reverse-${dataKey}`}
            patternUnits="userSpaceOnUse"
            width="100%"
            height="100%"
          >
            <rect
              width="100%"
              height="100%"
              fill={`url(#evil-area-chart-colors-${dataKey})`}
              mask={`url(#evil-area-chart-gradient-reverse-mask-${dataKey})`}
            />
          </pattern>
        </g>
      ))}
    </>
  );
};

// Lines pattern for the area chart - diagonal lines with gradient
const LinesPatternStyle = ({ chartConfig }: { chartConfig: ChartConfig }) => {
  return (
    <>
      {/* Shared diagonal lines pattern for mask */}
      <pattern
        id="evil-area-chart-lines-mask-pattern"
        patternUnits="userSpaceOnUse"
        width="5"
        height="5"
        patternTransform="rotate(45)"
      >
        <line x1="0" y1="0" x2="0" y2="5" stroke="white" strokeWidth="1" />
      </pattern>

      {Object.keys(chartConfig).map((dataKey) => (
        <g key={`evil-area-chart-lines-group-${dataKey}`}>
          {/* Mask using diagonal lines */}
          <mask id={`evil-area-chart-lines-mask-${dataKey}`}>
            <rect
              width="100%"
              height="100%"
              fill="url(#evil-area-chart-lines-mask-pattern)"
              fillOpacity="0.3"
            />
          </mask>

          {/* Pattern: gradient fill masked by diagonal lines */}
          <pattern
            id={`evil-area-chart-lines-${dataKey}`}
            patternUnits="userSpaceOnUse"
            width="100%"
            height="100%"
          >
            <rect
              width="100%"
              height="100%"
              fill={`url(#evil-area-chart-colors-${dataKey})`}
              mask={`url(#evil-area-chart-lines-mask-${dataKey})`}
            />
          </pattern>
        </g>
      ))}
    </>
  );
};

// Solid pattern for the area chart - uniform opacity with gradient
const SolidPatternStyle = ({ chartConfig }: { chartConfig: ChartConfig }) => {
  return (
    <>
      {/* Uniform opacity mask for solid fill */}
      <linearGradient id="evil-area-chart-solid-mask-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity={0.1} />
        <stop offset="100%" stopColor="white" stopOpacity={0.1} />
      </linearGradient>

      {Object.keys(chartConfig).map((dataKey) => (
        <g key={`evil-area-chart-solid-group-${dataKey}`}>
          {/* Mask for uniform opacity */}
          <mask id={`evil-area-chart-solid-mask-${dataKey}`}>
            <rect width="100%" height="100%" fill="url(#evil-area-chart-solid-mask-gradient)" />
          </mask>

          {/* Pattern: gradient fill with uniform opacity mask */}
          <pattern
            id={`evil-area-chart-solid-${dataKey}`}
            patternUnits="userSpaceOnUse"
            width="100%"
            height="100%"
          >
            <rect
              width="100%"
              height="100%"
              fill={`url(#evil-area-chart-colors-${dataKey})`}
              mask={`url(#evil-area-chart-solid-mask-${dataKey})`}
            />
          </pattern>
        </g>
      ))}
    </>
  );
};

// Dotted pattern for the area chart - dots with gradient
const DottedPatternStyle = ({ chartConfig }: { chartConfig: ChartConfig }) => {
  return (
    <>
      {/* Shared dots pattern for mask */}
      <pattern
        id="evil-area-chart-dotted-mask-pattern"
        x="0"
        y="0"
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="4" cy="4" r="0.5" fill="white" />
      </pattern>

      {Object.keys(chartConfig).map((dataKey) => (
        <g key={`evil-area-chart-dotted-group-${dataKey}`}>
          {/* Mask using dots pattern */}
          <mask id={`evil-area-chart-dotted-mask-${dataKey}`}>
            <rect
              width="100%"
              height="100%"
              fill="url(#evil-area-chart-dotted-mask-pattern)"
              fillOpacity="0.5"
            />
          </mask>

          {/* Pattern: gradient fill masked by dots */}
          <pattern
            id={`evil-area-chart-dotted-${dataKey}`}
            patternUnits="userSpaceOnUse"
            width="100%"
            height="100%"
          >
            <rect
              width="100%"
              height="100%"
              fill={`url(#evil-area-chart-colors-${dataKey})`}
              mask={`url(#evil-area-chart-dotted-mask-${dataKey})`}
            />
          </pattern>
        </g>
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
      {/* Shared diagonal lines pattern for mask (white lines) */}
      <pattern
        id="evil-area-chart-unselected-lines-mask-pattern"
        patternUnits="userSpaceOnUse"
        width="5"
        height="5"
        patternTransform="rotate(45)"
      >
        <line x1="0" y1="0" x2="0" y2="5" stroke="white" strokeWidth="1" />
      </pattern>

      {Object.keys(chartConfig).map((dataKey) => {
        const isSelected = selectedDataKey === dataKey;
        if (isSelected) return null;

        return (
          <g key={`evil-area-chart-unselected-group-${dataKey}`}>
            {/* Mask using diagonal lines pattern */}
            <mask id={`evil-area-chart-unselected-mask-${dataKey}`}>
              <rect
                width="100%"
                height="100%"
                fill="url(#evil-area-chart-unselected-lines-mask-pattern)"
                fillOpacity="0.3"
              />
            </mask>

            {/* Pattern: gradient fill masked by diagonal lines */}
            <pattern
              id={`evil-area-chart-unselected-${dataKey}`}
              patternUnits="userSpaceOnUse"
              width="100%"
              height="100%"
            >
              <rect
                width="100%"
                height="100%"
                fill={`url(#evil-area-chart-colors-${dataKey})`}
                mask={`url(#evil-area-chart-unselected-mask-${dataKey})`}
              />
            </pattern>
          </g>
        );
      })}
    </>
  );
};

// Hatched pattern with striped gradient effect
const HatchedPatternStyle = ({ chartConfig }: { chartConfig: ChartConfig }) => {
  return (
    <>
      {/* Shared hatched stripes mask pattern */}
      <linearGradient id="evil-area-chart-hatched-stripe-gradient" x1="0" y1="0" x2="1" y2="0">
        <stop offset="50%" stopColor="white" stopOpacity={0.2} />
        <stop offset="50%" stopColor="white" stopOpacity={1} />
      </linearGradient>
      <pattern
        id="evil-area-chart-hatched-mask-pattern"
        x="0"
        y="0"
        width="20"
        height="10"
        patternUnits="userSpaceOnUse"
        overflow="visible"
        patternTransform="rotate(20)"
      >
        <rect width="20" height="10" fill="url(#evil-area-chart-hatched-stripe-gradient)" />
      </pattern>

      {Object.keys(chartConfig).map((dataKey) => (
        <g key={`evil-area-chart-hatched-group-${dataKey}`}>
          {/* Mask using hatched stripes */}
          <mask id={`evil-area-chart-hatched-mask-${dataKey}`}>
            <rect
              width="100%"
              height="100%"
              fill="url(#evil-area-chart-hatched-mask-pattern)"
              fillOpacity="0.2"
            />
          </mask>

          {/* Pattern: gradient fill masked by hatched stripes */}
          <pattern
            id={`evil-area-chart-hatched-pattern-${dataKey}`}
            patternUnits="userSpaceOnUse"
            width="100%"
            height="100%"
          >
            <rect
              width="100%"
              height="100%"
              fill={`url(#evil-area-chart-colors-${dataKey})`}
              mask={`url(#evil-area-chart-hatched-mask-${dataKey})`}
            />
          </pattern>
        </g>
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
    const t = i / (steps - 1); // 0 to 1
    // Sine-based bell curve easing: peaks at center (t=0.5), smooth falloff at edges
    const eased = Math.sin(t * Math.PI) ** 2;
    const opacity = minOpacity + eased * (maxOpacity - minOpacity);
    return { offset: `${(t * 100).toFixed(0)}%`, opacity: Number(opacity.toFixed(3)) };
  });
};

/**
 * Hook to manage loading data with pixel-perfect shimmer synchronization.
 *
 * The shimmer animation works as follows:
 * - Pattern width = animationDuration / 1000 (e.g., 2.5 for 2500ms)
 * - The gradient (shimmer) itself has width = 1 within the pattern
 * - Animation: x goes from 0 to patternWidth over the duration
 * - The visible chart area is normalized to 0-1 in objectBoundingBox units
 *
 * Timeline for a 2500ms animation with patternWidth = 2.5:
 * - t=0ms:     x=0, shimmer enters at left edge
 * - t=1000ms:  x=1, shimmer has fully exited the right edge
 * - t=2500ms:  x=2.5, animation cycle completes, next shimmer enters
 *
 * To ensure seamless transitions, we swap data exactly when the shimmer
 * has fully exited the visible area (x >= 1), which occurs at:
 * exitTime = (1 / patternWidth) * animationDuration
 *
 * For 2500ms with patternWidth=2.5: exitTime = (1/2.5) * 2500 = 1000ms
 *
 * The data swap timing:
 * - First swap: at exitTime (when first shimmer exits)
 * - Subsequent swaps: every animationDuration after the first swap
 *   (aligned to when each subsequent shimmer exits)
 */
export function useLoadingData(
  isLoading: boolean,
  loadingPoints: number = 10,
  loadingAnimationDuration: number = LOADING_ANIMATION_DURATION,
) {
  const [loadingDataKey, setLoadingDataKey] = useState(false);

  useEffect(() => {
    if (!isLoading) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    // Calculate pattern width (same formula as LoadingAreaPatternStyle)
    const patternWidth = loadingAnimationDuration / 1000;

    // Calculate when shimmer fully exits the visible area (0-1 range)
    // The gradient has width=1, so it fully exits when x >= 1
    // Since x animates linearly from 0 to patternWidth over animationDuration:
    // exitTime = (1 / patternWidth) * animationDuration = 1000ms (always)
    const shimmerExitTime = (1 / patternWidth) * loadingAnimationDuration;

    // First data swap happens when shimmer exits
    const initialTimeoutId = setTimeout(() => {
      setLoadingDataKey((prev) => !prev);

      // Start interval AFTER first swap, so subsequent swaps are perfectly aligned
      // Each subsequent shimmer takes exactly animationDuration to complete its cycle
      // We swap when it exits (at the same relative point in each cycle)
      intervalId = setInterval(() => {
        setLoadingDataKey((prev) => !prev);
      }, loadingAnimationDuration);
    }, shimmerExitTime);

    return () => {
      clearTimeout(initialTimeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoading, loadingAnimationDuration]);

  const loadingData = useMemo(
    () => getLoadingData(loadingPoints),
    // loadingDataKey triggers re-computation when shimmer exits
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadingPoints, loadingDataKey],
  );

  return loadingData;
}

// Loading area pattern with animated skeleton effect - uses mask to clip both fill AND stroke
const LoadingAreaPatternStyle = () => {
  const width = LOADING_ANIMATION_DURATION / 1000;
  const gradientStops = generateEasedGradientStops();

  return (
    <>
      {/* Gradient for smooth fade: edges dim, middle bright for sweep effect */}
      <linearGradient id="evil-area-chart-loading-mask-gradient" x1="0" y1="0" x2="1" y2="0">
        {gradientStops.map(({ offset, opacity }) => (
          <stop key={offset} offset={offset} stopColor="white" stopOpacity={opacity} />
        ))}
      </linearGradient>
      <pattern
        id="evil-area-chart-loading-mask-pattern"
        patternUnits="objectBoundingBox"
        patternContentUnits="objectBoundingBox"
        patternTransform="rotate(25)"
        width={width}
        height="1"
        x="0"
        y="0"
      >
        <rect x="0" y="0" width="1" height="1" fill="url(#evil-area-chart-loading-mask-gradient)" />
        <animate
          attributeName="x"
          values={`0;${width}`}
          keyTimes="0;1"
          dur={`${LOADING_ANIMATION_DURATION}ms`}
          repeatCount="indefinite"
        />
      </pattern>
      {/* Masking */}
      <mask id="evil-area-chart-loading-mask" maskUnits="userSpaceOnUse">
        <rect width="100%" height="100%" fill="url(#evil-area-chart-loading-mask-pattern)" />
      </mask>
    </>
  );
};

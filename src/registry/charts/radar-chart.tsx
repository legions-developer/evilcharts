"use client";

import {
  type ChartConfig,
  ChartContainer,
  getColorsCount,
  LoadingIndicator,
} from "@/registry/ui/chart";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from "recharts";
import { useEffect, useId, useMemo, useState, type ComponentProps } from "react";
import { ChartTooltip, ChartTooltipContent } from "@/registry/ui/tooltip";
import { ChartLegend, ChartLegendContent } from "@/registry/ui/legend";

// Loading animation constants
const LOADING_POINTS = 6;
const LOADING_ANIMATION_DURATION = 1500;

// Constants
const DEFAULT_FILL_OPACITY = 0.3;

type ChartProps = ComponentProps<typeof RadarChart>;
type RadarProps = ComponentProps<typeof Radar>;
type PolarGridProps = ComponentProps<typeof PolarGrid>;

type RadarVariant = "filled" | "lines";

// Extract only keys from TData where the value is a number
type NumericDataKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

type EvilRadarChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = {
  // Data
  data: TData[];
  dataKey: keyof TData & string; // The key for the angle axis (e.g., "month", "category")
  chartConfig: TConfig;
  className?: string;
  chartProps?: ChartProps;
  radarProps?: Omit<RadarProps, "dataKey">;
  polarGridProps?: PolarGridProps;

  // Variant
  variant?: RadarVariant;
  fillOpacity?: number;

  // Axes
  hideAngleAxis?: boolean;
  hideRadiusAxis?: boolean;
  hideGrid?: boolean;
  gridType?: "polygon" | "circle";

  // Hide Stuffs
  hideTooltip?: boolean;
  hideLegend?: boolean;
  hideDots?: boolean;

  // Interactive Stuffs
  isClickable?: boolean;
  isLoading?: boolean;

  // Glow Effects
  glowingRadars?: NumericDataKeys<TData>[];
  neonRadars?: NumericDataKeys<TData>[];
};

export function EvilRadarChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>({
  data,
  dataKey,
  chartConfig,
  className,
  chartProps,
  radarProps,
  polarGridProps,
  variant = "filled",
  fillOpacity = DEFAULT_FILL_OPACITY,
  hideAngleAxis = false,
  hideRadiusAxis = true,
  hideGrid = false,
  gridType = "polygon",
  hideTooltip = false,
  hideLegend = false,
  hideDots = false,
  isClickable = false,
  isLoading = false,
  glowingRadars = [],
  neonRadars = [],
}: EvilRadarChartProps<TData, TConfig>) {
  const [selectedRadar, setSelectedRadar] = useState<string | null>(null);
  const chartId = useId().replace(/:/g, "");
  const loadingData = useLoadingData(isLoading, dataKey);

  // Get radar data keys from chartConfig
  const radarDataKeys = Object.keys(chartConfig);

  return (
    <ChartContainer className={className} config={chartConfig}>
      <LoadingIndicator isLoading={isLoading} />
      <RadarChart
        id="evil-charts-radar-chart"
        data={isLoading ? loadingData : data}
        {...chartProps}
      >
        {!hideGrid && (
          <PolarGrid
            gridType={gridType}
            stroke="currentColor"
            strokeOpacity={0.2}
            strokeDasharray="3 4"
            {...polarGridProps}
          />
        )}

        {!hideAngleAxis && !isLoading && (
          <PolarAngleAxis
            dataKey={dataKey}
            tick={{ fill: "currentColor", fontSize: 12 }}
            tickLine={false}
          />
        )}

        {!hideRadiusAxis && !isLoading && (
          <PolarRadiusAxis
            tick={{ fill: "currentColor", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
        )}

        {!hideLegend && !isLoading && (
          <ChartLegend
            verticalAlign="bottom"
            align="center"
            content={
              <ChartLegendContent
                selected={selectedRadar}
                onSelectChange={setSelectedRadar}
                isClickable={isClickable}
              />
            }
          />
        )}

        {!hideTooltip && !isLoading && (
          <ChartTooltip cursor={false} content={<ChartTooltipContent selected={selectedRadar} />} />
        )}

        {/* Render radars for each data key in chartConfig */}
        {!isLoading &&
          radarDataKeys.map((radarKey) => {
            const isGlowing = glowingRadars.includes(radarKey as NumericDataKeys<TData>);
            const isNeon = neonRadars.includes(radarKey as NumericDataKeys<TData>);
            const isSelected = selectedRadar === null || selectedRadar === radarKey;
            const opacity = isClickable && !isSelected ? 0.2 : 1;

            const getFilter = () => {
              if (isNeon) return `url(#${chartId}-radar-neon-${radarKey})`;
              if (isGlowing) return `url(#${chartId}-radar-glow-${radarKey})`;
              return undefined;
            };

            return (
              <Radar
                key={radarKey}
                dataKey={radarKey}
                stroke={`url(#${chartId}-radar-stroke-${radarKey})`}
                fill={variant === "filled" ? `url(#${chartId}-radar-fill-${radarKey})` : "none"}
                fillOpacity={variant === "filled" ? fillOpacity * opacity : 0}
                strokeOpacity={opacity}
                strokeWidth={1}
                dot={!hideDots}
                filter={getFilter()}
                style={isClickable ? { cursor: "pointer" } : undefined}
                onClick={() => {
                  if (!isClickable) return;
                  setSelectedRadar(selectedRadar === radarKey ? null : radarKey);
                }}
                className="transition-opacity duration-200"
                {...radarProps}
              />
            );
          })}

        {/* Loading state radar */}
        {isLoading && (
          <Radar
            dataKey="value"
            stroke="currentColor"
            fill="currentColor"
            fillOpacity={0.1}
            strokeOpacity={0.3}
            strokeWidth={2}
            dot={false}
            isAnimationActive
            animationDuration={LOADING_ANIMATION_DURATION}
            animationEasing="ease-in-out"
          />
        )}

        {/* ======== CHART STYLES ======== */}
        <defs>
          {/* Stroke and fill gradients for each radar */}
          <RadarGradientStyle chartConfig={chartConfig} chartId={chartId} />

          {/* Glow filters */}
          {glowingRadars.length > 0 && (
            <GlowFilterStyle chartId={chartId} glowingRadars={glowingRadars as string[]} />
          )}

          {/* Neon filters */}
          {neonRadars.length > 0 && (
            <NeonFilterStyle chartId={chartId} neonRadars={neonRadars as string[]} />
          )}
        </defs>
      </RadarChart>
    </ChartContainer>
  );
}

// ========================================
// LOADING STATE
// ========================================

function generateLoadingData(dataKey: string) {
  const categories = ["A", "B", "C", "D", "E", "F"];
  return categories.slice(0, LOADING_POINTS).map((cat) => ({
    [dataKey]: cat,
    value: 30 + Math.random() * 70,
  }));
}

function useLoadingData(isLoading: boolean, dataKey: string) {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, LOADING_ANIMATION_DURATION);

    return () => clearInterval(interval);
  }, [isLoading]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadingData = useMemo(() => generateLoadingData(dataKey), [dataKey, refreshKey]);

  return loadingData;
}

// ========================================
// GRADIENT STYLES
// ========================================

const RadarGradientStyle = ({
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
          <g key={dataKey}>
            {/* Stroke gradient */}
            <linearGradient id={`${chartId}-radar-stroke-${dataKey}`} x1="0" y1="0" x2="1" y2="1">
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

            {/* Fill gradient (radial for better effect) */}
            <radialGradient id={`${chartId}-radar-fill-${dataKey}`} cx="50%" cy="50%" r="50%">
              {colorsCount === 1 ? (
                <>
                  <stop offset="0%" stopColor={`var(--color-${dataKey}-0)`} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={`var(--color-${dataKey}-0)`} stopOpacity={0.3} />
                </>
              ) : (
                Array.from({ length: colorsCount }, (_, index) => (
                  <stop
                    key={index}
                    offset={`${(index / (colorsCount - 1)) * 100}%`}
                    stopColor={`var(--color-${dataKey}-${index}, var(--color-${dataKey}-0))`}
                    stopOpacity={index === 0 ? 0.8 : 0.3}
                  />
                ))
              )}
            </radialGradient>
          </g>
        );
      })}
    </>
  );
};

// ========================================
// GLOW/NEON FILTER STYLES
// ========================================

const GlowFilterStyle = ({
  chartId,
  glowingRadars,
}: {
  chartId: string;
  glowingRadars: string[];
}) => {
  return (
    <>
      {glowingRadars.map((radarKey) => (
        <filter
          key={`${chartId}-radar-glow-${radarKey}`}
          id={`${chartId}-radar-glow-${radarKey}`}
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.6 0"
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

const NeonFilterStyle = ({ chartId, neonRadars }: { chartId: string; neonRadars: string[] }) => {
  return (
    <>
      {neonRadars.map((radarKey) => (
        <filter
          key={`${chartId}-radar-neon-${radarKey}`}
          id={`${chartId}-radar-neon-${radarKey}`}
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="outerBlur" />
          <feColorMatrix
            in="outerBlur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0"
            result="outerGlow"
          />
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="middleBlur" />
          <feColorMatrix
            in="middleBlur"
            type="matrix"
            values="1 0 0 0 0.05  0 1 0 0 0.05  0 0 1 0 0.05  0 0 0 1.2 0"
            result="middleGlow"
          />
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="coreBlur" />
          <feColorMatrix
            in="coreBlur"
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"
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

"use client";

import {
  type ChartConfig,
  ChartContainer,
  getColorsCount,
  LoadingIndicator,
} from "@/registry/ui/chart";
import { ChartTooltip, ChartTooltipContent } from "@/registry/ui/tooltip";
import { ChartLegend, ChartLegendContent } from "@/registry/ui/legend";
import { useId, useState, type ComponentProps } from "react";
import { Cell, LabelList, Pie, PieChart } from "recharts";

// Constants
const DEFAULT_INNER_RADIUS = 0;
const DEFAULT_OUTER_RADIUS = "80%";
const DEFAULT_CORNER_RADIUS = 0;
const DEFAULT_PADDING_ANGLE = 0;

type ChartProps = ComponentProps<typeof PieChart>;
type PieProps = ComponentProps<typeof Pie>;
type LabelListProps = ComponentProps<typeof LabelList>;

type EvilPieChartProps<TData extends Record<string, unknown>> = {
  // Data
  data: TData[];
  dataKey: keyof TData & string;
  nameKey: keyof TData & string;
  chartConfig: ChartConfig;
  className?: string;
  chartProps?: ChartProps;
  pieProps?: Omit<PieProps, "data" | "dataKey" | "nameKey">;

  // Pie Shape
  innerRadius?: number | string;
  outerRadius?: number | string;
  cornerRadius?: number;
  paddingAngle?: number;
  startAngle?: number;
  endAngle?: number;

  // Labels
  showLabels?: boolean;
  labelKey?: keyof TData & string;
  labelListProps?: Omit<LabelListProps, "dataKey">;

  // Hide Stuffs
  hideTooltip?: boolean;
  hideLegend?: boolean;

  // Interactive Stuffs
  isClickable?: boolean;
  isLoading?: boolean;

  // Glow Effects
  glowingSectors?: string[];
  neonSectors?: string[];
};

export function EvilPieChart<TData extends Record<string, unknown>>({
  data,
  dataKey,
  nameKey,
  chartConfig,
  className,
  chartProps,
  pieProps,
  innerRadius = DEFAULT_INNER_RADIUS,
  outerRadius = DEFAULT_OUTER_RADIUS,
  cornerRadius = DEFAULT_CORNER_RADIUS,
  paddingAngle = DEFAULT_PADDING_ANGLE,
  startAngle = 0,
  endAngle = 360,
  showLabels = false,
  labelKey,
  labelListProps,
  hideTooltip = false,
  hideLegend = false,
  isClickable = false,
  isLoading = false,
  glowingSectors = [],
  neonSectors = [],
}: EvilPieChartProps<TData>) {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const chartId = useId().replace(/:/g, "");

  // Prepare data with fill colors referencing gradients
  const preparedData = data.map((item) => {
    const sectorName = item[nameKey] as string;
    return {
      ...item,
      fill: `url(#${chartId}-pie-colors-${sectorName})`,
    };
  });

  return (
    <ChartContainer className={className} config={chartConfig}>
      <LoadingIndicator isLoading={isLoading} />
      <PieChart id="evil-charts-pie-chart" accessibilityLayer {...chartProps}>
        {!hideLegend && (
          <ChartLegend
            verticalAlign="bottom"
            align="center"
            content={
              <ChartLegendContent
                selected={selectedSector}
                onSelectChange={setSelectedSector}
                isClickable={isClickable}
                nameKey={nameKey}
              />
            }
          />
        )}
        {!hideTooltip && !isLoading && (
          <ChartTooltip content={<ChartTooltipContent nameKey={nameKey} hideLabel />} />
        )}
        <Pie
          data={isLoading ? getLoadingPieData() : preparedData}
          dataKey={isLoading ? "value" : dataKey}
          nameKey={isLoading ? "name" : nameKey}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          cornerRadius={cornerRadius}
          paddingAngle={paddingAngle}
          startAngle={startAngle}
          endAngle={endAngle}
          strokeWidth={0}
          style={isClickable ? { cursor: "pointer" } : undefined}
          onClick={(_, index) => {
            if (!isClickable || isLoading) return;
            const clickedName = data[index]?.[nameKey] as string;
            setSelectedSector(selectedSector === clickedName ? null : clickedName);
          }}
          {...pieProps}
        >
          {!isLoading &&
            data.map((item, index) => {
              const sectorName = item[nameKey] as string;
              const isGlowing = glowingSectors.includes(sectorName);
              const isNeon = neonSectors.includes(sectorName);
              const isSelected = selectedSector === null || selectedSector === sectorName;

              const getFilter = () => {
                if (isNeon) return `url(#${chartId}-pie-neon-${sectorName})`;
                if (isGlowing) return `url(#${chartId}-pie-glow-${sectorName})`;
                return undefined;
              };

              return (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#${chartId}-pie-colors-${sectorName})`}
                  filter={getFilter()}
                  opacity={isClickable && !isSelected ? 0.3 : 1}
                  className="transition-opacity duration-200"
                />
              );
            })}
          {isLoading &&
            getLoadingPieData().map((_, index) => (
              <Cell key={`loading-cell-${index}`} fill="currentColor" fillOpacity={0.15} />
            ))}
          {showLabels && !isLoading && (
            <LabelList
              dataKey={labelKey ?? dataKey}
              stroke="none"
              fontSize={12}
              fontWeight={500}
              fill="currentColor"
              className="fill-background"
              {...labelListProps}
            />
          )}
        </Pie>

        {/* ======== CHART STYLES ======== */}
        <defs>
          {/* Radial color gradients for each sector */}
          <RadialColorGradientStyle chartConfig={chartConfig} chartId={chartId} />

          {/* Glow filters */}
          {glowingSectors.length > 0 && (
            <GlowFilterStyle chartId={chartId} glowingSectors={glowingSectors} />
          )}

          {/* Neon filters */}
          {neonSectors.length > 0 && (
            <NeonFilterStyle chartId={chartId} neonSectors={neonSectors} />
          )}
        </defs>
      </PieChart>
    </ChartContainer>
  );
}

// ========================================
// LOADING STATE
// ========================================

function getLoadingPieData() {
  return [
    { name: "loading1", value: 25 },
    { name: "loading2", value: 25 },
    { name: "loading3", value: 25 },
    { name: "loading4", value: 25 },
  ];
}

// ========================================
// GRADIENT STYLES
// ========================================

// Radial color gradient for pie sectors
const RadialColorGradientStyle = ({
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
            key={`${chartId}-pie-colors-${dataKey}`}
            id={`${chartId}-pie-colors-${dataKey}`}
            x1="0"
            y1="0"
            x2="1"
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

// ========================================
// GLOW/NEON FILTER STYLES
// ========================================

const GlowFilterStyle = ({
  chartId,
  glowingSectors,
}: {
  chartId: string;
  glowingSectors: string[];
}) => {
  return (
    <>
      {glowingSectors.map((sectorName) => (
        <filter
          key={`${chartId}-pie-glow-${sectorName}`}
          id={`${chartId}-pie-glow-${sectorName}`}
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

const NeonFilterStyle = ({ chartId, neonSectors }: { chartId: string; neonSectors: string[] }) => {
  return (
    <>
      {neonSectors.map((sectorName) => (
        <filter
          key={`${chartId}-pie-neon-${sectorName}`}
          id={`${chartId}-pie-neon-${sectorName}`}
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

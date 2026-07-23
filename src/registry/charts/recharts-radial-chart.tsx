"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  RadialBar as RechartsRadialBar,
  RadialBarChart as RechartsRadialBarChart,
  Sector,
  type SectorProps,
} from "recharts";
import {
  ChartTooltip,
  ChartTooltipContent,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/registry/ui/recharts-tooltip";
import {
  type ChartConfig,
  ChartContainer,
  getColorsCount,
  LoadingIndicator,
} from "@/registry/ui/recharts-chart";
import { ChartLegend, ChartLegendContent, type ChartLegendVariant } from "@/registry/ui/recharts-legend";
import { ChartBackground, type BackgroundVariant } from "@/registry/ui/recharts-background";
import { TypedDataKey } from "recharts/types/util/typedDataKey";

// Constants
const DEFAULT_INNER_RADIUS = "30%";
const DEFAULT_OUTER_RADIUS = "100%";
const DEFAULT_CORNER_RADIUS = 5;
const DEFAULT_BAR_SIZE = 14;
const LOADING_BARS = 5;
// Stable empty-array reference so the `glowingBars` default doesn't change every render
const EMPTY_GLOWING_BARS: string[] = [];
const LOADING_ANIMATION_DURATION = 1500; // in milliseconds — interval between skeleton data changes

type RadialBarChartProps = ComponentProps<typeof RechartsRadialBarChart>;
type RadialBarRechartsProps = ComponentProps<typeof RechartsRadialBar>;

type RadialVariant = "full" | "semi";

// ─────────────────────────────────────────────────────────────────────────────
// Shared context
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared state for every part of the chart. Lifted into <EvilRadialChart /> so
 * that <RadialBar />, <Tooltip />, and <Legend /> can read it without prop
 * drilling. Sub-components are composed freely — the provider is the single
 * source of truth.
 */
type RadialChartContextValue = {
  config: ChartConfig; // colors + labels for every bar
  nameKey: string; // data key holding each bar's name
  chartId: string; // colon-free id scoping this chart's style defs
  isLoading: boolean; // whether the chart shows its loading skeleton
  selectedBar: string | null; // currently selected bar name, or null when none
  selectBar: (barName: string | null, value?: number) => void; // sets the selected bar
};

const RadialChartContext = createContext<RadialChartContextValue | null>(null);

// Reads the chart context, throwing a helpful error when used outside <EvilRadialChart />
function useRadialChart() {
  const context = use(RadialChartContext);

  if (!context) {
    throw new Error(
      "Radial chart parts (<RadialBar />, <Tooltip />, …) must be used within <EvilRadialChart />",
    );
  }

  return context;
}

// ─────────────────────────────────────────────────────────────────────────────
// Root container
// ─────────────────────────────────────────────────────────────────────────────

type EvilRadialChartBaseProps<TData extends Record<string, unknown>> = {
  config: ChartConfig; // bar colors + labels, keyed by each bar's name
  data: TData[]; // rows rendered by the chart — one bar per row
  nameKey: keyof TData & string; // data key holding each bar's name
  children: ReactNode; // composed parts — <RadialBar />, <Tooltip />, <Legend />
  className?: string; // extra classes for the chart container
  chartProps?: RadialBarChartProps; // escape hatch for the raw Recharts chart
  variant?: RadialVariant; // arc shape — full circle or half circle
  innerRadius?: number | string; // inner radius of the radial bars
  outerRadius?: number | string; // outer radius of the radial bars
  defaultSelectedDataKey?: string | null; // bar selected on first render
  onSelectionChange?: (selection: { dataKey: string; value: number } | null) => void; // fires when the selected bar changes
  isLoading?: boolean; // shows the animated loading skeleton
  backgroundVariant?: BackgroundVariant; // background pattern behind the chart
};

type EvilRadialChartProps<TData extends Record<string, unknown>> = EvilRadialChartBaseProps<TData>;

/**
 * Root of the composible radial chart. Owns the data, the shared context, the
 * loading skeleton, and the chart-wide arc shape. Everything visual — the
 * tooltip, legend, and the radial bar itself — is composed as children, so a
 * consumer renders exactly the parts they need.
 */
export function EvilRadialChart<TData extends Record<string, unknown>>({
  config,
  data,
  nameKey,
  children,
  className,
  chartProps,
  variant = "full",
  innerRadius = DEFAULT_INNER_RADIUS,
  outerRadius = DEFAULT_OUTER_RADIUS,
  defaultSelectedDataKey = null,
  onSelectionChange,
  isLoading = false,
  backgroundVariant,
}: EvilRadialChartProps<TData>) {
  const chartId = useId().replace(/:/g, ""); // colon-free id keeps CSS/SVG selectors valid
  const [selectedBar, setSelectedBar] = useState<string | null>(defaultSelectedDataKey);
  const loadingData = useLoadingData(isLoading);

  const variantConfig = getVariantConfig(variant);

  // Updates selection state and notifies the parent with the bar's value
  const selectBar = useCallback(
    (barName: string | null, value?: number) => {
      setSelectedBar(barName);
      onSelectionChange?.(barName === null ? null : { dataKey: barName, value: value ?? 0 });
    },
    [onSelectionChange],
  );

  // Real bars paint from a per-name gradient; the skeleton keeps the raw rows
  const preparedData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        fill: `url(#${chartId}-radial-colors-${item[nameKey] as string})`,
      })),
    [data, nameKey, chartId],
  );

  const contextValue = useMemo<RadialChartContextValue>(
    () => ({
      config,
      nameKey,
      chartId,
      isLoading,
      selectedBar,
      selectBar,
    }),
    [config, nameKey, chartId, isLoading, selectedBar, selectBar],
  );

  return (
    <RadialChartContext value={contextValue}>
      <ChartContainer className={className} config={config}>
        <LoadingIndicator isLoading={isLoading} />
        <RechartsRadialBarChart
          id={chartId}
          data={isLoading ? loadingData : preparedData}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={variantConfig.startAngle}
          endAngle={variantConfig.endAngle}
          cx={variantConfig.cx}
          cy={variantConfig.cy}
          {...chartProps}
        >
          {backgroundVariant && <ChartBackground variant={backgroundVariant} />}
          {children}
          {isLoading && <LoadingRadialBar />}
          <defs>
            <ColorGradientStyle config={config} chartId={chartId} />
          </defs>
        </RechartsRadialBarChart>
      </ChartContainer>
    </RadialChartContext>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composible parts
// ─────────────────────────────────────────────────────────────────────────────

type RadialBarProps = {
  dataKey: string; // value key — determines each bar's size
  cornerRadius?: number; // border radius of each bar's corners
  barSize?: number; // thickness of each radial bar
  showBackground?: boolean; // renders the unfilled track behind each bar
  isClickable?: boolean; // lets bars be selected by clicking them
  glowingBars?: string[]; // names of bars rendered with a soft glow
  radialBarProps?: Omit<RadialBarRechartsProps, "dataKey">; // escape hatch for raw Recharts RadialBar props
};

/**
 * The radial bar series. Each data row becomes one bar. The series generates
 * its own glow filter definitions under the chart's unique id, so glow effects
 * never collide with other charts on the page. Pass `glowingBars` to highlight
 * specific bars and `isClickable` to make bars selectable.
 */
export function RadialBar({
  dataKey,
  cornerRadius = DEFAULT_CORNER_RADIUS,
  barSize = DEFAULT_BAR_SIZE,
  showBackground = true,
  isClickable = false,
  glowingBars = EMPTY_GLOWING_BARS,
  radialBarProps,
}: RadialBarProps) {
  const { nameKey, chartId, isLoading, selectedBar, selectBar } = useRadialChart();

  // The root renders the skeleton bar while loading, so the real bar steps aside
  if (isLoading) return null;

  return (
    <>
      <RechartsRadialBar
        dataKey={dataKey as TypedDataKey<Record<string, unknown>>}
        cornerRadius={cornerRadius}
        barSize={barSize}
        background={showBackground}
        className="drop-shadow-sm"
        style={isClickable ? { cursor: "pointer" } : undefined}
        onClick={(payload, index) => {
          if (!isClickable) return;
          const entry = payload as Record<string, unknown>;
          const barName = (entry?.[nameKey] as string | undefined) ?? String(index);
          const value = Number(entry?.[dataKey] ?? 0);
          // Clicking the selected bar clears the selection, otherwise selects it
          selectBar(selectedBar === barName ? null : barName, value);
        }}
        shape={(props: SectorProps) => {
          const barName = (props as unknown as Record<string, unknown>)[nameKey] as string;
          const isGlowing = glowingBars.includes(barName);
          const isSelected = selectedBar === null || selectedBar === barName;

          return (
            <Sector
              {...props}
              filter={isGlowing ? `url(#${chartId}-radial-glow-${barName})` : undefined}
              opacity={isClickable && !isSelected ? 0.15 : 1}
              className="transition-opacity duration-200"
            />
          );
        }}
        {...radialBarProps}
      />
      <defs>
        {glowingBars.length > 0 && <GlowFilterStyle chartId={chartId} glowingBars={glowingBars} />}
      </defs>
    </>
  );
}

type TooltipProps = {
  variant?: TooltipVariant; // visual style of the tooltip surface
  roundness?: TooltipRoundness; // border-radius of the tooltip
  defaultIndex?: number; // data index shown by default with no hover
};

/**
 * The hover tooltip. Labels each bar by its name from context. Hidden
 * automatically while the chart is loading.
 */
export function Tooltip({ variant, roundness, defaultIndex }: TooltipProps) {
  const { nameKey, isLoading } = useRadialChart();

  if (isLoading) return null;

  return (
    <ChartTooltip
      defaultIndex={defaultIndex}
      cursor={false}
      content={
        <ChartTooltipContent nameKey={nameKey} hideLabel roundness={roundness} variant={variant} />
      }
    />
  );
}

type LegendProps = {
  variant?: ChartLegendVariant; // visual style of the legend indicators
  align?: "left" | "center" | "right"; // horizontal placement
  verticalAlign?: "top" | "middle" | "bottom"; // vertical placement
  isClickable?: boolean; // lets each entry toggle selection of its bar
};

/**
 * The bar legend. When `isClickable` is set, each entry toggles selection of
 * its bar, driving the shared selection state read by <RadialBar />. Hidden
 * automatically while the chart is loading.
 */
export function Legend({
  variant,
  align = "center",
  verticalAlign = "bottom",
  isClickable = false,
}: LegendProps) {
  const { nameKey, isLoading, selectedBar, selectBar } = useRadialChart();

  if (isLoading) return null;

  return (
    <ChartLegend
      verticalAlign={verticalAlign}
      align={align}
      content={
        <ChartLegendContent
          selected={selectedBar}
          onSelectChange={selectBar}
          isClickable={isClickable}
          nameKey={nameKey}
          variant={variant}
        />
      }
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Variant helpers
// ─────────────────────────────────────────────────────────────────────────────

// Returns the angle + center configuration for the chart's arc shape
function getVariantConfig(variant: RadialVariant) {
  switch (variant) {
    case "semi":
      return { startAngle: 180, endAngle: 0, cx: "50%", cy: "70%" };
    case "full":
    default:
      return { startAngle: 90, endAngle: -270, cx: "50%", cy: "50%" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Style definitions — scoped to the chart's unique id
// ─────────────────────────────────────────────────────────────────────────────

/** Diagonal color gradient applied to every radial bar, one per config key. */
const ColorGradientStyle = ({ config, chartId }: { config: ChartConfig; chartId: string }) => {
  return (
    <>
      {Object.entries(config).map(([dataKey, colorConfig]) => {
        const colorsCount = getColorsCount(colorConfig);

        return (
          <linearGradient
            key={`${chartId}-radial-colors-${dataKey}`}
            id={`${chartId}-radial-colors-${dataKey}`}
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
              Array.from({ length: colorsCount }, (_, index) => {
                const offset = `${(index / (colorsCount - 1)) * 100}%`;
                return (
                  <stop
                    key={offset}
                    offset={offset}
                    stopColor={`var(--color-${dataKey}-${index}, var(--color-${dataKey}-0))`}
                  />
                );
              })
            )}
          </linearGradient>
        );
      })}
    </>
  );
};

/** Soft outer-glow SVG filter, one per glowing bar. */
const GlowFilterStyle = ({ chartId, glowingBars }: { chartId: string; glowingBars: string[] }) => {
  return (
    <>
      {glowingBars.map((barName) => (
        <filter
          key={`${chartId}-radial-glow-${barName}`}
          id={`${chartId}-radial-glow-${barName}`}
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
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

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

// Builds random skeleton rows with values between 40 and 100
function generateLoadingData() {
  return Array.from({ length: LOADING_BARS }, (_, i) => ({
    name: `loading${i}`,
    value: 40 + Math.random() * 60,
  }));
}

// Hook to animate the loading skeleton data at fixed intervals
function useLoadingData(isLoading: boolean) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, LOADING_ANIMATION_DURATION);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Regenerate skeleton data whenever the interval ticks
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadingData = useMemo(() => generateLoadingData(), [tick]);

  return loadingData;
}

/**
 * The skeleton bar shown while the chart is loading. Rendered by the root in
 * place of the real <RadialBar />, with animated values and a muted fill.
 */
const LoadingRadialBar = () => {
  return (
    <RechartsRadialBar
      dataKey="value"
      cornerRadius={DEFAULT_CORNER_RADIUS}
      barSize={DEFAULT_BAR_SIZE}
      background
      isAnimationActive
      animationDuration={LOADING_ANIMATION_DURATION}
      animationEasing="ease-in-out"
      shape={(props: SectorProps) => <Sector {...props} fill="currentColor" fillOpacity={0.25} />}
    />
  );
};

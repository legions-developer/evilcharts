"use client";

import {
  type ChartConfig,
  ChartContainer,
  getColorsCount,
  LoadingIndicator,
} from "@/registry/ui/chart";
import {
  ChartTooltip,
  ChartTooltipContent,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/registry/ui/tooltip";
import { ChartLegend, ChartLegendContent, type ChartLegendVariant } from "@/registry/ui/legend";
import { ChartBackground, type BackgroundVariant } from "@/registry/ui/background";
import { ChartDot, type DotVariant } from "@/registry/ui/dot";
import {
  Children,
  createContext,
  isValidElement,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type ComponentProps,
  type FC,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  PolarAngleAxis as RechartsPolarAngleAxis,
  PolarGrid as RechartsPolarGrid,
  PolarRadiusAxis as RechartsPolarRadiusAxis,
  Radar as RechartsRadar,
  RadarChart as RechartsRadarChart,
} from "recharts";

// Constants
const STROKE_WIDTH = 1;
const DEFAULT_FILL_OPACITY = 0.3;
const LOADING_POINTS = 6;
const LOADING_ANIMATION_DURATION = 1500; // in milliseconds
const LOADING_RADAR_DATA_KEY = "value";

type RadarVariant = "filled" | "lines";

// ─────────────────────────────────────────────────────────────────────────────
// Shared context
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared state for every part of the chart. Lifted into <EvilRadarChart /> so that
 * <Radar />, <PolarAngleAxis />, <Legend />, and friends can read it without prop
 * drilling. Sub-components are composed freely — the provider is the single source
 * of truth.
 */
type RadarChartContextValue = {
  config: ChartConfig; // colors + labels for every series
  isLoading: boolean; // whether the chart shows its loading skeleton
  selectedDataKey: string | null; // currently selected series, or null when none
  selectDataKey: (dataKey: string | null) => void; // sets the selected series
};

const RadarChartContext = createContext<RadarChartContextValue | null>(null);

// Reads the chart context, throwing a helpful error when used outside <EvilRadarChart />
function useRadarChart() {
  const context = use(RadarChartContext);

  if (!context) {
    throw new Error(
      "Radar chart parts (<Radar />, <PolarAngleAxis />, …) must be used within <EvilRadarChart />",
    );
  }

  return context;
}

// ─────────────────────────────────────────────────────────────────────────────
// Root container
// ─────────────────────────────────────────────────────────────────────────────

// Validates that every config key also exists on the data row type
type ValidateConfigKeys<TData, TConfig> = {
  [K in keyof TConfig]: K extends keyof TData ? ChartConfig[string] : never;
};

type EvilRadarChartBaseProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = {
  config: TConfig & ValidateConfigKeys<TData, TConfig>; // series colors + labels
  data: TData[]; // rows rendered by the chart
  children: ReactNode; // composed parts — <Radar />, <PolarGrid />, <Legend />, …
  className?: string; // extra classes for the chart container
  chartProps?: ComponentProps<typeof RechartsRadarChart>; // escape hatch for the raw Recharts chart
  backgroundVariant?: BackgroundVariant; // background pattern drawn behind the chart
  defaultSelectedDataKey?: string | null; // series selected on first render
  onSelectionChange?: (selectedDataKey: string | null) => void; // fires when the selected series changes
  isLoading?: boolean; // shows the animated loading skeleton
  loadingPoints?: number; // number of points in the loading skeleton
};

type EvilRadarChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = EvilRadarChartBaseProps<TData, TConfig>;

/**
 * Root of the composible radar chart. Owns the data, the shared context, and the
 * loading skeleton. Everything visual — the polar grid, axes, tooltip, legend, and
 * the radars themselves — is composed as children, so a consumer renders exactly
 * the parts they need.
 */
export function EvilRadarChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>({
  config,
  data,
  children,
  className,
  chartProps,
  backgroundVariant,
  defaultSelectedDataKey = null,
  onSelectionChange,
  isLoading = false,
  loadingPoints,
}: EvilRadarChartProps<TData, TConfig>) {
  const chartId = useId().replace(/:/g, ""); // colon-free id keeps CSS/SVG selectors valid
  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(defaultSelectedDataKey);
  const loadingData = useLoadingData(isLoading, loadingPoints);

  // Updates selection state and notifies the parent
  const selectDataKey = useCallback(
    (newSelectedDataKey: string | null) => {
      setSelectedDataKey(newSelectedDataKey);
      onSelectionChange?.(newSelectedDataKey);
    },
    [onSelectionChange],
  );

  const contextValue = useMemo<RadarChartContextValue>(
    () => ({
      config,
      isLoading,
      selectedDataKey,
      selectDataKey,
    }),
    [config, isLoading, selectedDataKey, selectDataKey],
  );

  return (
    <RadarChartContext value={contextValue}>
      <ChartContainer className={className} config={config}>
        <LoadingIndicator isLoading={isLoading} />
        <RechartsRadarChart id={chartId} data={isLoading ? loadingData : data} {...chartProps}>
          {backgroundVariant && <ChartBackground variant={backgroundVariant} />}
          {children}
          {isLoading && <LoadingRadar />}
        </RechartsRadarChart>
      </ChartContainer>
    </RadarChartContext>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composible parts
// ─────────────────────────────────────────────────────────────────────────────

type RadarProps = {
  dataKey: string; // series key — must exist on the data and config
  variant?: RadarVariant; // fill style for this radar only
  fillOpacity?: number; // opacity of the filled area when `variant="filled"`
  isGlowing?: boolean; // adds a soft outer glow around this radar
  isClickable?: boolean; // lets this radar be selected by clicking it
  children?: ReactNode; // optional <Dot /> and <ActiveDot /> composition
  radarProps?: Omit<ComponentProps<typeof RechartsRadar>, "dataKey">; // escape hatch for raw Recharts Radar props
};

/**
 * A single radar series. Each <Radar /> is fully self-contained: it generates its
 * own stroke/fill gradients and glow filter under a unique id, so any number of
 * radars — each with its own variant, opacity, and clickability — can live in one
 * chart without style collisions. Compose <Dot /> and <ActiveDot /> inside it to
 * add point markers.
 */
export function Radar({
  dataKey,
  variant = "filled",
  fillOpacity = DEFAULT_FILL_OPACITY,
  isGlowing = false,
  isClickable = false,
  children,
  radarProps,
}: RadarProps) {
  const { config, isLoading, selectedDataKey, selectDataKey } = useRadarChart();
  const id = useId().replace(/:/g, ""); // unique id scopes this radar's style defs

  // The root renders the skeleton radar while loading, so real radars step aside
  if (isLoading) return null;

  const isSelected = selectedDataKey === null || selectedDataKey === dataKey;
  const opacity = isClickable && !isSelected ? 0.2 : 1;
  const isFilled = variant === "filled";

  const { dot, activeDot } = resolveDots(children, id, dataKey, opacity);

  return (
    <>
      <RechartsRadar
        dataKey={dataKey}
        stroke={`url(#${id}-radar-stroke-${dataKey})`}
        strokeOpacity={opacity}
        strokeWidth={STROKE_WIDTH}
        fill={isFilled ? `url(#${id}-radar-fill-${dataKey})` : "none"}
        fillOpacity={isFilled ? fillOpacity * opacity : 0}
        dot={dot}
        activeDot={activeDot}
        filter={isGlowing ? `url(#${id}-radar-glow-${dataKey})` : undefined}
        className="transition-opacity duration-200"
        style={isClickable ? { cursor: "pointer" } : undefined}
        onClick={() => {
          if (!isClickable) return;
          // Clicking the selected radar clears the selection, otherwise selects it
          selectDataKey(selectedDataKey === dataKey ? null : dataKey);
        }}
        {...radarProps}
      />
      <defs>
        <ColorGradient id={id} dataKey={dataKey} config={config} />
        <StrokeGradient id={id} dataKey={dataKey} config={config} />
        {isFilled && <FillGradient id={id} dataKey={dataKey} config={config} />}
        {isGlowing && <GlowFilter id={id} dataKey={dataKey} />}
      </defs>
    </>
  );
}

type DotProps = {
  variant?: DotVariant; // visual style of the point marker
};

/**
 * Declares a resting point marker for the <Radar /> it is composed inside.
 * It renders nothing on its own — the parent <Radar /> reads its variant and
 * wires it into the Recharts dot slot.
 */
export const Dot: FC<DotProps> = () => null;

/**
 * Declares the hovered/active point marker for the <Radar /> it is composed
 * inside. Like <Dot />, it is a configuration slot and renders nothing itself.
 */
export const ActiveDot: FC<DotProps> = () => null;

type PolarGridProps = ComponentProps<typeof RechartsPolarGrid>;

/**
 * The polar grid lines. Defaults to a dashed polygon grid and forwards every
 * Recharts PolarGrid prop, so `gridType`, `polarRadius`, etc. pass straight through.
 */
export function PolarGrid({
  gridType = "polygon",
  stroke = "currentColor",
  strokeOpacity = 0.2,
  strokeDasharray = "3 4",
  ...props
}: PolarGridProps) {
  return (
    <RechartsPolarGrid
      gridType={gridType}
      stroke={stroke}
      strokeOpacity={strokeOpacity}
      strokeDasharray={strokeDasharray}
      {...props}
    />
  );
}

type PolarAngleAxisProps = ComponentProps<typeof RechartsPolarAngleAxis>;

/**
 * The angular category axis — the labels around the chart's perimeter. Ships
 * with the chart's flat default styling and forwards every Recharts
 * PolarAngleAxis prop. Hidden automatically while the chart is loading.
 */
export function PolarAngleAxis({
  tick = { fill: "currentColor", fontSize: 12 },
  tickLine = false,
  ...props
}: PolarAngleAxisProps) {
  const { isLoading } = useRadarChart();

  if (isLoading) return null;

  return <RechartsPolarAngleAxis tick={tick} tickLine={tickLine} {...props} />;
}

type PolarRadiusAxisProps = ComponentProps<typeof RechartsPolarRadiusAxis>;

/**
 * The radial value axis — the scale running from the center outward. Forwards
 * every Recharts PolarRadiusAxis prop. Hidden automatically while the chart is
 * loading.
 */
export function PolarRadiusAxis({
  tick = { fill: "currentColor", fontSize: 10 },
  tickLine = false,
  axisLine = false,
  ...props
}: PolarRadiusAxisProps) {
  const { isLoading } = useRadarChart();

  if (isLoading) return null;

  return (
    <RechartsPolarRadiusAxis tick={tick} tickLine={tickLine} axisLine={axisLine} {...props} />
  );
}

type TooltipProps = {
  variant?: TooltipVariant; // visual style of the tooltip surface
  roundness?: TooltipRoundness; // border-radius of the tooltip
  defaultIndex?: number; // data index shown by default with no hover
};

/**
 * The hover tooltip. Reads the chart's selection from context so its content
 * dims unselected series. Hidden automatically while the chart is loading.
 */
export function Tooltip({ variant, roundness, defaultIndex }: TooltipProps) {
  const { isLoading, selectedDataKey } = useRadarChart();

  if (isLoading) return null;

  return (
    <ChartTooltip
      defaultIndex={defaultIndex}
      cursor={false}
      content={
        <ChartTooltipContent selected={selectedDataKey} roundness={roundness} variant={variant} />
      }
    />
  );
}

type LegendProps = {
  variant?: ChartLegendVariant; // visual style of the legend indicators
  align?: "left" | "center" | "right"; // horizontal placement
  verticalAlign?: "top" | "middle" | "bottom"; // vertical placement
  isClickable?: boolean; // lets each entry toggle selection of its series
};

/**
 * The series legend. When `isClickable` is set, each entry toggles selection of
 * its series, driving the shared selection state read by every <Radar />.
 * Hidden automatically while the chart is loading.
 */
export function Legend({
  variant,
  align = "center",
  verticalAlign = "bottom",
  isClickable = false,
}: LegendProps) {
  const { isLoading, selectedDataKey, selectDataKey } = useRadarChart();

  if (isLoading) return null;

  return (
    <ChartLegend
      verticalAlign={verticalAlign}
      align={align}
      content={
        <ChartLegendContent
          selected={selectedDataKey}
          onSelectChange={selectDataKey}
          isClickable={isClickable}
          variant={variant}
        />
      }
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dot helpers
// ─────────────────────────────────────────────────────────────────────────────

type RadarDotProp = ComponentProps<typeof RechartsRadar>["dot"];
type RadarActiveDotProp = ComponentProps<typeof RechartsRadar>["activeDot"];

// Pulls <Dot /> and <ActiveDot /> out of a radar's children into Recharts dot slots
const resolveDots = (
  children: ReactNode,
  id: string,
  dataKey: string,
  dotOpacity: number,
): { dot: RadarDotProp; activeDot: RadarActiveDotProp } => {
  let dot: RadarDotProp = false;
  let activeDot: RadarActiveDotProp = false;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    if (child.type === Dot) {
      const { variant } = (child as ReactElement<DotProps>).props;
      dot = <ChartDot type={variant} dataKey={dataKey} chartId={id} fillOpacity={dotOpacity} />;
    }

    if (child.type === ActiveDot) {
      const { variant } = (child as ReactElement<DotProps>).props;
      activeDot = (
        <ChartDot type={variant} dataKey={dataKey} chartId={id} fillOpacity={dotOpacity} />
      );
    }
  });

  return { dot, activeDot };
};

// ─────────────────────────────────────────────────────────────────────────────
// Style definitions — one set per <Radar />, scoped to its unique id
// ─────────────────────────────────────────────────────────────────────────────

type StyleProps = {
  id: string; // unique id of the owning <Radar />
  dataKey: string; // series key the styles belong to
  config: ChartConfig; // colors + labels for every series
};

type ColorStopsProps = {
  dataKey: string; // series key the stops belong to
  colorsCount: number; // number of color steps in the gradient
  opacities?: number[]; // optional per-stop opacity ramp
};

// Emits one <stop> per color, falling back to a flat gradient for single colors
const ColorStops = ({ dataKey, colorsCount, opacities }: ColorStopsProps) => {
  if (colorsCount === 1) {
    return (
      <>
        <stop offset="0%" stopColor={`var(--color-${dataKey}-0)`} stopOpacity={opacities?.[0]} />
        <stop
          offset="100%"
          stopColor={`var(--color-${dataKey}-0)`}
          stopOpacity={opacities?.[opacities.length - 1]}
        />
      </>
    );
  }

  return (
    <>
      {Array.from({ length: colorsCount }, (_, index) => {
        const offset = `${(index / (colorsCount - 1)) * 100}%`;
        return (
          <stop
            key={offset}
            offset={offset}
            stopColor={`var(--color-${dataKey}-${index}, var(--color-${dataKey}-0))`}
            stopOpacity={opacities?.[index]}
          />
        );
      })}
    </>
  );
};

/**
 * Horizontal left-to-right color gradient for a series. Always rendered — the
 * radar's dots paint from this single gradient.
 */
const ColorGradient = ({ id, dataKey, config }: StyleProps) => {
  const colorsCount = getColorsCount(config[dataKey] ?? {});

  return (
    <linearGradient id={`${id}-colors-${dataKey}`} x1="0" y1="0" x2="1" y2="0">
      <ColorStops dataKey={dataKey} colorsCount={colorsCount} />
    </linearGradient>
  );
};

/** Diagonal color gradient used for the radar's outline stroke. */
const StrokeGradient = ({ id, dataKey, config }: StyleProps) => {
  const colorsCount = getColorsCount(config[dataKey] ?? {});

  return (
    <linearGradient id={`${id}-radar-stroke-${dataKey}`} x1="0" y1="0" x2="1" y2="1">
      <ColorStops dataKey={dataKey} colorsCount={colorsCount} />
    </linearGradient>
  );
};

/** Radial color gradient used for the radar's filled area, fading toward the edge. */
const FillGradient = ({ id, dataKey, config }: StyleProps) => {
  const colorsCount = getColorsCount(config[dataKey] ?? {});
  const opacities =
    colorsCount === 1 ? [0.8, 0.3] : Array.from({ length: colorsCount }, (_, i) => (i === 0 ? 0.8 : 0.3));

  return (
    <radialGradient id={`${id}-radar-fill-${dataKey}`} cx="50%" cy="50%" r="50%">
      <ColorStops dataKey={dataKey} colorsCount={colorsCount} opacities={opacities} />
    </radialGradient>
  );
};

/** Soft outer glow filter applied to a radar when `isGlowing` is set. */
const GlowFilter = ({ id, dataKey }: Pick<StyleProps, "id" | "dataKey">) => {
  return (
    <filter id={`${id}-radar-glow-${dataKey}`} x="-50%" y="-50%" width="200%" height="200%">
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
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

// Builds a fresh set of randomized loading points for the skeleton radar
const generateLoadingData = (points: number) => {
  const categories = ["A", "B", "C", "D", "E", "F"];

  return categories.slice(0, points).map((category) => ({
    skill: category,
    [LOADING_RADAR_DATA_KEY]: 30 + Math.random() * 70,
  }));
};

/**
 * Hook that regenerates the loading skeleton data on a fixed interval, so the
 * skeleton radar keeps animating between shapes while the chart is loading.
 */
export function useLoadingData(isLoading: boolean, loadingPoints: number = LOADING_POINTS) {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, LOADING_ANIMATION_DURATION);

    return () => clearInterval(interval);
  }, [isLoading]);

  const loadingData = useMemo(
    () => generateLoadingData(loadingPoints),
    // refreshKey toggle triggers re-computation each animation cycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadingPoints, refreshKey],
  );

  return loadingData;
}

/**
 * The skeleton radar shown while the chart is loading. Rendered by the root in
 * place of the real radars, it animates between randomized shapes.
 */
const LoadingRadar = () => {
  return (
    <RechartsRadar
      dataKey={LOADING_RADAR_DATA_KEY}
      stroke="currentColor"
      strokeOpacity={0.3}
      strokeWidth={2}
      fill="currentColor"
      fillOpacity={0.1}
      dot={false}
      isAnimationActive
      animationDuration={LOADING_ANIMATION_DURATION}
      animationEasing="ease-in-out"
    />
  );
};

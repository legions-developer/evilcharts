"use client";

import {
  type ChartConfig,
  ChartContainer,
  getColorsCount,
  getLoadingData,
  LoadingIndicator,
} from "@/registry/ui/chart";
import { EvilBrush, useEvilBrush, type EvilBrushRange } from "@/registry/ui/evil-brush";
import { ChartLegend, ChartLegendContent, type ChartLegendVariant } from "@/registry/ui/legend";
import {
  ChartTooltip,
  ChartTooltipContent,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/registry/ui/tooltip";
import { ChartDot, type DotVariant } from "@/registry/ui/dot";
import {
  Children,
  createContext,
  isValidElement,
  use,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type FC,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Bar as RechartsBar,
  CartesianGrid,
  ComposedChart as RechartsComposedChart,
  Line as RechartsLine,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
} from "recharts";
import { motion } from "motion/react";

// Constants
const STROKE_WIDTH = 2;
const DEFAULT_BAR_RADIUS = 4;
const LOADING_DATA_KEY = "loading";
const LOADING_ANIMATION_DURATION = 2000; // in milliseconds

type CurveType = ComponentProps<typeof RechartsLine>["type"];
type LineDotProp = ComponentProps<typeof RechartsLine>["dot"];
type LineActiveDotProp = ComponentProps<typeof RechartsLine>["activeDot"];
type StrokeVariant = "solid" | "dashed" | "animated-dashed";
type BarVariant = "default" | "hatched" | "duotone" | "duotone-reverse" | "gradient" | "stripped";

// ─────────────────────────────────────────────────────────────────────────────
// Shared context
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared state for every part of the chart. Lifted into <EvilComposedChart /> so
 * that <Bar />, <Line />, <XAxis />, <Legend />, and friends can read it without
 * prop drilling. Sub-components are composed freely — the provider is the single
 * source of truth.
 */
type ComposedChartContextValue = {
  config: ChartConfig; // colors + labels for every bar and line series
  curveType: CurveType; // default curve interpolation each <Line /> inherits
  isLoading: boolean; // whether the chart shows its loading skeleton
  hoveredIndex: number | null; // data index currently hovered, or null when none
  selectedDataKey: string | null; // currently selected series, or null when none
  selectDataKey: (dataKey: string | null) => void; // sets the selected series
};

const ComposedChartContext = createContext<ComposedChartContextValue | null>(null);

// Reads the chart context, throwing a helpful error when used outside <EvilComposedChart />
function useComposedChart() {
  const context = use(ComposedChartContext);

  if (!context) {
    throw new Error(
      "Composed chart parts (<Bar />, <Line />, <XAxis />, …) must be used within <EvilComposedChart />",
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

type EvilComposedChartBaseProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = {
  config: TConfig & ValidateConfigKeys<TData, TConfig>; // series colors + labels for bars and lines
  data: TData[]; // rows rendered by the chart
  children: ReactNode; // composed parts — <Bar />, <Line />, <XAxis />, <Legend />, …
  className?: string; // extra classes for the chart container
  chartProps?: ComponentProps<typeof RechartsComposedChart>; // escape hatch for the raw Recharts chart
  curveType?: CurveType; // default curve interpolation for every <Line />
  barGap?: number; // gap between bars sharing a category
  barCategoryGap?: number; // gap between bar categories
  defaultSelectedDataKey?: string | null; // series selected on first render
  onSelectionChange?: (selectedDataKey: string | null) => void; // fires when the selected series changes
  isLoading?: boolean; // shows the animated loading skeleton
  loadingBars?: number; // number of bars in the loading skeleton
  showBrush?: boolean; // renders a zoom brush below the chart
  xDataKey?: keyof TData & string; // x-axis key — only needed for the brush footer
  brushHeight?: number; // height of the brush preview in pixels
  brushFormatLabel?: (value: unknown, index: number) => string; // formats brush axis labels
  onBrushChange?: (range: EvilBrushRange) => void; // fires when the brush range changes
};

type EvilComposedChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> = EvilComposedChartBaseProps<TData, TConfig>;

/**
 * Root of the composible composed chart. Owns the data, the shared context, the
 * loading skeleton, and the optional zoom brush. Everything visual — axes, grid,
 * tooltip, legend, and the bars and lines themselves — is composed as children,
 * so a consumer renders exactly the parts they need.
 */
export function EvilComposedChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>({
  config,
  data,
  children,
  className,
  chartProps,
  curveType = "linear",
  barGap,
  barCategoryGap,
  defaultSelectedDataKey = null,
  onSelectionChange,
  isLoading = false,
  loadingBars,
  showBrush = false,
  xDataKey,
  brushHeight,
  brushFormatLabel,
  onBrushChange,
}: EvilComposedChartProps<TData, TConfig>) {
  const chartId = useId().replace(/:/g, ""); // colon-free id keeps CSS/SVG selectors valid
  const [selectedDataKey, setSelectedDataKey] = useState<string | null>(defaultSelectedDataKey);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { loadingData, onShimmerExit } = useLoadingData(isLoading, loadingBars);
  const { visibleData, brushProps } = useEvilBrush({ data });

  const displayData = showBrush && !isLoading ? visibleData : data;

  // Updates selection state and notifies the parent
  const selectDataKey = useCallback(
    (newSelectedDataKey: string | null) => {
      setSelectedDataKey(newSelectedDataKey);
      onSelectionChange?.(newSelectedDataKey);
    },
    [onSelectionChange],
  );

  const contextValue = useMemo<ComposedChartContextValue>(
    () => ({
      config,
      curveType,
      isLoading,
      hoveredIndex,
      selectedDataKey,
      selectDataKey,
    }),
    [config, curveType, isLoading, hoveredIndex, selectedDataKey, selectDataKey],
  );

  return (
    <ComposedChartContext value={contextValue}>
      <ChartContainer
        className={className}
        config={config}
        footer={
          showBrush &&
          !isLoading && (
            <EvilBrush
              data={data}
              chartConfig={config}
              xDataKey={xDataKey}
              variant="area"
              curveType={curveType}
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
        <RechartsComposedChart
          id={chartId}
          accessibilityLayer
          data={isLoading ? loadingData : displayData}
          barGap={barGap}
          barCategoryGap={barCategoryGap}
          onMouseLeave={() => setHoveredIndex(null)}
          {...chartProps}
        >
          {children}
          {isLoading && (
            <LoadingBar chartId={chartId} barRadius={DEFAULT_BAR_RADIUS} onShimmerExit={onShimmerExit} />
          )}
        </RechartsComposedChart>
      </ChartContainer>
    </ComposedChartContext>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composible parts
// ─────────────────────────────────────────────────────────────────────────────

type BarProps = {
  dataKey: string; // series key — must exist on the data and config
  variant?: BarVariant; // fill style for this bar only
  radius?: number; // corner radius of the bar in pixels
  glow?: boolean; // applies a soft neon glow to this bar
  isClickable?: boolean; // lets this bar be selected by clicking it
  enableHoverHighlight?: boolean; // dims this bar when another column is hovered
  barProps?: ComponentProps<typeof RechartsBar>; // escape hatch for raw Recharts Bar props
};

/**
 * A single bar series. Each <Bar /> is fully self-contained: it generates its
 * own gradient/pattern definitions under a unique id, so any number of bars —
 * each with its own variant, glow, and clickability — can live in one chart
 * without style collisions.
 */
export function Bar({
  dataKey,
  variant = "default",
  radius = DEFAULT_BAR_RADIUS,
  glow = false,
  isClickable = false,
  enableHoverHighlight = false,
  barProps,
}: BarProps) {
  const { config, isLoading, hoveredIndex, selectedDataKey, selectDataKey } = useComposedChart();
  const id = useId().replace(/:/g, ""); // unique id scopes this bar's style defs

  // The root renders the skeleton bar while loading, so real bars step aside
  if (isLoading) return null;

  const isSelected = selectedDataKey === null || selectedDataKey === dataKey;
  const filter = glow ? `url(#${id}-glow)` : undefined;

  return (
    <>
      <RechartsBar
        dataKey={dataKey}
        fill={`url(#${id}-bar-colors)`}
        radius={radius}
        style={isClickable || enableHoverHighlight ? { cursor: "pointer" } : undefined}
        shape={(props: unknown) => {
          const barShapeProps = props as BarShapeProps;
          const index = typeof barShapeProps.index === "number" ? barShapeProps.index : -1;

          return (
            <CustomBar
              {...barShapeProps}
              id={id}
              variant={variant}
              barRadius={radius}
              filter={filter}
              fillOpacity={getBarOpacity({
                isClickable,
                isSelected,
                selectedDataKey,
                enableHoverHighlight,
                hoveredIndex,
                index,
              })}
              isClickable={isClickable}
              enableHoverHighlight={enableHoverHighlight}
              onClick={() => {
                if (!isClickable) return;
                selectDataKey(selectedDataKey === dataKey ? null : dataKey);
              }}
            />
          );
        }}
        {...barProps}
      />
      <defs>
        <VerticalColorGradient id={id} dataKey={dataKey} config={config} />
        {variant === "hatched" && <HatchedPattern id={id} dataKey={dataKey} />}
        {variant === "duotone" && <DuotonePattern id={id} dataKey={dataKey} config={config} />}
        {variant === "duotone-reverse" && (
          <DuotoneReversePattern id={id} dataKey={dataKey} config={config} />
        )}
        {variant === "gradient" && <GradientPattern id={id} dataKey={dataKey} />}
        {variant === "stripped" && <StrippedPattern id={id} dataKey={dataKey} />}
        {glow && <BarGlowFilter id={id} />}
      </defs>
    </>
  );
}

type LineProps = {
  dataKey: string; // series key — must exist on the data and config
  strokeVariant?: StrokeVariant; // stroke style for this line only
  curveType?: CurveType; // curve interpolation — falls back to the chart default
  connectNulls?: boolean; // join segments across null/missing values
  glow?: boolean; // applies a soft neon glow to this line
  isClickable?: boolean; // lets this line be selected by clicking it
  children?: ReactNode; // optional <Dot /> and <ActiveDot /> composition
  lineProps?: ComponentProps<typeof RechartsLine>; // escape hatch for raw Recharts Line props
};

/**
 * A single line series. Each <Line /> is fully self-contained: it generates its
 * own color gradient and glow filter under a unique id, so any number of lines —
 * each with its own stroke, curve, glow, and clickability — can live in one chart
 * without style collisions. Compose <Dot /> and <ActiveDot /> inside it to add
 * point markers.
 */
export function Line({
  dataKey,
  strokeVariant = "solid",
  curveType,
  connectNulls = false,
  glow = false,
  isClickable = false,
  children,
  lineProps,
}: LineProps) {
  const { config, curveType: defaultCurve, isLoading, selectedDataKey, selectDataKey } =
    useComposedChart();
  const id = useId().replace(/:/g, ""); // unique id scopes this line's style defs

  // The root renders the skeleton bar while loading, so real lines step aside
  if (isLoading) return null;

  const resolvedCurve = curveType ?? defaultCurve;

  const opacity = getOpacity(selectedDataKey, dataKey);
  const hasSelection = selectedDataKey !== null;
  const filter = glow ? `url(#${id}-glow)` : undefined;

  const { dot, activeDot } = resolveDots(children, id, dataKey, opacity.dot);

  const isAnimatedDashed = strokeVariant === "animated-dashed";
  const isDashed = strokeVariant === "dashed" || isAnimatedDashed;

  const handleLineClick = () => {
    if (!isClickable) return;
    selectDataKey(selectedDataKey === dataKey ? null : dataKey);
  };

  return (
    <>
      {isClickable && (
        <RechartsLine
          type={resolvedCurve}
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
      <RechartsLine
        type={resolvedCurve}
        dataKey={dataKey}
        connectNulls={connectNulls}
        strokeOpacity={opacity.stroke}
        stroke={`url(#${id}-line-colors)`}
        filter={filter}
        dot={dot}
        activeDot={activeDot}
        strokeWidth={STROKE_WIDTH}
        strokeDasharray={isDashed ? "5 5" : undefined}
        style={isClickable ? { cursor: "pointer", pointerEvents: "none" } : undefined}
        {...lineProps}
      >
        {isAnimatedDashed && !hasSelection && <AnimatedDashedStroke />}
      </RechartsLine>
      <defs>
        <HorizontalColorGradient id={id} dataKey={dataKey} config={config} />
        {glow && <LineGlowFilter id={id} />}
      </defs>
    </>
  );
}

type DotProps = {
  variant?: DotVariant; // visual style of the point marker
};

/**
 * Declares a resting point marker for the <Line /> it is composed inside.
 * It renders nothing on its own — the parent <Line /> reads its variant and
 * wires it into the Recharts dot slot.
 */
export const Dot: FC<DotProps> = () => null;

/**
 * Declares the hovered/active point marker for the <Line /> it is composed
 * inside. Like <Dot />, it is a configuration slot and renders nothing itself.
 */
export const ActiveDot: FC<DotProps> = () => null;

type XAxisProps = ComponentProps<typeof RechartsXAxis>;

/**
 * The horizontal category axis. Ships with the chart's flat default styling and
 * forwards every Recharts XAxis prop, so `dataKey`, `tickFormatter`, etc. are
 * passed straight through. Hidden automatically while the chart is loading.
 */
export function XAxis({
  tickLine = false,
  axisLine = false,
  tickMargin = 8,
  minTickGap = 8,
  ...props
}: XAxisProps) {
  const { isLoading } = useComposedChart();

  if (isLoading) return null;

  return (
    <RechartsXAxis
      tickLine={tickLine}
      axisLine={axisLine}
      tickMargin={tickMargin}
      minTickGap={minTickGap}
      {...props}
    />
  );
}

type YAxisProps = ComponentProps<typeof RechartsYAxis>;

/**
 * The vertical value axis. Forwards every Recharts YAxis prop straight through.
 * Hidden automatically while the chart is loading.
 */
export function YAxis({
  tickLine = false,
  axisLine = false,
  tickMargin = 8,
  minTickGap = 8,
  width = "auto",
  ...props
}: YAxisProps) {
  const { isLoading } = useComposedChart();

  if (isLoading) return null;

  return (
    <RechartsYAxis
      tickLine={tickLine}
      axisLine={axisLine}
      tickMargin={tickMargin}
      minTickGap={minTickGap}
      width={width}
      {...props}
    />
  );
}

type GridProps = ComponentProps<typeof CartesianGrid>;

/**
 * The background grid lines. Defaults to horizontal-only dashed lines and
 * forwards every Recharts CartesianGrid prop for full control.
 */
export function Grid({ vertical = false, strokeDasharray = "3 3", ...props }: GridProps) {
  return <CartesianGrid vertical={vertical} strokeDasharray={strokeDasharray} {...props} />;
}

type TooltipProps = {
  variant?: TooltipVariant; // visual style of the tooltip surface
  roundness?: TooltipRoundness; // border-radius of the tooltip
  defaultIndex?: number; // data index shown by default with no hover
  cursor?: boolean; // whether the vertical cursor line follows the pointer
};

/**
 * The hover tooltip. Reads the chart's selection from context so its content
 * dims unselected series. Hidden automatically while the chart is loading.
 */
export function Tooltip({ variant, roundness, defaultIndex, cursor = true }: TooltipProps) {
  const { isLoading, selectedDataKey } = useComposedChart();

  if (isLoading) return null;

  return (
    <ChartTooltip
      defaultIndex={defaultIndex}
      cursor={cursor ? { strokeDasharray: "3 3", strokeWidth: STROKE_WIDTH } : false}
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
 * its series, driving the shared selection state read by every <Bar /> and <Line />.
 */
export function Legend({
  variant,
  align = "right",
  verticalAlign = "top",
  isClickable = false,
}: LegendProps) {
  const { selectedDataKey, selectDataKey } = useComposedChart();

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
// Selection + dot helpers
// ─────────────────────────────────────────────────────────────────────────────

// Returns stroke/dot opacity for a line — dims a series only when another is selected
const getOpacity = (selectedDataKey: string | null, dataKey: string) => {
  if (selectedDataKey === null) {
    return { stroke: 1, dot: 1 };
  }

  return selectedDataKey === dataKey ? { stroke: 1, dot: 1 } : { stroke: 0.3, dot: 0.3 };
};

// Returns the fill opacity for a bar, accounting for both selection and hover state
const getBarOpacity = ({
  isClickable,
  isSelected,
  selectedDataKey,
  enableHoverHighlight,
  hoveredIndex,
  index,
}: {
  isClickable: boolean;
  isSelected: boolean;
  selectedDataKey: string | null;
  enableHoverHighlight: boolean;
  hoveredIndex: number | null;
  index: number;
}) => {
  const clickOpacity = isClickable && selectedDataKey !== null ? (isSelected ? 1 : 0.3) : 1;

  if (enableHoverHighlight && hoveredIndex !== null) {
    return hoveredIndex === index ? clickOpacity : clickOpacity * 0.3;
  }

  return clickOpacity;
};

// Pulls <Dot /> and <ActiveDot /> out of a line's children into Recharts dot slots
const resolveDots = (
  children: ReactNode,
  id: string,
  dataKey: string,
  dotOpacity: number,
): { dot: LineDotProp; activeDot: LineActiveDotProp } => {
  let dot: LineDotProp = false;
  let activeDot: LineActiveDotProp = false;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    if (child.type === Dot) {
      const { variant } = (child as ReactElement<DotProps>).props;
      dot = <ChartDot type={variant} dataKey={dataKey} chartId={`${id}-line`} fillOpacity={dotOpacity} />;
    }

    if (child.type === ActiveDot) {
      const { variant } = (child as ReactElement<DotProps>).props;
      activeDot = (
        <ChartDot type={variant} dataKey={dataKey} chartId={`${id}-line`} fillOpacity={dotOpacity} />
      );
    }
  });

  return { dot, activeDot };
};

// ─────────────────────────────────────────────────────────────────────────────
// Custom bar shape
// ─────────────────────────────────────────────────────────────────────────────

// Props Recharts passes to a bar's custom shape renderer
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
  id: string; // unique id of the owning <Bar />
  variant: BarVariant; // fill style of the bar
  barRadius: number; // corner radius of the bar
  filter?: string; // optional glow filter reference
  isClickable?: boolean; // whether the bar is selectable by click
  enableHoverHighlight?: boolean; // whether hovering a column dims the others
  onClick?: () => void; // fired when a clickable bar is clicked
} & BarShapeProps;

// Renders a single bar rectangle with its variant fill, glow, and hit area
const CustomBar = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fillOpacity = 1,
  background,
  id,
  variant,
  barRadius,
  filter,
  isClickable,
  enableHoverHighlight,
  onClick,
}: CustomBarProps) => {
  const cursorStyle = isClickable || enableHoverHighlight ? { cursor: "pointer" } : undefined;
  const hitAreaX = background?.x ?? x;
  const hitAreaY = background?.y ?? y;
  const hitAreaWidth = background?.width ?? width;
  const hitAreaHeight = background?.height ?? height;

  const getFill = () => {
    switch (variant) {
      case "hatched":
        return `url(#${id}-hatched)`;
      case "duotone":
        return `url(#${id}-duotone)`;
      case "duotone-reverse":
        return `url(#${id}-duotone-reverse)`;
      case "gradient":
        return `url(#${id}-gradient)`;
      case "stripped":
        return `url(#${id}-stripped)`;
      default:
        return `url(#${id}-bar-colors)`;
    }
  };

  if (variant === "stripped") {
    return (
      <g style={cursorStyle} onClick={onClick}>
        <g filter={filter} opacity={fillOpacity} className="transition-opacity duration-200">
          <rect x={x} y={y} width={width} height={height} fill={getFill()} />
          <rect x={x} y={y} width={width} height={2} fill={`url(#${id}-bar-colors)`} />
        </g>
        {enableHoverHighlight && (
          <rect
            x={hitAreaX}
            y={hitAreaY}
            width={hitAreaWidth}
            height={hitAreaHeight}
            fill="transparent"
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
        />
      )}
    </g>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Style definitions — one set per <Bar /> / <Line />, scoped to its unique id
// ─────────────────────────────────────────────────────────────────────────────

type StyleProps = {
  id: string; // unique id of the owning series
  dataKey: string; // series key the colors belong to
};

// Animated dashed-stroke effect, rendered as a child of the Recharts Line
const AnimatedDashedStroke = () => {
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

/** Vertical top-to-bottom color gradient — the fill source for every bar variant. */
const VerticalColorGradient = ({
  id,
  dataKey,
  config,
}: StyleProps & { config: ChartConfig }) => {
  const colorsCount = getColorsCount(config[dataKey] ?? {});

  return (
    <linearGradient id={`${id}-bar-colors`} x1="0" y1="0" x2="0" y2="1">
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
};

/** Horizontal left-to-right color gradient — the stroke source for a line series. */
const HorizontalColorGradient = ({
  id,
  dataKey,
  config,
}: StyleProps & { config: ChartConfig }) => {
  const colorsCount = getColorsCount(config[dataKey] ?? {});

  return (
    <linearGradient id={`${id}-line-colors`} x1="0" y1="0" x2="1" y2="0">
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
};

/** Hatched diagonal-stripe fill for a bar, masked from the series color gradient. */
const HatchedPattern = ({ id }: StyleProps) => {
  return (
    <>
      <pattern
        id={`${id}-hatched-mask-pattern`}
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
      <mask id={`${id}-hatched-mask`}>
        <rect width="100%" height="100%" fill={`url(#${id}-hatched-mask-pattern)`} />
      </mask>
      <pattern id={`${id}-hatched`} patternUnits="userSpaceOnUse" width="100%" height="100%">
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-bar-colors)`}
          mask={`url(#${id}-hatched-mask)`}
        />
      </pattern>
    </>
  );
};

/** Two-tone fill that splits each bar into a light and a full-strength half. */
const DuotonePattern = ({ id, dataKey, config }: StyleProps & { config: ChartConfig }) => {
  const colorsCount = getColorsCount(config[dataKey] ?? {});

  return (
    <>
      <linearGradient
        id={`${id}-duotone-mask-gradient`}
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
        id={`${id}-duotone-colors`}
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
      <mask id={`${id}-duotone-mask`} maskContentUnits="objectBoundingBox">
        <rect x="0" y="0" width="1" height="1" fill={`url(#${id}-duotone-mask-gradient)`} />
      </mask>
      <pattern
        id={`${id}-duotone`}
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
          fill={`url(#${id}-duotone-colors)`}
          mask={`url(#${id}-duotone-mask)`}
        />
      </pattern>
    </>
  );
};

/** Two-tone fill mirrored from `duotone` — the full-strength half comes first. */
const DuotoneReversePattern = ({ id, dataKey, config }: StyleProps & { config: ChartConfig }) => {
  const colorsCount = getColorsCount(config[dataKey] ?? {});

  return (
    <>
      <linearGradient
        id={`${id}-duotone-reverse-mask-gradient`}
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
        id={`${id}-duotone-reverse-colors`}
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
      <mask id={`${id}-duotone-reverse-mask`} maskContentUnits="objectBoundingBox">
        <rect
          x="0"
          y="0"
          width="1"
          height="1"
          fill={`url(#${id}-duotone-reverse-mask-gradient)`}
        />
      </mask>
      <pattern
        id={`${id}-duotone-reverse`}
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
          fill={`url(#${id}-duotone-reverse-colors)`}
          mask={`url(#${id}-duotone-reverse-mask)`}
        />
      </pattern>
    </>
  );
};

/** Gradient fill for a bar that fades from visible at the top toward transparent. */
const GradientPattern = ({ id }: StyleProps) => {
  return (
    <>
      <linearGradient id={`${id}-gradient-mask-gradient`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="20%" stopColor="white" stopOpacity={1} />
        <stop offset="90%" stopColor="white" stopOpacity={0} />
      </linearGradient>
      <mask id={`${id}-gradient-mask`}>
        <rect width="100%" height="100%" fill={`url(#${id}-gradient-mask-gradient)`} />
      </mask>
      <pattern id={`${id}-gradient`} patternUnits="userSpaceOnUse" width="100%" height="100%">
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-bar-colors)`}
          mask={`url(#${id}-gradient-mask)`}
        />
      </pattern>
    </>
  );
};

/** Low-opacity gradient fill paired with the solid top strip drawn by `CustomBar`. */
const StrippedPattern = ({ id }: StyleProps) => {
  return (
    <>
      <linearGradient id={`${id}-stripped-mask-gradient`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity={0.4} />
        <stop offset="100%" stopColor="white" stopOpacity={0.1} />
      </linearGradient>
      <mask id={`${id}-stripped-mask`}>
        <rect width="100%" height="100%" fill={`url(#${id}-stripped-mask-gradient)`} />
      </mask>
      <pattern id={`${id}-stripped`} patternUnits="userSpaceOnUse" width="100%" height="100%">
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-bar-colors)`}
          mask={`url(#${id}-stripped-mask)`}
        />
      </pattern>
    </>
  );
};

/** Soft outer-glow filter applied to a glowing bar. */
const BarGlowFilter = ({ id }: { id: string }) => {
  return (
    <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%">
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
  );
};

/** Soft outer-glow filter applied to a glowing line. */
const LineGlowFilter = ({ id }: { id: string }) => {
  return (
    <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
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
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

// Builds bell-curve eased gradient stops for the loading shimmer
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
 * Uses motion.dev's onUpdate callback to ensure chart data is only regenerated
 * when the shimmer has completely exited the visible area. This eliminates
 * timing drift issues from setTimeout/setInterval.
 */
export function useLoadingData(isLoading: boolean, loadingBars: number = 12) {
  const [loadingDataKey, setLoadingDataKey] = useState(false);

  // Callback fired by motion.dev when the shimmer exits the visible area
  const onShimmerExit = useCallback(() => {
    if (isLoading) {
      setLoadingDataKey((prev) => !prev);
    }
  }, [isLoading]);

  const loadingData = useMemo(
    () => getLoadingData(loadingBars, 20, 80),
    // loadingDataKey toggle triggers re-computation when the shimmer exits
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadingBars, loadingDataKey],
  );

  return { loadingData, onShimmerExit };
}

/**
 * The skeleton bar shown while the chart is loading. Rendered by the root in
 * place of the real bars and lines, paired with its own masked shimmer pattern.
 */
const LoadingBar = ({
  chartId,
  barRadius,
  onShimmerExit,
}: {
  chartId: string;
  barRadius: number;
  onShimmerExit: () => void;
}) => {
  return (
    <>
      <RechartsBar
        dataKey={LOADING_DATA_KEY}
        fill="currentColor"
        fillOpacity={0.15}
        radius={barRadius}
        isAnimationActive={false}
        legendType="none"
        style={{ mask: `url(#${chartId}-loading-mask)` }}
      />
      <defs>
        <LoadingPattern chartId={chartId} onShimmerExit={onShimmerExit} />
      </defs>
    </>
  );
};

/**
 * Animated shimmer pattern for the loading skeleton.
 *
 * The visible chart area is normalized to 0-1, the shimmer gradient has width 1,
 * and the pattern is 3x wide so the shimmer has buffer on both sides. The motion
 * rect travels x from -1 to 2; onShimmerExit fires as it crosses x=1, letting the
 * data swap happen while the shimmer is off-screen for a seamless loop.
 */
const LoadingPattern = ({
  chartId,
  onShimmerExit,
}: {
  chartId: string;
  onShimmerExit: () => void;
}) => {
  const gradientStops = generateEasedGradientStops();

  // 1 (left buffer) + 1 (visible) + 1 (right buffer)
  const patternWidth = 3;
  const startX = -1;
  const endX = 2;

  // Tracks the last x value to detect the exit threshold crossing
  const lastXRef = useRef(startX);

  return (
    <>
      <linearGradient id={`${chartId}-loading-gradient`} x1="0" y1="0" x2="1" y2="0">
        {gradientStops.map(({ offset, opacity }) => (
          <stop key={offset} offset={offset} stopColor="white" stopOpacity={opacity} />
        ))}
      </linearGradient>
      <pattern
        id={`${chartId}-loading-pattern`}
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
          fill={`url(#${chartId}-loading-gradient)`}
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

            // Fire once per loop, when the shimmer fully exits the visible area
            if (xValue >= 1 && lastX < 1) {
              onShimmerExit();
            }

            lastXRef.current = xValue;
          }}
        />
      </pattern>
      <mask id={`${chartId}-loading-mask`} maskUnits="userSpaceOnUse">
        <rect width="100%" height="100%" fill={`url(#${chartId}-loading-pattern)`} />
      </mask>
    </>
  );
};

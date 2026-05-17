"use client";

import {
  type ChartConfig,
  ChartContainer,
  getColorsCount,
  LoadingIndicator,
} from "@/registry/ui/chart";
import { ChartLegend, ChartLegendContent, type ChartLegendVariant } from "@/registry/ui/legend";
import {
  ChartTooltip,
  ChartTooltipContent,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/registry/ui/tooltip";
import { ChartBackground, type BackgroundVariant } from "@/registry/ui/background";
import {
  Children,
  createContext,
  isValidElement,
  use,
  useCallback,
  useId,
  useMemo,
  useState,
  type ComponentProps,
  type FC,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  LabelList as RechartsLabelList,
  Pie as RechartsPie,
  PieChart as RechartsPieChart,
  Sector,
  type PieSectorShapeProps,
} from "recharts";
import { motion } from "motion/react";

// Constants
const LOADING_SECTORS = 5;
const LOADING_ANIMATION_DURATION = 2000; // full loading cycle duration in milliseconds
const DEFAULT_INNER_RADIUS = 0;
const DEFAULT_OUTER_RADIUS = "80%";
const DEFAULT_CORNER_RADIUS = 0;
const DEFAULT_PADDING_ANGLE = 0;
const DEFAULT_START_ANGLE = 0;
const DEFAULT_END_ANGLE = 360;
// Stable empty-array reference so the `glowingSectors` default doesn't change every render
const EMPTY_GLOWING_SECTORS: string[] = [];

type LabelListProps = ComponentProps<typeof RechartsLabelList>;

// ─────────────────────────────────────────────────────────────────────────────
// Shared context
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared state for every part of the chart. Lifted into <EvilPieChart /> so that
 * <Pie />, <Tooltip />, <Legend />, and friends can read it without prop drilling.
 * Sub-components are composed freely — the provider is the single source of truth.
 */
type PieChartContextValue = {
  config: ChartConfig; // colors + labels for every sector
  data: Record<string, unknown>[]; // rows rendered by the chart
  dataKey: string; // key holding each sector's numeric value
  nameKey: string; // key holding each sector's name
  isLoading: boolean; // whether the chart shows its loading skeleton
  selectedSector: string | null; // currently selected sector name, or null when none
  selectSector: (sectorName: string | null) => void; // sets the selected sector
};

const PieChartContext = createContext<PieChartContextValue | null>(null);

// Reads the chart context, throwing a helpful error when used outside <EvilPieChart />
function usePieChart() {
  const context = use(PieChartContext);

  if (!context) {
    throw new Error(
      "Pie chart parts (<Pie />, <Tooltip />, …) must be used within <EvilPieChart />",
    );
  }

  return context;
}

// ─────────────────────────────────────────────────────────────────────────────
// Root container
// ─────────────────────────────────────────────────────────────────────────────

type EvilPieChartProps<TData extends Record<string, unknown>> = {
  config: ChartConfig; // sector colors + labels
  data: TData[]; // rows rendered by the chart
  dataKey: keyof TData & string; // key holding each sector's numeric value
  nameKey: keyof TData & string; // key holding each sector's name
  children: ReactNode; // composed parts — <Pie />, <Tooltip />, <Legend />, …
  className?: string; // extra classes for the chart container
  chartProps?: ComponentProps<typeof RechartsPieChart>; // escape hatch for the raw Recharts chart
  defaultSelectedSector?: string | null; // sector selected on first render
  onSelectionChange?: (selection: { dataKey: string; value: number } | null) => void; // fires when the selected sector changes
  isLoading?: boolean; // shows the animated loading skeleton
};

/**
 * Root of the composible pie chart. Owns the data, the shared context, and the
 * loading skeleton. Everything visual — the pie itself, tooltip, legend, and an
 * optional background — is composed as children, so a consumer renders exactly
 * the parts they need.
 */
export function EvilPieChart<TData extends Record<string, unknown>>({
  config,
  data,
  dataKey,
  nameKey,
  children,
  className,
  chartProps,
  defaultSelectedSector = null,
  onSelectionChange,
  isLoading = false,
}: EvilPieChartProps<TData>) {
  const [selectedSector, setSelectedSector] = useState<string | null>(defaultSelectedSector);

  // Updates selection state and notifies the parent with the sector's value
  const selectSector = useCallback(
    (sectorName: string | null) => {
      setSelectedSector(sectorName);

      if (sectorName === null) {
        onSelectionChange?.(null);
        return;
      }

      const selectedItem = data.find((item) => (item[nameKey] as string) === sectorName);

      if (selectedItem) {
        onSelectionChange?.({ dataKey: sectorName, value: selectedItem[dataKey] as number });
      }
    },
    [data, dataKey, nameKey, onSelectionChange],
  );

  const contextValue = useMemo<PieChartContextValue>(
    () => ({
      config,
      data,
      dataKey,
      nameKey,
      isLoading,
      selectedSector,
      selectSector,
    }),
    [config, data, dataKey, nameKey, isLoading, selectedSector, selectSector],
  );

  return (
    <PieChartContext value={contextValue}>
      <ChartContainer className={className} config={config}>
        <LoadingIndicator isLoading={isLoading} />
        <RechartsPieChart id="evil-charts-pie-chart" accessibilityLayer {...chartProps}>
          {children}
        </RechartsPieChart>
      </ChartContainer>
    </PieChartContext>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composible parts
// ─────────────────────────────────────────────────────────────────────────────

type PieProps = {
  variant?: PieVariant; // fill style for the pie's sectors
  innerRadius?: number | string; // inner radius — set above 0 for a donut
  outerRadius?: number | string; // outer radius of the pie
  cornerRadius?: number; // border-radius of each sector in pixels
  paddingAngle?: number; // gap between sectors in degrees — negative overlaps them
  startAngle?: number; // angle the pie starts drawing from
  endAngle?: number; // angle the pie stops drawing at
  isClickable?: boolean; // lets sectors be selected by clicking them
  glowingSectors?: string[]; // sector names that render with a soft outer glow
  children?: ReactNode; // optional <Label /> composition for sector labels
  pieProps?: Omit<ComponentProps<typeof RechartsPie>, "data" | "dataKey" | "nameKey">; // escape hatch for raw Recharts Pie props
};

/**
 * The pie series. Self-contained: it generates its own radial color gradients
 * and glow filters under a unique id, so any number of pies — each with its own
 * shape and clickability — can live on one page without style collisions. While
 * the chart is loading it renders an animated skeleton in place of the data.
 * Compose <Label /> inside it to draw labels on each sector.
 */
export function Pie({
  variant = "gradient",
  innerRadius = DEFAULT_INNER_RADIUS,
  outerRadius = DEFAULT_OUTER_RADIUS,
  cornerRadius = DEFAULT_CORNER_RADIUS,
  paddingAngle = DEFAULT_PADDING_ANGLE,
  startAngle = DEFAULT_START_ANGLE,
  endAngle = DEFAULT_END_ANGLE,
  isClickable = false,
  glowingSectors = EMPTY_GLOWING_SECTORS,
  children,
  pieProps,
}: PieProps) {
  const { config, data, dataKey, nameKey, isLoading, selectedSector, selectSector } = usePieChart();
  const id = useId().replace(/:/g, ""); // unique id scopes this pie's style defs

  if (isLoading) {
    return (
      <RechartsPie
        data={LOADING_PIE_DATA}
        dataKey="value"
        nameKey="name"
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        cornerRadius={cornerRadius}
        paddingAngle={paddingAngle}
        startAngle={startAngle}
        endAngle={endAngle}
        strokeWidth={0}
        isAnimationActive={false}
        shape={(props) => <AnimatedLoadingSector {...props} />}
      />
    );
  }

  const label = resolveLabel(children, dataKey);

  const preparedData = data.map((item) => ({
    ...item,
    fill: `url(#${id}-colors-${item[nameKey] as string})`,
  }));

  return (
    <>
      <RechartsPie
        data={preparedData}
        dataKey={dataKey}
        nameKey={nameKey}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        cornerRadius={cornerRadius}
        paddingAngle={paddingAngle}
        startAngle={startAngle}
        endAngle={endAngle}
        strokeWidth={0}
        isAnimationActive
        style={isClickable ? { cursor: "pointer" } : undefined}
        onClick={(_, index) => {
          if (!isClickable) return;
          const clickedName = data[index]?.[nameKey] as string;
          // Clicking the selected sector clears the selection, otherwise selects it
          selectSector(selectedSector === clickedName ? null : clickedName);
        }}
        shape={(props: PieSectorShapeProps) => {
          const sectorName = data[props.index ?? 0]?.[nameKey] as string;
          const isGlowing = glowingSectors.includes(sectorName);
          const isDimmed =
            isClickable && selectedSector !== null && selectedSector !== sectorName;

          return (
            <Sector
              {...props}
              fill={`url(#${id}-colors-${sectorName})`}
              filter={isGlowing ? `url(#${id}-glow-${sectorName})` : undefined}
              stroke={paddingAngle < 0 ? "var(--background)" : "none"}
              strokeWidth={paddingAngle < 0 ? 5 : 0}
              opacity={isDimmed ? 0.3 : 1}
              className="transition-opacity duration-200"
            />
          );
        }}
        {...pieProps}
      >
        {label}
      </RechartsPie>
      <defs>
        <RadialColorGradient id={id} config={config} variant={variant} />
        {glowingSectors.length > 0 && (
          <GlowFilter id={id} glowingSectors={glowingSectors} />
        )}
      </defs>
    </>
  );
}

type LabelProps = {
  dataKey?: string; // data key for the label text — defaults to the pie's value key
  labelListProps?: Omit<LabelListProps, "dataKey">; // escape hatch for raw Recharts LabelList props
};

/**
 * Declares per-sector labels for the <Pie /> it is composed inside. It renders
 * nothing on its own — the parent <Pie /> reads its props and wires them into a
 * Recharts LabelList drawn over the sectors.
 */
export const Label: FC<LabelProps> = () => null;

type TooltipProps = {
  variant?: TooltipVariant; // visual style of the tooltip surface
  roundness?: TooltipRoundness; // border-radius of the tooltip
  defaultIndex?: number; // sector index shown by default with no hover
};

/**
 * The hover tooltip. Hidden automatically while the chart is loading.
 */
export function Tooltip({ variant, roundness, defaultIndex }: TooltipProps) {
  const { isLoading, nameKey } = usePieChart();

  if (isLoading) return null;

  return (
    <ChartTooltip
      defaultIndex={defaultIndex}
      content={
        <ChartTooltipContent
          nameKey={nameKey}
          hideLabel
          roundness={roundness}
          variant={variant}
        />
      }
    />
  );
}

type LegendProps = {
  variant?: ChartLegendVariant; // visual style of the legend indicators
  align?: "left" | "center" | "right"; // horizontal placement
  verticalAlign?: "top" | "middle" | "bottom"; // vertical placement
  isClickable?: boolean; // lets each entry toggle selection of its sector
};

/**
 * The sector legend. When `isClickable` is set, each entry toggles selection of
 * its sector, driving the shared selection state read by the <Pie />.
 */
export function Legend({
  variant,
  align = "center",
  verticalAlign = "bottom",
  isClickable = false,
}: LegendProps) {
  const { nameKey, selectedSector, selectSector } = usePieChart();

  return (
    <ChartLegend
      verticalAlign={verticalAlign}
      align={align}
      content={
        <ChartLegendContent
          selected={selectedSector}
          onSelectChange={selectSector}
          isClickable={isClickable}
          nameKey={nameKey}
          variant={variant}
        />
      }
    />
  );
}

type BackgroundProps = {
  variant?: BackgroundVariant; // background pattern style
};

/**
 * An optional decorative pattern drawn behind the pie. Compose it before the
 * <Pie /> so it sits underneath the sectors.
 */
export function Background({ variant = "dots" }: BackgroundProps) {
  return <ChartBackground variant={variant} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Label helper
// ─────────────────────────────────────────────────────────────────────────────

// Pulls a <Label /> out of a pie's children into a Recharts LabelList element
const resolveLabel = (children: ReactNode, valueKey: string): ReactNode => {
  let label: ReactNode = null;

  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== Label) return;

    const { dataKey, labelListProps } = (child as ReactElement<LabelProps>).props;

    label = (
      <RechartsLabelList
        dataKey={dataKey ?? valueKey}
        stroke="none"
        fontSize={12}
        fontWeight={500}
        fill="currentColor"
        className="fill-background"
        {...labelListProps}
      />
    );
  });

  return label;
};

// ─────────────────────────────────────────────────────────────────────────────
// Style definitions — one set per <Pie />, scoped to its unique id
// ─────────────────────────────────────────────────────────────────────────────

type PieVariant = "gradient";

/**
 * Radial-style color gradients, one per sector. Each sector's fill paints from
 * the gradient that matches its name, supporting both single and multi-color
 * config entries.
 */
const RadialColorGradient = ({
  id,
  config,
}: {
  id: string; // unique id of the owning <Pie />
  config: ChartConfig; // sector colors the gradients are built from
  variant: PieVariant; // fill style — currently always a diagonal color gradient
}) => {
  return (
    <>
      {Object.entries(config).map(([sectorKey, sectorConfig]) => {
        const colorsCount = getColorsCount(sectorConfig);

        return (
          <linearGradient
            key={`${id}-colors-${sectorKey}`}
            id={`${id}-colors-${sectorKey}`}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            {colorsCount === 1 ? (
              <>
                <stop offset="0%" stopColor={`var(--color-${sectorKey}-0)`} />
                <stop offset="100%" stopColor={`var(--color-${sectorKey}-0)`} />
              </>
            ) : (
              Array.from({ length: colorsCount }, (_, index) => {
                const offset = `${(index / (colorsCount - 1)) * 100}%`;
                return (
                  <stop
                    key={offset}
                    offset={offset}
                    stopColor={`var(--color-${sectorKey}-${index}, var(--color-${sectorKey}-0))`}
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

/** Soft outer-glow SVG filter, one per glowing sector. */
const GlowFilter = ({
  id,
  glowingSectors,
}: {
  id: string; // unique id of the owning <Pie />
  glowingSectors: string[]; // sector names that should glow
}) => {
  return (
    <>
      {glowingSectors.map((sectorName) => (
        <filter
          key={`${id}-glow-${sectorName}`}
          id={`${id}-glow-${sectorName}`}
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

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

// Equal-sized sectors used to render the circular pulsing loading skeleton
const LOADING_PIE_DATA = Array.from({ length: LOADING_SECTORS }, (_, i) => ({
  name: `loading${i}`,
  value: 100 / LOADING_SECTORS,
}));

/**
 * A single skeleton sector shown while the chart is loading. Each sector pulses
 * with a staggered delay, producing a wave that travels around the pie.
 */
const AnimatedLoadingSector = (props: ComponentProps<typeof Sector> & { index?: number }) => {
  const { index = 0, ...sectorProps } = props;

  // Staggered delay so the pulse sweeps around the circle
  const delay = (index / LOADING_SECTORS) * (LOADING_ANIMATION_DURATION / 1000);

  return (
    <motion.g
      initial={{ opacity: 0.15 }}
      animate={{ opacity: [0.15, 0.5, 0.15] }}
      transition={{
        duration: LOADING_ANIMATION_DURATION / 1000,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <Sector {...sectorProps} fill="currentColor" />
    </motion.g>
  );
};

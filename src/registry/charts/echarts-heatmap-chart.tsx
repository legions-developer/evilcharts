"use client";

import {
  DEFAULT_ECHARTS_RENDERER,
  buildChartCss,
  getColorsCount,
  resolveColors,
  withAlpha,
  type ChartConfig,
  type EChartsRenderer,
  type ResolvedColors,
} from "@/registry/ui/echarts-chart";
import {
  resolveTooltipPosition,
  tooltipRow,
  tooltipShell,
  type TooltipPosition,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/registry/ui/echarts-tooltip";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from "react";
import {
  CalendarComponent,
  TooltipComponent,
  type CalendarComponentOption,
  type TooltipComponentOption,
} from "echarts/components";
import { CustomChart, type CustomSeriesOption } from "echarts/charts";
import { motion, useReducedMotion } from "motion/react";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

// Re-export the shared types so consumers/examples import everything they need
// from the chart module, like every other EvilCharts chart.
export type { ChartConfig, EChartsRenderer, TooltipPosition, TooltipRoundness, TooltipVariant };

// Modular registration keeps the bundle lean — only the pieces this chart needs.
// The calendar coordinate system does the date → cell math (week columns, first
// day of week, month/day labels); the cells themselves are drawn by a custom
// series so they can carry a gap, rounded corners, and a per-cell color from
// the config ramp — none of which the built-in heatmap series can do on its
// own. The tooltip is the one extra component.
echarts.use([CustomChart, CalendarComponent, TooltipComponent]);

type EChartsInstance = ReturnType<typeof echarts.init>;

// The exact option surface this chart uses. Narrower than echarts' full
// EChartsOption, so a misspelled key fails the compile instead of silently
// reaching setOption.
type EChartsOption = ComposeOption<
  CustomSeriesOption | CalendarComponentOption | TooltipComponentOption
>;

// The modular entry points don't export the renderItem types directly — derive
// them from the series option so the cell painter stays fully type-checked.
type RenderItem = NonNullable<CustomSeriesOption["renderItem"]>;
type RenderItemParams = Parameters<RenderItem>[0];
type RenderItemApi = Parameters<RenderItem>[1];
type RenderItemReturn = ReturnType<RenderItem>;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DAY_MS = 86_400_000;
const DAYS_PER_WEEK = 7;
const TRAILING_YEAR_DAYS = 365; // default range — the trailing year, GitHub style

// Intro reveal — cells pop in column by column, left to right, so the eye
// reads the year in order. Times are in milliseconds.
const INTRO_COLUMN_STAGGER = 14; // delay between one week column and the next
const INTRO_CELL_GROW = 320; // a single cell scaling up + fading in
const INTRO_CELL_SCALE_FROM = 0.4; // a cell opens from this fraction of its size
const UPDATE_DURATION = 180; // selection/theme/resize transitions
const LOADING_ANIMATION_DURATION = 2000; // shimmer loop, in milliseconds

const DEFAULT_CELL_RADIUS = 2;
const DEFAULT_CELL_GAP = 3;
const MIN_CELL_SIZE = 4; // never fit cells smaller than this
const FALLBACK_CELL_SIZE = 12; // used before the container has a measured size

// Space reserved around the calendar rect for its labels, in pixels.
const DAY_LABEL_WIDTH = 32;
const MONTH_LABEL_HEIGHT = 22;
const LABEL_MARGIN = 8;
const EDGE_PADDING = 2; // keeps the outermost cells' hover ring inside the canvas

const GRAY = "rgba(120, 120, 120, 1)"; // fallback when the ramp has no resolved color

// ─────────────────────────────────────────────────────────────────────────────
// Theme knobs — every opacity in the chart draws from these. Base colors come
// from the consumer's CSS tokens (resolved from the live DOM), so only the
// opacity factors live here. `withAlpha` MULTIPLIES a token's own alpha.
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_CELL_OPACITY = 0.08; // a day with no value — foreground at a whisper (GitHub's #ebedf0 / #161b22)
const CELL_DIM_OPACITY = 0.55; // cells outside the current selection — soft, so the ramp still reads
const HOVER_RING_WIDTH = 1; // outline drawn around the hovered cell, in pixels
const HOVER_RING_OPACITY = 0.6; // × foreground alpha
const SELECTED_RING_WIDTH = 1.5; // outline drawn around the selected cell, in pixels
const SELECTED_RING_OPACITY = 0.9; // × foreground alpha

// The loading skeleton is the same grid, painted in foreground gray and swept by
// a shimmer band. A low BASE floor keeps the grid legible between sweeps.
const LOADING_CELL_FLOOR = 0.07; // cell fill outside the sweep, × foreground alpha
const LOADING_CELL_PEAK = 0.22; // cell fill inside the sweep, × foreground alpha
const LOADING_SHIMMER_BAND = 0.22; // sweep half-width, fraction of chart width
const LOADING_SHIMMER_FEATHER = 0.22; // eased edge softening of the sweep

const DEFAULT_DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""]; // Sunday first, like GitHub
const DEFAULT_MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

// One day of data. `date` is an ISO calendar date (`YYYY-MM-DD`); days absent
// from `data` render as empty cells.
export type HeatmapDatum = {
  date: string;
  value: number;
};

// The calendar window: a year (`2025`), a month (`"2025-03"`), or an inclusive
// `[start, end]` pair of ISO dates. Omit it for the trailing year that ends on
// the latest date in `data`.
export type HeatmapRange = number | string | [string, string];

export type WeekStart = "sunday" | "monday";
export type HeatmapScale = "quantile" | "linear";
// A heatmap's entrance sweeps the grid left to right: "default" plays it,
// "none" turns it off. Kept as a small union for parity with the other
// EvilCharts entrance switches.
export type HeatmapAnimationType = "none" | "default";

export type HeatmapSelection = { date: string; value: number };

export interface EChartsHeatmapChartProps {
  data: HeatmapDatum[]; // one entry per day that has a value
  config: ChartConfig; // the series key's label + color ramp (one color per intensity level)
  children: ReactNode; // composed parts — <Cell>, <MonthLabel>, <DayLabel>, <Tooltip>, <Legend>
  className?: string; // extra classes for the chart container
  renderer?: EChartsRenderer; // rendering engine — canvas by default, or SVG
  range?: HeatmapRange; // calendar window; defaults to the trailing year
  weekStart?: WeekStart; // which day starts each column
  cellSize?: number; // fixed cell size in pixels; omit to fit the container width
  scale?: HeatmapScale; // how values map onto the color ramp when no thresholds are given
  thresholds?: number[]; // explicit ascending level boundaries; values below the first are level 1
  defaultSelectedDate?: string | null; // cell selected on first render
  onSelectionChange?: (selection: HeatmapSelection | null) => void; // fires when the selected cell changes
  isLoading?: boolean; // shows the animated loading skeleton
  animation?: boolean; // master switch for the intro sweep — false renders instantly
  animationType?: HeatmapAnimationType; // "none" disables the intro sweep
  chartOptions?: Record<string, unknown>; // escape hatch merged over the built ECharts option
}

// ─────────────────────────────────────────────────────────────────────────────
// Composible parts — DECLARATIVE CONFIG. Every part renders `null`; the root
// walks `children` by reference (child.type === Cell, …) to collect its props.
// The cells are intrinsic to the data, so <Cell> always renders — it only
// CONFIGURES the grid and names the config key to color it with. The labels,
// tooltip, and legend follow presence semantics: omit one and it does not render.
// ─────────────────────────────────────────────────────────────────────────────

export interface CellProps {
  dataKey: string; // config key whose colors form the intensity ramp
  radius?: number; // corner radius of each cell in pixels
  gap?: number; // space between cells in pixels
  isClickable?: boolean; // lets cells be selected by clicking them
}

/**
 * Configures the heatmap cells. A configuration slot — the root reads its props
 * and wires them into the ECharts custom series, so it renders nothing itself.
 * `dataKey` picks the config entry whose color array becomes the intensity ramp:
 * the first color is the lightest level, the last the strongest.
 */
const Cell: FC<CellProps> = () => null;

export interface MonthLabelProps {
  labels?: string[]; // twelve month names, January first
}

/** Presence shows month names above the grid. Renders nothing. */
const MonthLabel: FC<MonthLabelProps> = () => null;

export interface DayLabelProps {
  labels?: string[]; // seven day names, Sunday first; an empty string hides that row's label
}

/** Presence shows weekday names beside the grid. Renders nothing. */
const DayLabel: FC<DayLabelProps> = () => null;

export interface TooltipProps {
  variant?: TooltipVariant; // visual style of the tooltip surface
  roundness?: TooltipRoundness; // border-radius of the tooltip
  position?: TooltipPosition; // "variable" follows the pointer (default); "fixed" pins the tooltip near the top and tracks the pointer's X
  dateFormatter?: (date: string) => string; // formats the hovered day for the tooltip title
  valueFormatter?: (value: number) => string; // formats the hovered day's value
}

/** Presence enables the hover tooltip. Renders nothing. */
const Tooltip: FC<TooltipProps> = () => null;

export interface LegendProps {
  align?: "left" | "right"; // which side of the chart the ramp sits on
  lessLabel?: string; // text before the ramp
  moreLabel?: string; // text after the ramp
}

/** Presence renders the "Less → More" ramp under the grid. Renders nothing itself. */
const Legend: FC<LegendProps> = () => null;

// ─────────────────────────────────────────────────────────────────────────────
// Children collection — walk the declarative config into plain objects the
// option builder consumes.
// ─────────────────────────────────────────────────────────────────────────────

type CellSlot = {
  dataKey: string;
  radius: number;
  gap: number;
  isClickable: boolean;
};
type MonthLabelSlot = { labels: string[] };
type DayLabelSlot = { labels: string[] };
type TooltipSlot = {
  present: boolean;
  variant: TooltipVariant;
  roundness: TooltipRoundness;
  position: TooltipPosition;
  dateFormatter: (date: string) => string;
  valueFormatter: (value: number) => string;
};
type LegendSlot = {
  align: "left" | "right";
  lessLabel: string;
  moreLabel: string;
};

type CollectedConfig = {
  cell: CellSlot;
  monthLabel: MonthLabelSlot | null;
  dayLabel: DayLabelSlot | null;
  tooltip: TooltipSlot;
  legend: LegendSlot | null;
};

// "Mar 3, 2026" — parsed as a calendar date, not a local instant, so the label
// never slips a day across time zones.
function defaultDateFormatter(date: string): string {
  const ms = parseIsoDate(date);
  if (Number.isNaN(ms)) return date;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function collectConfig(children: ReactNode): CollectedConfig {
  let cell: CellSlot = {
    dataKey: "",
    radius: DEFAULT_CELL_RADIUS,
    gap: DEFAULT_CELL_GAP,
    isClickable: false,
  };
  let monthLabel: MonthLabelSlot | null = null;
  let dayLabel: DayLabelSlot | null = null;
  let tooltip: TooltipSlot = {
    present: false,
    variant: "default",
    roundness: "lg",
    position: "variable",
    dateFormatter: defaultDateFormatter,
    valueFormatter: (value) => value.toLocaleString(),
  };
  let legend: LegendSlot | null = null;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const type = child.type;

    if (type === Cell) {
      const props = child.props as CellProps;
      cell = {
        dataKey: props.dataKey,
        radius: props.radius ?? DEFAULT_CELL_RADIUS,
        gap: props.gap ?? DEFAULT_CELL_GAP,
        isClickable: props.isClickable ?? false,
      };
    } else if (type === MonthLabel) {
      const props = child.props as MonthLabelProps;
      monthLabel = { labels: props.labels ?? DEFAULT_MONTH_LABELS };
    } else if (type === DayLabel) {
      const props = child.props as DayLabelProps;
      dayLabel = { labels: props.labels ?? DEFAULT_DAY_LABELS };
    } else if (type === Tooltip) {
      const props = child.props as TooltipProps;
      tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
        position: props.position ?? "variable",
        dateFormatter: props.dateFormatter ?? defaultDateFormatter,
        valueFormatter: props.valueFormatter ?? ((value) => value.toLocaleString()),
      };
    } else if (type === Legend) {
      const props = child.props as LegendProps;
      legend = {
        align: props.align ?? "right",
        lessLabel: props.lessLabel ?? "Less",
        moreLabel: props.moreLabel ?? "More",
      };
    }
  });

  return { cell, monthLabel, dayLabel, tooltip, legend };
}

// ─────────────────────────────────────────────────────────────────────────────
// Date helpers — all arithmetic runs on UTC midnights so a DST change never
// adds or drops a day. ECharts parses the same ISO strings on its side, and a
// weekday is a property of the calendar date, so both agree on every cell.
// ─────────────────────────────────────────────────────────────────────────────

function parseIsoDate(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return Number.NaN;
  return Date.UTC(y, m - 1, d);
}

function toIsoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function todayUtc(): number {
  const now = new Date();
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}

type ResolvedRange = { start: number; end: number }; // inclusive UTC midnights

// The calendar window as a pair of days. A bare year or `YYYY-MM` string
// expands to that period; a tuple is used as given; nothing falls back to the
// trailing year ending on the latest day in the data (or today, with no data).
function resolveRange(range: HeatmapRange | undefined, data: HeatmapDatum[]): ResolvedRange {
  if (typeof range === "number") {
    return { start: Date.UTC(range, 0, 1), end: Date.UTC(range, 11, 31) };
  }
  if (typeof range === "string") {
    const [y, m] = range.split("-").map(Number);
    if (y && m) return { start: Date.UTC(y, m - 1, 1), end: Date.UTC(y, m, 0) };
    if (y) return { start: Date.UTC(y, 0, 1), end: Date.UTC(y, 11, 31) };
  }
  if (Array.isArray(range)) {
    const start = parseIsoDate(range[0]);
    const end = parseIsoDate(range[1]);
    if (!Number.isNaN(start) && !Number.isNaN(end) && start <= end) return { start, end };
  }

  let latest = Number.NEGATIVE_INFINITY;
  for (const datum of data) {
    const ms = parseIsoDate(datum.date);
    if (!Number.isNaN(ms) && ms > latest) latest = ms;
  }
  const end = Number.isFinite(latest) ? latest : todayUtc();
  return { start: end - (TRAILING_YEAR_DAYS - 1) * DAY_MS, end };
}

// ─────────────────────────────────────────────────────────────────────────────
// Grid model — every day in the range, in order, with its value, its intensity
// level, and its week column. Built once per data/range change and shared by
// the option builder, the tooltip, the click handler, and the intro stagger.
// ─────────────────────────────────────────────────────────────────────────────

type GridCell = {
  date: string; // ISO calendar date
  value: number; // 0 for days absent from the data
  level: number; // 0 = empty, 1..levels = ramp intensity
  column: number; // week column, 0-based from the range start
};

type GridModel = {
  cells: GridCell[];
  weeks: number; // number of week columns — matches ECharts' own calendar math
  levels: number; // number of non-empty intensity levels
  range: ResolvedRange;
};

// Ascending level boundaries for `levels` buckets above empty. Quantile cuts
// share the non-zero values evenly across the ramp (GitHub's approach), so a
// few huge days don't wash out the rest; linear cuts divide min→max evenly.
function computeThresholds(values: number[], levels: number, scale: HeatmapScale): number[] {
  const cuts = levels - 1;
  if (cuts <= 0) return [];
  const nonZero = values.filter((value) => value > 0).sort((a, b) => a - b);
  if (nonZero.length === 0) return Array.from({ length: cuts }, (_, i) => i + 1);

  if (scale === "linear") {
    const min = nonZero[0];
    const max = nonZero[nonZero.length - 1];
    if (max === min) return Array.from({ length: cuts }, () => max + 1);
    return Array.from({ length: cuts }, (_, i) => min + ((max - min) * (i + 1)) / levels);
  }

  return Array.from({ length: cuts }, (_, i) => {
    const position = ((i + 1) / levels) * (nonZero.length - 1);
    const lower = Math.floor(position);
    const upper = Math.min(nonZero.length - 1, lower + 1);
    const fraction = position - lower;
    return nonZero[lower] + (nonZero[upper] - nonZero[lower]) * fraction;
  });
}

function levelOf(value: number, thresholds: number[]): number {
  if (value <= 0) return 0;
  let level = 1;
  for (const threshold of thresholds) {
    if (value >= threshold) level += 1;
  }
  return level;
}

function buildGrid(
  data: HeatmapDatum[],
  range: ResolvedRange,
  weekStart: WeekStart,
  levels: number,
  scale: HeatmapScale,
  thresholds: number[] | undefined,
): GridModel {
  const firstDay = weekStart === "monday" ? 1 : 0;
  const valueByDate = new Map<string, number>();
  for (const datum of data) {
    const ms = parseIsoDate(datum.date);
    if (Number.isNaN(ms) || ms < range.start || ms > range.end) continue;
    valueByDate.set(toIsoDate(ms), (valueByDate.get(toIsoDate(ms)) ?? 0) + datum.value);
  }

  const cuts =
    thresholds && thresholds.length > 0
      ? [...thresholds].sort((a, b) => a - b)
      : computeThresholds([...valueByDate.values()], levels, scale);
  const effectiveLevels = cuts.length + 1;

  const startOffset =
    (new Date(range.start).getUTCDay() - firstDay + DAYS_PER_WEEK) % DAYS_PER_WEEK;
  const days = Math.round((range.end - range.start) / DAY_MS) + 1;
  const weeks = Math.floor((days + startOffset + DAYS_PER_WEEK - 1) / DAYS_PER_WEEK);

  const cells: GridCell[] = [];
  for (let i = 0; i < days; i++) {
    const date = toIsoDate(range.start + i * DAY_MS);
    const value = valueByDate.get(date) ?? 0;
    cells.push({
      date,
      value,
      level: Math.min(effectiveLevels, levelOf(value, cuts)),
      column: Math.floor((i + startOffset) / DAYS_PER_WEEK),
    });
  }

  return { cells, weeks, levels: effectiveLevels, range };
}

// The ramp color for a level — spreads the levels across however many colors
// the config provides, so a 3-color ramp still serves 5 levels sensibly.
function rampColor(slots: string[], level: number, levels: number): string {
  if (slots.length === 0) return GRAY;
  if (levels <= 1 || slots.length === 1) return slots[slots.length - 1];
  const index = Math.round(((level - 1) / (levels - 1)) * (slots.length - 1));
  return slots[Math.max(0, Math.min(slots.length - 1, index))];
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout — the calendar rect is sized from the container, not the other way
// round: square cells that fill the width (capped by the height), the grid
// centred vertically in whatever is left.
// ─────────────────────────────────────────────────────────────────────────────

type Layout = {
  cellSize: number;
  left: number;
  top: number;
};

function computeLayout(
  width: number,
  height: number,
  weeks: number,
  fixedCellSize: number | undefined,
  hasDayLabels: boolean,
  hasMonthLabels: boolean,
): Layout {
  const left = EDGE_PADDING + (hasDayLabels ? DAY_LABEL_WIDTH : 0);
  const labelTop = EDGE_PADDING + (hasMonthLabels ? MONTH_LABEL_HEIGHT : 0);

  let cellSize = fixedCellSize ?? FALLBACK_CELL_SIZE;
  if (fixedCellSize === undefined && width > 0 && weeks > 0) {
    const fitWidth = Math.floor((width - left - EDGE_PADDING) / weeks);
    const fitHeight =
      height > 0
        ? Math.floor((height - labelTop - EDGE_PADDING) / DAYS_PER_WEEK)
        : Number.POSITIVE_INFINITY;
    cellSize = Math.max(MIN_CELL_SIZE, Math.min(fitWidth, fitHeight));
  }

  const gridHeight = cellSize * DAYS_PER_WEEK;
  const spare = height > 0 ? height - labelTop - EDGE_PADDING - gridHeight : 0;
  const top = labelTop + Math.max(0, Math.floor(spare / 2));

  return { cellSize, left, top };
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton helper — a hard clip window swept across the grid. `floor`
// keeps the grid faintly visible between sweeps; `peak` is the bright band.
// `center` may run outside [0, 1] so the window fully enters and exits.
// ─────────────────────────────────────────────────────────────────────────────

function shimmerWindowStops(center: number, color: string, floor: number, peak: number) {
  const half = LOADING_SHIMMER_BAND;
  const feather = LOADING_SHIMMER_FEATHER;

  const alphaAt = (x: number) => {
    const dist = Math.abs(x - center);
    if (dist <= half - feather) return peak;
    if (dist >= half) return floor;
    // Sine-eased falloff — a linear ramp still reads as a hard cut.
    const eased = Math.sin(((1 - (dist - (half - feather)) / feather) * Math.PI) / 2);
    return floor + (peak - floor) * eased;
  };

  const offsets = [
    0,
    center - half,
    center - half + feather,
    center,
    center + half - feather,
    center + half,
    1,
  ]
    .filter((x) => x >= 0 && x <= 1)
    .sort((a, b) => a - b);

  const stops: { offset: number; color: string }[] = [];
  for (const offset of offsets) {
    if (stops.length === 0 || offset - stops[stops.length - 1].offset > 1e-4) {
      stops.push({ offset, color: withAlpha(color, alphaAt(offset)) });
    }
  }
  return stops;
}

// ─────────────────────────────────────────────────────────────────────────────
// Option builders — pure functions from a snapshot context to ECharts option
// fragments. The component reads its refs ONCE per build into this context;
// nothing below touches React state or the chart instance.
// ─────────────────────────────────────────────────────────────────────────────

type OptionBuildContext = {
  config: ChartConfig;
  grid: GridModel;
  cell: CellSlot;
  monthLabel: MonthLabelSlot | null;
  dayLabel: DayLabelSlot | null;
  tooltipSlot: TooltipSlot;
  weekStart: WeekStart;
  layout: Layout;
  selectedDate: string | null;
  isLoading: boolean;
  revealEnabled: boolean; // play the intro sweep on this push
  resolved: ResolvedColors;
};

function buildCalendarOption(ctx: OptionBuildContext): CalendarComponentOption {
  const { grid, monthLabel, dayLabel, weekStart, layout, resolved } = ctx;
  const { tokens } = resolved;

  return {
    id: "__calendar",
    left: layout.left,
    top: layout.top,
    cellSize: [layout.cellSize, layout.cellSize],
    range: [toIsoDate(grid.range.start), toIsoDate(grid.range.end)],
    orient: "horizontal",
    // The calendar draws nothing of its own — no grid lines, no cell backdrops.
    // Empty days are painted by the custom series so they share the cells'
    // gap and radius.
    splitLine: { show: false },
    itemStyle: { color: "transparent", borderWidth: 0 },
    yearLabel: { show: false },
    monthLabel: {
      show: monthLabel !== null,
      nameMap: monthLabel?.labels ?? DEFAULT_MONTH_LABELS,
      position: "start",
      align: "left",
      margin: LABEL_MARGIN,
      color: tokens.mutedForeground,
      fontSize: 11,
    },
    dayLabel: {
      show: dayLabel !== null,
      firstDay: weekStart === "monday" ? 1 : 0,
      nameMap: dayLabel?.labels ?? DEFAULT_DAY_LABELS,
      position: "start",
      margin: LABEL_MARGIN,
      color: tokens.mutedForeground,
      fontSize: 10,
    },
  };
}

function buildCellSeries(ctx: OptionBuildContext): CustomSeriesOption {
  const { grid, cell, selectedDate, resolved, revealEnabled } = ctx;
  const { tokens } = resolved;
  const slots = resolved.series[cell.dataKey] ?? [];
  const emptyFill = withAlpha(tokens.foreground, EMPTY_CELL_OPACITY);
  const hoverRing = withAlpha(tokens.foreground, HOVER_RING_OPACITY);
  const selectedRing = withAlpha(tokens.foreground, SELECTED_RING_OPACITY);
  const hasSelection = selectedDate !== null;

  const renderItem = (params: RenderItemParams, api: RenderItemApi): RenderItemReturn => {
    const item = grid.cells[params.dataIndex];
    if (!item) return undefined;

    const coordSys = params.coordSys as { cellWidth?: number; cellHeight?: number };
    const cellWidth = coordSys.cellWidth ?? ctx.layout.cellSize;
    const cellHeight = coordSys.cellHeight ?? ctx.layout.cellSize;
    const [cx, cy] = api.coord([api.value(0)]);
    // The gap is carved out of the cell on every side, so the pitch stays
    // exactly one calendar cell and the cell never grows past its slot.
    const gap = Math.min(cell.gap, Math.min(cellWidth, cellHeight) - 1);
    const width = Math.max(1, cellWidth - gap);
    const height = Math.max(1, cellHeight - gap);
    const radius = Math.min(cell.radius, Math.min(width, height) / 2);

    const selected = hasSelection && item.date === selectedDate;
    const dimmed = hasSelection && !selected;
    const fill = item.level === 0 ? emptyFill : rampColor(slots, item.level, grid.levels);

    return {
      type: "rect",
      shape: { x: cx - width / 2, y: cy - height / 2, width, height, r: radius },
      // The selected cell keeps full strength and wears a ring; the rest soften.
      style: {
        fill,
        opacity: dimmed ? CELL_DIM_OPACITY : 1,
        stroke: selected ? selectedRing : "transparent",
        lineWidth: selected ? SELECTED_RING_WIDTH : 0,
      },
      // Draw the selected cell last so its ring is never covered by a neighbour.
      z2: selected ? 2 : 1,
      // Scale about the cell's own centre, so the intro pop and the hover ring
      // both grow from the middle instead of the top-left corner.
      originX: cx,
      originY: cy,
      // Selection/theme/resize changes glide rather than snap.
      transition: ["shape", "style"],
      // Intro: the cell opens from a dot and fades in. Only new elements play
      // this — later pushes update the existing rects in place.
      ...(revealEnabled
        ? {
            enterFrom: {
              // `shape` is required by the type; empty means no shape prop tweens.
              shape: {},
              scaleX: INTRO_CELL_SCALE_FROM,
              scaleY: INTRO_CELL_SCALE_FROM,
              style: { opacity: 0 },
            },
          }
        : {}),
      emphasis: {
        style: { stroke: hoverRing, lineWidth: HOVER_RING_WIDTH },
      },
    };
  };

  return {
    id: "__cells",
    type: "custom",
    coordinateSystem: "calendar",
    calendarId: "__calendar",
    z: 3,
    renderItem,
    // ECharts needs the date in the data to place each item; the value rides
    // along for the tooltip's `params.value`.
    data: grid.cells.map((item) => [item.date, item.value]),
    // Left → right sweep: each week column starts a beat after the previous.
    animation: revealEnabled,
    animationDuration: INTRO_CELL_GROW,
    animationEasing: "cubicOut",
    animationDelay: (dataIndex: number) =>
      (grid.cells[dataIndex]?.column ?? 0) * INTRO_COLUMN_STAGGER,
    animationDurationUpdate: UPDATE_DURATION,
    animationEasingUpdate: "cubicOut",
    animationDelayUpdate: 0,
  };
}

// Tooltip HTML builder, closed over the build context. Each hovered cell shows
// the day as the title and a single swatch + label + value row beneath it.
function createTooltipFormatter(ctx: OptionBuildContext) {
  const { config, grid, cell, tooltipSlot, resolved } = ctx;
  const label = config[cell.dataKey]?.label;
  const labelText = typeof label === "string" ? label : cell.dataKey;
  const colorsCount = config[cell.dataKey] ? getColorsCount(config[cell.dataKey]) : 1;
  const slots = resolved.series[cell.dataKey] ?? [];

  // The swatch shows the hovered cell's OWN level color — a `--color-*` var
  // for a ramp level, a foreground wash for an empty day — rather than the
  // whole ramp, which is what the shared indicator would paint.
  const swatchFor = (item: GridCell) => {
    if (item.level === 0) {
      return `<div class="bg-foreground/10 h-2.5 w-2.5 shrink-0 rounded-[2px]"></div>`;
    }
    const slotIndex = Math.max(0, slots.indexOf(rampColor(slots, item.level, grid.levels)));
    const index = Math.min(colorsCount - 1, slotIndex);
    return `<div class="h-2.5 w-2.5 shrink-0 rounded-[2px]" style="background:var(--color-${cell.dataKey}-${index})"></div>`;
  };

  return (params: unknown): string => {
    const p = params as { dataIndex?: number };
    const item = grid.cells[p.dataIndex ?? -1];
    if (!item) return "";

    return tooltipShell({
      label: tooltipSlot.dateFormatter(item.date),
      body: tooltipRow({
        indicatorHtml: swatchFor(item),
        labelText,
        valueText: tooltipSlot.valueFormatter(item.value),
        dimmed: "",
      }),
      roundness: tooltipSlot.roundness,
      variant: tooltipSlot.variant,
    });
  };
}

function buildTooltipOption(ctx: OptionBuildContext): TooltipComponentOption {
  const { tooltipSlot, isLoading } = ctx;
  return {
    show: tooltipSlot.present && !isLoading,
    trigger: "item",
    confine: true,
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    extraCssText: "box-shadow:none;",
    displayTransition: false,
    // Item-triggered (cells, no axis), so the position wires straight through
    // resolveTooltipPosition rather than tooltipBaseOption (trigger:"axis" only).
    position: resolveTooltipPosition(tooltipSlot.position),
    formatter: createTooltipFormatter(ctx),
  };
}

// Loading skeleton — the same grid in transparent foreground, invisible until
// the first shimmer tick tints it, so there is no flash before the rAF loop
// positions the sweep.
function buildLoadingOption(ctx: OptionBuildContext): EChartsOption {
  const { grid, cell, resolved } = ctx;
  const transparent = withAlpha(resolved.tokens.foreground, 0);

  const renderItem = (params: RenderItemParams, api: RenderItemApi): RenderItemReturn => {
    const coordSys = params.coordSys as { cellWidth?: number; cellHeight?: number };
    const cellWidth = coordSys.cellWidth ?? ctx.layout.cellSize;
    const cellHeight = coordSys.cellHeight ?? ctx.layout.cellSize;
    const [cx, cy] = api.coord([api.value(0)]);
    const gap = Math.min(cell.gap, Math.min(cellWidth, cellHeight) - 1);
    const width = Math.max(1, cellWidth - gap);
    const height = Math.max(1, cellHeight - gap);
    const radius = Math.min(cell.radius, Math.min(width, height) / 2);
    return {
      type: "rect",
      shape: { x: cx - width / 2, y: cy - height / 2, width, height, r: radius },
      style: { fill: transparent },
      silent: true,
    };
  };

  return {
    animation: false,
    tooltip: { show: false },
    calendar: buildCalendarOption(ctx),
    series: [
      {
        id: "__loading",
        type: "custom",
        coordinateSystem: "calendar",
        calendarId: "__calendar",
        silent: true,
        renderItem,
        data: grid.cells.map((item) => [item.date, 0]),
        animation: false,
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Live imperative state — everything the ECharts event handlers, the shimmer
// rAF, and the theme repush read or write OUTSIDE the React render cycle,
// grouped in one ref-stable object. None of it is render output, which is why
// it is not React state.
// ─────────────────────────────────────────────────────────────────────────────

type LiveState = {
  resolved: ResolvedColors | null; // colors read off the live DOM — feeds builds and the shimmer
  selectedDate: string | null; // current selection, kept in step with the React state
  hasRevealed: boolean; // the intro sweep already played on this chart instance
  revealEnabled: boolean; // the current push should create cells with the entrance
  // Latest callbacks/flags for the imperative ECharts click handler.
  handlers: {
    onSelectionChange?: (selection: HeatmapSelection | null) => void;
    isCellClickable: boolean;
    cells: GridCell[];
  };
  // Update-style re-push for paths that bypass React entirely (theme flips,
  // resizes) — set by the sync effect.
  repush: () => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calendar heatmap rendered with Apache ECharts — the GitHub contribution graph
 * shape: one square per day, weeks as columns, color intensity from the config's
 * color ramp. The root owns the date window, the value → level mapping, selection
 * state, the loading skeleton, and the intro sweep; the visual parts — `<Cell>`,
 * `<MonthLabel>`, `<DayLabel>`, `<Tooltip>`, `<Legend>` — are composed as
 * declarative children that render nothing. The root walks those children by
 * reference and drives a single imperative ECharts instance. Fully self-contained:
 * its only dependencies are `react`, `echarts`, and `motion`.
 */
export function EChartsHeatmapChart({
  data,
  config,
  children,
  className,
  renderer = DEFAULT_ECHARTS_RENDERER,
  range,
  weekStart = "sunday",
  cellSize,
  scale = "quantile",
  thresholds,
  defaultSelectedDate = null,
  onSelectionChange,
  isLoading = false,
  animation = true,
  animationType = "default",
  chartOptions,
}: EChartsHeatmapChartProps) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<EChartsInstance | null>(null);

  // The single imperative surface (see LiveState). Object identity is stable
  // for the component's lifetime.
  const live = useRef<LiveState>({
    resolved: null,
    selectedDate: defaultSelectedDate,
    hasRevealed: false,
    revealEnabled: false,
    handlers: {
      onSelectionChange,
      isCellClickable: false,
      cells: [],
    },
    repush: () => {},
  }).current;

  const shouldReduceMotion = useReducedMotion();

  const [selectedDate, setSelectedDate] = useState<string | null>(defaultSelectedDate);

  // ── Declarative config, collected from children by reference ─────────────────
  const collected = useMemo(() => collectConfig(children), [children]);
  const { cell, monthLabel, dayLabel, tooltip: tooltipSlot, legend } = collected;

  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);

  // The ramp has as many levels as the config has colors for the cell's key.
  const seriesKeys = useMemo(() => (cell.dataKey ? [cell.dataKey] : []), [cell.dataKey]);
  const colorsCount = config[cell.dataKey] ? getColorsCount(config[cell.dataKey]) : 1;

  const grid = useMemo(
    () => buildGrid(data, resolveRange(range, data), weekStart, colorsCount, scale, thresholds),
    [data, range, weekStart, colorsCount, scale, thresholds],
  );

  // Refresh the click handler's snapshot of the latest callbacks/flags every render.
  live.handlers = {
    onSelectionChange,
    isCellClickable: cell.isClickable,
    cells: grid.cells,
  };

  // The next selection is derived from the ref, not inside the state updater:
  // React may run an updater more than once, and the callback must fire once.
  const toggleSelection = useCallback(
    (date: string) => {
      const next = live.selectedDate === date ? null : date;
      live.selectedDate = next;
      setSelectedDate(next);
      const { onSelectionChange: cb, cells } = live.handlers;
      if (next === null) {
        cb?.(null);
      } else {
        const item = cells.find((candidate) => candidate.date === next);
        cb?.({ date: next, value: item?.value ?? 0 });
      }
    },
    [live],
  );

  // ── Option builder ───────────────────────────────────────────────────────────
  // Thin orchestrator over the pure builders above: snapshot the imperative
  // surface into an OptionBuildContext, then assemble.
  const buildOption = useCallback((): EChartsOption => {
    const resolved = live.resolved;
    const chart = echartsRef.current;
    if (!resolved || !chart) return {};

    const layout = computeLayout(
      chart.getWidth(),
      chart.getHeight(),
      grid.weeks,
      cellSize,
      dayLabel !== null,
      monthLabel !== null,
    );

    const ctx: OptionBuildContext = {
      config,
      grid,
      cell,
      monthLabel,
      dayLabel,
      tooltipSlot,
      weekStart,
      layout,
      selectedDate,
      isLoading,
      revealEnabled: live.revealEnabled,
      resolved,
    };

    if (isLoading) return buildLoadingOption(ctx);

    return {
      animation: true,
      calendar: buildCalendarOption(ctx),
      tooltip: buildTooltipOption(ctx),
      series: [buildCellSeries(ctx)],
    };
  }, [
    live,
    config,
    grid,
    cell,
    monthLabel,
    dayLabel,
    tooltipSlot,
    weekStart,
    cellSize,
    selectedDate,
    isLoading,
  ]);

  // ── Init + resize + theme observer (per renderer instance) ───────────────────
  useEffect(() => {
    const mount = mountRef.current;
    const container = containerRef.current;
    if (!mount || !container) return;

    const chart = echarts.init(mount, null, { renderer });
    echartsRef.current = chart;

    const resizeObserver = new ResizeObserver(() => {
      // Observers always fire once right after observe(). Only react when the
      // renderer size actually changed — the cells are sized from it.
      if (mount.clientWidth === chart.getWidth() && mount.clientHeight === chart.getHeight()) {
        return;
      }
      chart.resize();
      live.repush();
    });
    resizeObserver.observe(mount);

    // Light/dark flips change no React state — re-resolve and push directly.
    const themeObserver = new MutationObserver(() => {
      live.repush();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Clicking a cell toggles its selection, only when <Cell isClickable> is set.
    chart.on("click", (params) => {
      const { isCellClickable, cells } = live.handlers;
      if (!isCellClickable) return;
      const p = params as { seriesId?: string; dataIndex?: number };
      if (p.seriesId !== "__cells") return;
      const item = cells[p.dataIndex ?? -1];
      if (item) toggleSelection(item.date);
    });

    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
      chart.dispose();
      echartsRef.current = null;
      // The reveal guard belongs to the chart instance it guarded. Without this
      // reset, StrictMode's dev-only mount→unmount→remount plays the entrance on
      // the throwaway instance and the surviving one renders without it.
      live.hasRevealed = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderer]);

  // ── Sync ECharts with props/theme/selection — resolve, build, push ────────────
  useEffect(() => {
    const chart = echartsRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;

    // Colors come from the <style> committed just before this effect ran — read
    // them here, right before the push, rather than round-tripping through state.
    live.resolved = resolveColors(container, config, seriesKeys);

    // Intro sweep, played once per chart instance: ECharts' own enter animation
    // runs on the cells the first time they are created, staggered by week
    // column. Later pushes update those rects in place, so the entrance never
    // replays. A loading cycle re-arms it — the skeleton is a different series,
    // so leaving it creates the cells afresh and the sweep plays again.
    if (isLoading) live.hasRevealed = false;
    const shouldReveal = !live.hasRevealed && !isLoading;
    if (shouldReveal) live.hasRevealed = true;
    live.revealEnabled =
      animation && shouldReveal && animationType !== "none" && !shouldReduceMotion;

    const push = () => {
      const option = buildOption();
      const merged = chartOptions ? { ...option, ...chartOptions } : option;
      // chartOptions is an untyped escape hatch — the spread erases the option's
      // shape, so re-assert it. The only cast in the file.
      chart.setOption(merged as EChartsOption, { notMerge: true });
    };

    push();
    // The entrance belongs to the first push only; anything re-entering through
    // repush (theme, resize) updates cells that already exist.
    live.revealEnabled = false;

    // Theme flips and resizes re-enter here without touching React: re-read the
    // tokens (the .dark class changed, or the renderer resized) and push again.
    live.repush = () => {
      live.resolved = resolveColors(container, config, seriesKeys);
      push();
    };
  }, [
    live,
    buildOption,
    chartOptions,
    isLoading,
    animation,
    animationType,
    shouldReduceMotion,
    config,
    renderer,
    seriesKeys,
  ]);

  // ── Loading shimmer — rAF sweeps a bright band across the skeleton grid ──────
  useEffect(() => {
    const chart = echartsRef.current;
    if (!chart || !isLoading) return;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const phase = ((((now - start) / LOADING_ANIMATION_DURATION) % 1) + 1) % 1;

      // Read tokens per frame, so a theme flip mid-loading retints the shimmer.
      const foreground = live.resolved?.tokens.foreground ?? GRAY;
      const w = chart.getWidth();
      const h = chart.getHeight();
      if (!w || !h) {
        raf = requestAnimationFrame(tick);
        return;
      }
      // Sweep the clip window from fully off-screen left to fully off-screen
      // right, leaned 45°. ABSOLUTE pixel coordinates (global gradient) are
      // shared by every cell, so a column lights up together as the band
      // passes its x-position.
      const maxT = (w + h) / (2 * w);
      const center = phase * (maxT + 2 * LOADING_SHIMMER_BAND) - LOADING_SHIMMER_BAND;
      const fill = new echarts.graphic.LinearGradient(
        0,
        0,
        w,
        w,
        shimmerWindowStops(center, foreground, LOADING_CELL_FLOOR, LOADING_CELL_PEAK),
        true,
      );
      const cells = live.handlers.cells;
      const cellSlot = collected.cell;
      chart.setOption(
        {
          series: [
            {
              id: "__loading",
              renderItem: (params: RenderItemParams, api: RenderItemApi): RenderItemReturn => {
                const coordSys = params.coordSys as { cellWidth?: number; cellHeight?: number };
                const cellWidth = coordSys.cellWidth ?? FALLBACK_CELL_SIZE;
                const cellHeight = coordSys.cellHeight ?? FALLBACK_CELL_SIZE;
                const [cx, cy] = api.coord([api.value(0)]);
                const gap = Math.min(cellSlot.gap, Math.min(cellWidth, cellHeight) - 1);
                const width = Math.max(1, cellWidth - gap);
                const height = Math.max(1, cellHeight - gap);
                const radius = Math.min(cellSlot.radius, Math.min(width, height) / 2);
                return {
                  type: "rect",
                  shape: { x: cx - width / 2, y: cy - height / 2, width, height, r: radius },
                  style: { fill },
                  silent: true,
                };
              },
              data: cells.map((item) => [item.date, 0]),
            },
          ],
        },
        { silent: true, lazyUpdate: true },
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, collected.cell, isLoading, renderer]);

  const legendSwatchStyle = { borderRadius: Math.min(cell.radius, 5) };

  return (
    <div
      ref={containerRef}
      data-chart={chartId}
      className={`relative flex flex-col text-xs ${className ?? ""}`}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="relative min-h-0 w-full flex-1">
        <div ref={mountRef} className="h-full min-h-0 w-full" />
      </div>

      {legend && !isLoading && (
        <div
          className={`text-muted-foreground flex shrink-0 items-center gap-1 pt-2 text-[11px] leading-none ${
            legend.align === "left" ? "justify-start" : "justify-end"
          }`}
        >
          <span className="mr-0.5">{legend.lessLabel}</span>
          <span className="bg-foreground/[0.08] h-2.5 w-2.5 shrink-0" style={legendSwatchStyle} />
          {Array.from({ length: colorsCount }, (_, index) => (
            <span
              key={index}
              className="h-2.5 w-2.5 shrink-0"
              style={{ ...legendSwatchStyle, background: `var(--color-${cell.dataKey}-${index})` }}
            />
          ))}
          <span className="ml-0.5">{legend.moreLabel}</span>
        </div>
      )}

      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="text-primary bg-background flex items-center justify-center gap-2 rounded-md border px-2 py-0.5 text-sm"
          >
            <div className="border-border border-t-primary h-3 w-3 animate-spin rounded-full border" />
            <span>Loading</span>
          </motion.div>
        </div>
      )}
    </div>
  );
}

EChartsHeatmapChart.Cell = Cell;
EChartsHeatmapChart.MonthLabel = MonthLabel;
EChartsHeatmapChart.DayLabel = DayLabel;
EChartsHeatmapChart.Tooltip = Tooltip;
EChartsHeatmapChart.Legend = Legend;

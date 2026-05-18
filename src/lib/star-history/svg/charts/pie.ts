// Pie chart: compares repos by total stars — one slice per repo.

import { arc, pie, type PieArcDatum } from "d3-shape";

import {
  drawFillDefs,
  drawFooter,
  drawLegend,
  planLegend,
  seriesBegin,
  surface,
  svgRoot,
} from "../draw";
import { buildPolarLayout, CHART_WIDTH, polarChartLayout, repoTotal } from "../scales";
import type { RepoSeries, StarHistoryOptions } from "../../types";
import { PALETTES, seriesColor, type Palette } from "../theme";
import { createSvgIds, type SvgIds } from "../ids";
import { drawBackground } from "../backgrounds";
import { animate, el } from "../el";

/** Per-slice reveal duration (seconds). */
const SLICE_DUR = 0.7;
/** Only slices at least this big get a centroid percentage label. */
const LABEL_MIN_FRACTION = 0.07;

/** Round a generated path `d` to 2dp to keep the SVG compact. */
function roundPath(d: string): string {
  return d.replace(/-?\d*\.\d+/g, (m) => String(Math.round(Number(m) * 100) / 100));
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** One pie slice: a filled wedge + an optional centroid percentage label. */
function drawSlice(
  ids: SvgIds,
  datum: PieArcDatum<number>,
  index: number,
  arcGen: ReturnType<typeof arc<PieArcDatum<number>>>,
  center: { cx: number; cy: number },
  colors: string[],
  palette: Palette,
  animated: boolean,
  loopInterval: number,
  showLabels: boolean,
): string {
  const d = arcGen(datum) ?? "";
  if (!d) return "";
  const { cx, cy } = center;

  const reveal = animated
    ? animate({
        attr: "opacity",
        from: 0,
        to: 1,
        dur: SLICE_DUR,
        begin: seriesBegin(index),
        loopInterval,
      })
    : undefined;

  const slice = el(
    "path",
    {
      d: roundPath(d),
      transform: `translate(${cx} ${cy})`,
      fill: `url(#${ids.grad(index)})`,
      // Thin separator stroke between slices — ignores the stroke-width config.
      stroke: seriesColor(colors, index),
      "stroke-width": 1.5,
      "stroke-linejoin": "round",
      opacity: animated ? 0 : undefined,
    },
    reveal,
  );

  // Percentage label at the slice centroid — only for slices big enough to
  // hold it, and never for the all-zero fallback (its angles are synthetic, so
  // the percentages would be meaningless).
  const fraction = (datum.endAngle - datum.startAngle) / (Math.PI * 2);
  if (!showLabels || fraction < LABEL_MIN_FRACTION) return slice;

  const [lx, ly] = arcGen.centroid(datum);
  const labelReveal = animated
    ? animate({
        attr: "opacity",
        from: 0,
        to: 1,
        dur: 0.3,
        begin: round2(seriesBegin(index) + SLICE_DUR),
        loopInterval,
      })
    : "";
  // The fill is a faint tint, so a contrasting title-grey reads on any theme.
  const label = el(
    "text",
    {
      x: cx + lx,
      y: cy + ly,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      "font-size": 11,
      "font-weight": 600,
      fill: palette.title,
      opacity: animated ? 0 : undefined,
    },
    `${Math.round(fraction * 100)}%` + labelReveal,
  );

  return slice + label;
}

/** Build the complete pie-chart SVG string. */
export function generatePieChart(series: RepoSeries[], options: StarHistoryOptions): string {
  const legend = planLegend(CHART_WIDTH, series, options.colors);
  const { cx, cy, radius } = buildPolarLayout(legend.topMargin);
  const layout = polarChartLayout();
  const palette = PALETTES[options.theme];
  const truncated = series.some((s) => s.truncated);
  const loopInterval = options.animate ? options.loopInterval : 0;
  // Per-render ID namespace so inlined charts never share <defs>.
  const ids = createSvgIds();

  const totals = series.map(repoTotal);
  const grandTotal = totals.reduce((sum, t) => sum + t, 0);

  // Slice angles — `sort(null)` keeps repos in input order, the value is each
  // repo's total. A degenerate all-zero set falls back to one full slice.
  const layoutPie = pie<number>()
    .sort(null)
    .value((v) => v);
  const arcs: PieArcDatum<number>[] = layoutPie(grandTotal > 0 ? totals : totals.map(() => 1));

  // `pieInnerRadius` (percent) carves out a donut hole — 0 keeps a full pie.
  const innerRadius = radius * (options.pieInnerRadius / 100);
  const arcGen = arc<PieArcDatum<number>>().innerRadius(innerRadius).outerRadius(radius);

  const slices = arcs
    .map((datum, i) =>
      drawSlice(
        ids,
        datum,
        i,
        arcGen,
        { cx, cy },
        options.colors,
        palette,
        options.animate,
        loopInterval,
        grandTotal > 0,
      ),
    )
    .join("");

  const body =
    el(
      "defs",
      {},
      drawFillDefs(ids, series.length, options.colors, options.fillPattern, options.fillOpacity, 1),
    ) +
    surface(layout, options.background) +
    drawBackground(
      ids,
      layout,
      options.backgroundPattern,
      palette.pattern,
      options.backgroundPatternOpacity,
    ) +
    slices +
    drawLegend(legend, palette) +
    drawFooter(layout, palette, truncated);

  return svgRoot(layout, body);
}

// Radial chart: compares repos by total stars — one concentric ring per repo.
// Supports a full-circle layout and a half-circle (gauge) layout.

import { arc } from "d3-shape";

import {
  drawFillDefs,
  drawFooter,
  drawLegend,
  planLegend,
  seriesBegin,
  svgRoot,
} from "../draw";
import { buildPolarLayout, CHART_WIDTH, polarChartLayout, seriesTotal } from "../scales";
import type { ChartSeries, ChartOptions } from "../../types";
import { PALETTES, seriesColor } from "../theme";
import { drawBackground } from "../backgrounds";
import { createSvgIds } from "../ids";
import { animate, el } from "../el";

const TAU = Math.PI * 2;
/** Per-ring reveal duration (seconds). */
const RING_DUR = 0.8;
/** Gap left between adjacent ring bands. */
const RING_GAP = 6;
/** Floor on the band thickness so a ring never collapses to nothing. */
const MIN_RING = 5;

/** Round a generated path `d` to 2dp to keep the SVG compact. */
function roundPath(d: string): string {
  return d.replace(/-?\d*\.\d+/g, (m) => String(Math.round(Number(m) * 100) / 100));
}

/**
 * Shared radial builder. `half` switches between a full ring and a 180° gauge —
 * the only differences are the angular range and the (re-centered) layout.
 */
function generateRadial(series: ChartSeries[], options: ChartOptions, half: boolean): string {
  const legend = planLegend(CHART_WIDTH, series, options.colors);
  const { cx, cy, radius } = buildPolarLayout(legend.topMargin, half);
  const layout = polarChartLayout();
  const palette = PALETTES[options.theme];
  const truncated = series.some((s) => s.truncated);
  const loopInterval = options.animate ? options.loopInterval : 0;
  // Per-render ID namespace so inlined charts never share <defs>.
  const ids = createSvgIds();

  const totals = series.map(seriesTotal);
  const maxTotal = Math.max(0, ...totals);

  // Angular range — a full turn, or the top semicircle (9 → 3 o'clock).
  const startAngle = half ? -Math.PI / 2 : 0;
  const span = half ? Math.PI : TAU;

  // One band per repo, outermost first. The band uses the user's ring-width,
  // capped so every ring still fits inside the radius; a thin width naturally
  // leaves an empty core.
  const count = Math.max(1, series.length);
  const maxBand = (radius - RING_GAP * (count - 1)) / count;
  const band = Math.max(MIN_RING, Math.min(options.radialRingWidth, maxBand));

  const rings = series
    .map((s, i) => {
      const outer = radius - i * (band + RING_GAP);
      const inner = Math.max(0, outer - band);
      // Proportion of the largest repo — guarded against an all-zero set.
      const frac = maxTotal > 0 ? totals[i] / maxTotal : 0;
      const color = seriesColor(options.colors, i);

      const arcGen = arc()
        .innerRadius(inner)
        .outerRadius(outer)
        .cornerRadius(Math.min(band / 2, 6));
      const sweep = (endAngle: number) => ({
        innerRadius: inner,
        outerRadius: outer,
        startAngle,
        endAngle,
      });

      // Faint track behind the value arc — spans the full angular range.
      const track = el("path", {
        d: roundPath(arcGen(sweep(startAngle + span)) ?? ""),
        transform: `translate(${cx} ${cy})`,
        fill: palette.grid,
        "fill-opacity": 0.5,
      });

      // Value arc, sweeping clockwise from the range start.
      const valueD = arcGen(sweep(startAngle + frac * span)) ?? "";
      if (!valueD) return track;

      const reveal = options.animate
        ? animate({
            attr: "opacity",
            from: 0,
            to: 1,
            dur: RING_DUR,
            begin: seriesBegin(i),
            loopInterval,
          })
        : undefined;

      const value = el(
        "path",
        {
          d: roundPath(valueD),
          transform: `translate(${cx} ${cy})`,
          fill: `url(#${ids.grad(i)})`,
          // Hairline outline — radial rings ignore the stroke-width config.
          stroke: color,
          "stroke-width": 1,
          "stroke-opacity": 0.9,
          opacity: options.animate ? 0 : undefined,
        },
        reveal,
      );

      return track + value;
    })
    .join("");

  const body =
    el(
      "defs",
      {},
      drawFillDefs(ids, series.length, options.colors, options.fillPattern, options.fillOpacity, 1),
    ) +
    drawBackground(
      ids,
      layout,
      options.backgroundPattern,
      palette.pattern,
      options.backgroundPatternOpacity,
    ) +
    rings +
    drawLegend(legend, palette) +
    drawFooter(layout, palette, truncated ? options.truncationNote : "");

  return svgRoot(layout, body);
}

/** Full-circle radial chart. */
export function generateRadialChart(series: ChartSeries[], options: ChartOptions): string {
  return generateRadial(series, options, false);
}

/** Half-circle (gauge) radial chart. */
export function generateRadialHalfChart(series: ChartSeries[], options: ChartOptions): string {
  return generateRadial(series, options, true);
}

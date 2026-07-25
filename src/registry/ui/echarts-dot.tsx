import type * as echarts from "echarts/core";

// ─────────────────────────────────────────────────────────────────────────────
// Dots — map the resting/active variants onto ECharts symbols. Shared by every
// ECharts chart that draws point markers.
// ─────────────────────────────────────────────────────────────────────────────

export type DotVariant = "none" | "default" | "border" | "colored-border" | "ping";

// Dot marker paint — structurally assignable to BOTH the series-level and the
// per-datum itemStyle (the per-datum variant forbids callback color paints, so
// the broader LineSeriesOption["itemStyle"] cannot be reused for it).
export type DotItemStyleOption = {
  color?: string | echarts.graphic.LinearGradient;
  borderColor?: string | echarts.graphic.LinearGradient;
  borderWidth?: number;
  opacity?: number;
};

export type DotStyle = { size: number; itemStyle: DotItemStyleOption };

// Re-color a solid paint at a given alpha (hex #rgb/#rrggbb or rgb/rgba in, rgba
// out; named colors pass through). Used for the translucent "ping" halo ring.
function withAlpha(color: string, alpha: number): string {
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3)
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    const n = parseInt(hex, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const [r, g, b] = m[1].split(",").map((s) => parseFloat(s));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

export function dotItemStyle(
  variant: DotVariant,
  paint: string | echarts.graphic.LinearGradient,
  background: string,
): DotItemStyleOption {
  switch (variant) {
    case "border":
      // Series-colored core with a thick background halo (Recharts r6 / sw5).
      return { color: paint, borderColor: background, borderWidth: 2 };
    case "colored-border":
      // Background-filled core with a thin colored ring (Recharts r3 / sw1).
      return { color: background, borderColor: paint, borderWidth: 1 };
    case "ping": {
      // Solid core wrapped in a wide, translucent same-color ring — a static
      // "ping". The ring is the symbol's BORDER (a stroke ~1.25× the core
      // radius), which fills out to a soft halo disc; a genuinely large symbol
      // would silently fail to render on a category-axis line, so we stroke a
      // small one instead.
      const halo = typeof paint === "string" ? withAlpha(paint, 0.28) : paint;
      return { color: paint, borderColor: halo, borderWidth: 10 };
    }
    case "default":
      return { color: paint, borderWidth: 0 };
    default:
      return {};
  }
}

// Sizes mirror the Recharts markers: default r3, border r6 (mostly halo), and
// colored-border r3+ring. Flattening these to one size makes the hover ring read
// LARGER than a haloed resting dot — the opposite of the Recharts twin.
export const DOT_SIZES: Record<DotVariant, number> = {
  none: 0,
  default: 6,
  border: 8,
  "colored-border": 6,
  ping: 8,
};

export function dotStyle(
  variant: DotVariant,
  paint: string | echarts.graphic.LinearGradient,
  background: string,
): DotStyle {
  return { size: DOT_SIZES[variant], itemStyle: dotItemStyle(variant, paint, background) };
}

// The color the horizontal series gradient shows at position t ∈ [0, 1]. ECharts
// paints a gradient itemStyle relative to each symbol's own bounding box — a full
// rainbow inside every dot — while the Recharts dots clip a chart-wide gradient,
// so each takes the gradient's color at its x-position. Sampling reproduces that.
export function sampleGradient(slots: string[], t: number): string {
  if (slots.length <= 1) return slots[0] ?? "rgba(120, 120, 120, 1)";

  const parse = (color: string) =>
    color
      .match(/rgba?\(([^)]+)\)/)?.[1]
      .split(",")
      .map(Number) ?? [120, 120, 120, 1];

  const position = t * (slots.length - 1);
  const index = Math.min(Math.floor(position), slots.length - 2);
  const fraction = position - index;
  const [r1, g1, b1, a1 = 1] = parse(slots[index]);
  const [r2, g2, b2, a2 = 1] = parse(slots[index + 1]);
  const lerp = (from: number, to: number) => from + (to - from) * fraction;

  return `rgba(${Math.round(lerp(r1, r2))}, ${Math.round(lerp(g1, g2))}, ${Math.round(lerp(b1, b2))}, ${lerp(a1, a2).toFixed(3)})`;
}

import type { ThemeName } from "../types";

export interface Palette {
  /** Default background fill for the theme — used when no override is given. */
  background: string;
  title: string;
  text: string;
  muted: string;
  grid: string;
  axis: string;
  /** Solid border-grey for background pattern shapes. */
  pattern: string;
}

/**
 * Theme palettes. The dark palette mirrors GitHub's canvas (#0c1117 + its
 * border/text greys) so an embedded chart sits flush inside a GitHub README;
 * light is plain white.
 */
export const PALETTES: Record<ThemeName, Palette> = {
  light: {
    background: "#ffffff",
    title: "#0a0a0a",
    text: "#404040",
    muted: "#8a8a8a",
    grid: "#ececec",
    axis: "#d4d4d4",
    pattern: "#d4d4d4",
  },
  dark: {
    background: "#0c1117",
    title: "#e6edf3",
    text: "#8b949e",
    muted: "#6e7681",
    grid: "rgba(255, 255, 255, 0.06)",
    axis: "rgba(255, 255, 255, 0.12)",
    pattern: "#30363d",
  },
};

/** Default per-series line colors, used when the user hasn't picked one. */
export const DEFAULT_COLORS = [
  "#facc15",
  "#3b82f6",
  "#22c55e",
  "#ef4444",
  "#a855f7",
  "#f97316",
  "#14b8a6",
  "#ec4899",
];

/** Color for series `index`: the user's choice, else a palette fallback. */
export function seriesColor(colors: string[], index: number): string {
  return colors[index] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

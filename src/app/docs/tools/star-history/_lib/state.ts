// Client-side config model for the star-history tool.

import type { DateRangeValue } from "@/components/ui/date-range-picker";
import { DEFAULT_COLORS } from "@/lib/star-history/svg/theme";
import type { AxisType, FillPattern, ThemeName } from "@/lib/star-history/types";

export interface RepoEntry {
  /** Stable key for React lists. */
  id: string;
  /** "owner/repo" or a GitHub URL. */
  value: string;
  color: string;
}

export interface StarHistoryConfig {
  repos: RepoEntry[];
  theme: ThemeName;
  axis: AxisType;
  transparent: boolean;
  animate: boolean;
  axisLabels: boolean;
  /** Extra gap (px) between the axis titles and the chart. */
  axisLabelOffset: number;
  /** Chart line stroke width (px). */
  strokeWidth: number;
  /** Area fill opacity as a percent (0–100). */
  fillOpacity: number;
  /** Area fill style. */
  fillPattern: FillPattern;
  range: DateRangeValue;
}

let idCounter = 0;

/** Deterministic id — counter resets per module load, so SSR and client agree. */
export function newRepoId(): string {
  idCounter += 1;
  return `repo-${idCounter}`;
}

export function defaultColor(index: number): string {
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

export function createDefaultConfig(): StarHistoryConfig {
  return {
    repos: [],
    theme: "light",
    axis: "date",
    transparent: false,
    animate: true,
    axisLabels: false,
    axisLabelOffset: 12,
    strokeWidth: 2,
    fillOpacity: 25,
    fillPattern: "gradient",
    range: { mode: "lifetime" },
  };
}

"use client";

import { ZIndexLayer } from "recharts";
import { useId } from "react";

// ── Background Variant Types ─────────────────────────────────────────────────
// To add a new variant:
// 1. Add its name to the BackgroundVariant union type below
// 2. Create a pattern component with PatternProps
// 3. Register it in PATTERN_MAP

export type BackgroundVariant = "dots" | "grid" | "cross-hatch" | "diagonal-lines" | "plus";

// ── Pattern Components ───────────────────────────────────────────────────────

type PatternProps = { id: string };

const DotsPattern = ({ id }: PatternProps) => (
  <pattern id={id} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
    <circle className="text-border dark:text-border" cx="2" cy="2" r="1" fill="currentColor" />
  </pattern>
);

const GridPattern = ({ id }: PatternProps) => (
  <pattern id={id} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
    <path
      className="text-border dark:text-border"
      d="M 20 0 L 0 0 0 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.5"
    />
  </pattern>
);

const CrossHatchPattern = ({ id }: PatternProps) => (
  <pattern id={id} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
    <path
      className="text-border/60 dark:text-border/50"
      d="M 0 0 L 20 20 M 20 0 L 0 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.5"
    />
  </pattern>
);

const DiagonalLinesPattern = ({ id }: PatternProps) => (
  <pattern
    id={id}
    x="0"
    y="0"
    width="6"
    height="6"
    patternUnits="userSpaceOnUse"
    patternTransform="rotate(45)"
  >
    <line
      className="text-border dark:text-border"
      x1="0"
      y1="0"
      x2="0"
      y2="6"
      stroke="currentColor"
      strokeWidth="0.5"
    />
  </pattern>
);

const PlusPattern = ({ id }: PatternProps) => (
  <pattern id={id} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
    <path
      className="text-border dark:text-border"
      d="M 8 4 L 8 12 M 4 8 L 12 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.5"
      strokeLinecap="round"
    />
  </pattern>
);

// ── Pattern Registry ─────────────────────────────────────────────────────────
// Map variant names to pattern components

const PATTERN_MAP: Record<BackgroundVariant, React.FC<PatternProps>> = {
  dots: DotsPattern,
  grid: GridPattern,
  "cross-hatch": CrossHatchPattern,
  "diagonal-lines": DiagonalLinesPattern,
  plus: PlusPattern,
};

// ── Main Component ───────────────────────────────────────────────────────────
// Usage: Place <ChartBackground variant="dots" /> inside any Recharts chart component.
// ZIndexLayer with zIndex={-1} ensures the background renders behind all chart content.

interface ChartBackgroundProps {
  variant: BackgroundVariant;
}

export function ChartBackground({ variant }: ChartBackgroundProps) {
  const baseId = useId().replace(/:/g, "");
  const patternId = `${baseId}-bg-${variant}`;
  const maskId = `${baseId}-bg-edge-fade`;
  const filterId = `${baseId}-bg-blur`;
  const PatternComponent = PATTERN_MAP[variant];

  return (
    <ZIndexLayer zIndex={-1}>
      <defs>
        <PatternComponent id={patternId} />
        {/* Gaussian blur filter for soft edge fade */}
        <filter id={filterId}>
          <feGaussianBlur stdDeviation="25" />
        </filter>
        {/* Mask: a slightly inset white rect with blur creates smooth transparent edges */}
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect x="8%" y="20%" width="85%" height="60%" fill="white" filter={`url(#${filterId})`} />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} mask={`url(#${maskId})`} />
    </ZIndexLayer>
  );
}

"use client";

import { ZIndexLayer } from "recharts";
import { useId } from "react";

// ── Background Variant Types ─────────────────────────────────────────────────
// To add a new variant:
// 1. Add its name to the BackgroundVariant union type below
// 2. Create a pattern component with PatternProps
// 3. Register it in PATTERN_MAP

export type BackgroundVariant =
  | "dots"
  | "grid"
  | "cross-hatch"
  | "diagonal-lines"
  | "plus"
  | "falling-triangles"
  | "4-pointed-star"
  | "tiny-checkers";

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

const FallingTrianglesPattern = ({ id }: PatternProps) => (
  <pattern id={id} x="0" y="0" width="18" height="36" patternUnits="userSpaceOnUse">
    <path
      className="text-border dark:text-border"
      d="M2 6h12L8 18 2 6zm18 36h12l-6 12-6-12z"
      transform="scale(0.5)"
      fill="currentColor"
      fillOpacity="0.4"
    />
  </pattern>
);

const FourPointedStarPattern = ({ id }: PatternProps) => (
  <pattern id={id} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
    <polygon
      className="text-border dark:text-border"
      fillRule="evenodd"
      points="5 3 8 4 5 5 4 8 3 5 0 4 3 3 4 0 5 3"
      fill="currentColor"
      fillOpacity="0.4"
    />
  </pattern>
);

const TinyCheckersPattern = ({ id }: PatternProps) => (
  <pattern id={id} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
    <path
      className="text-border dark:text-border"
      fillRule="evenodd"
      d="M0 0h4v4H0V0zm4 4h4v4H4V4z"
      fill="currentColor"
      fillOpacity="0.2"
    />
  </pattern>
);

// ── Pattern Registry ─────────────────────────────────────────────────────────
// Map variant names to pattern components

const PATTERN_MAP: Record<BackgroundVariant, React.FC<PatternProps>> = {
  dots: DotsPattern,
  grid: GridPattern,
  plus: PlusPattern,
  "cross-hatch": CrossHatchPattern,
  "diagonal-lines": DiagonalLinesPattern,
  "falling-triangles": FallingTrianglesPattern,
  "4-pointed-star": FourPointedStarPattern,
  "tiny-checkers": TinyCheckersPattern,
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

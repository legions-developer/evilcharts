"use client";

import { getColorsCount, indicatorBackground, type ChartConfig } from "@/registry/ui/echarts-chart";
import type { CSSProperties } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Legend overlay (React) — replicates ChartLegendContent + its 7 indicators.
// The legend is HTML inside `[data-chart={id}]`, so it uses the injected
// `--color-*` vars directly. Shared by every ECharts chart.
// ─────────────────────────────────────────────────────────────────────────────

export type LegendVariant =
  | "square"
  | "circle"
  | "circle-outline"
  | "rounded-square"
  | "rounded-square-outline"
  | "vertical-bar"
  | "horizontal-bar";

export function legendFillStyle(key: string, colorsCount: number): CSSProperties {
  if (colorsCount <= 1) return { backgroundColor: `var(--color-${key}-0)` };
  return { background: indicatorBackground(key, colorsCount) };
}

// Punches out the centre with a mask-composite so only the "border" shows —
// works with gradients and border-radius, unlike plain border-color.
export function legendOutlineStyle(key: string, colorsCount: number): CSSProperties {
  const mask: CSSProperties = {
    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    WebkitMaskComposite: "xor",
    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    maskComposite: "exclude",
  };
  return { ...legendFillStyle(key, colorsCount), ...mask };
}

export function LegendIndicator({
  variant,
  dataKey,
  colorsCount,
}: {
  variant: LegendVariant;
  dataKey: string;
  colorsCount: number;
}) {
  const fill = legendFillStyle(dataKey, colorsCount);
  const outline = legendOutlineStyle(dataKey, colorsCount);

  switch (variant) {
    case "square":
      return <div className="h-2 w-2 shrink-0" style={fill} />;
    case "circle":
      return <div className="h-2 w-2 shrink-0 rounded-full" style={fill} />;
    case "circle-outline":
      return <div className="h-2.5 w-2.5 shrink-0 rounded-full p-[1.5px]" style={outline} />;
    case "vertical-bar":
      return <div className="h-3 w-1 shrink-0 rounded-[2px]" style={fill} />;
    case "horizontal-bar":
      return <div className="h-1 w-3 shrink-0 rounded-[2px]" style={fill} />;
    case "rounded-square-outline":
      return <div className="h-2.5 w-2.5 shrink-0 rounded-[3px] p-[1.5px]" style={outline} />;
    case "rounded-square":
    default:
      return <div className="h-2 w-2 shrink-0 rounded-[2px]" style={fill} />;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LegendOverlay — the positioned HTML legend row. The chart computes the
// absolute-positioned `style` (it owns the brush/verticalAlign layout math) and
// passes it in; this renders the entries, their indicators, and the
// selection/hover dim. `verticalAlign` is carried on the props for parity with
// the chart's LegendSlot even though positioning arrives fully via `style`.
// ─────────────────────────────────────────────────────────────────────────────

type LegendOverlayProps = {
  seriesKeys: string[];
  config: ChartConfig;
  variant: LegendVariant;
  align: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  selectedKey: string | null;
  hoveredKey: string | null;
  isClickable: boolean;
  onToggle: (key: string) => void;
  style: CSSProperties;
};

export function LegendOverlay({
  seriesKeys,
  config,
  variant,
  align,
  selectedKey,
  hoveredKey,
  isClickable,
  onToggle,
  style,
}: LegendOverlayProps) {
  const legendJustify =
    align === "left" ? "justify-start" : align === "center" ? "justify-center" : "justify-end";

  return (
    <div style={style} className={`flex items-center gap-4 select-none ${legendJustify}`}>
      {seriesKeys.map((key) => {
        const item = config[key];
        const colorsCount = item ? getColorsCount(item) : 1;
        const isSelected =
          (selectedKey === null || selectedKey === key) &&
          (hoveredKey === null || hoveredKey === key);
        return (
          // No entrance here — the Recharts legend appears instantly, and a
          // fade-in reads as disconnected from the canvas draw-in.
          <div
            key={key}
            className={`flex items-center gap-1.5 transition-opacity ${
              !isSelected ? "opacity-30" : ""
            } ${isClickable ? "cursor-pointer" : ""}`}
            onClick={() => {
              if (isClickable) onToggle(key);
            }}
          >
            <LegendIndicator variant={variant} dataKey={key} colorsCount={colorsCount} />
            {item?.label}
          </div>
        );
      })}
    </div>
  );
}

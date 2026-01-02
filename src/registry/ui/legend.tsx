import { getPayloadConfigFromPayload, getColorsCount, useChart } from "@/registry/ui/chart";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";
import * as React from "react";

function ChartLegendContent({
  className,
  hideIcon = false,
  nameKey,
  payload,
  verticalAlign,
  align = "right",
  selected,
  onSelectChange,
  isClickable,
}: React.ComponentProps<"div"> & {
  hideIcon?: boolean;
  nameKey?: string;
  selected?: string | null;
  isClickable?: boolean;
  onSelectChange?: (selected: string | null) => void;
} & RechartsPrimitive.DefaultLegendContentProps) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-4 select-none",
        align === "left" && "justify-start",
        align === "center" && "justify-center",
        align === "right" && "justify-end",
        verticalAlign === "top" ? "pb-4" : "pt-4",
        className,
      )}
    >
      {payload
        .filter((item) => item.type !== "none")
        .map((item) => {
          // For pie charts, item.value contains the sector name (e.g., "chrome")
          // For other charts, item.dataKey contains the series name (e.g., "desktop")
          // We use item.value first (for pie), then fall back to dataKey (for bar/line/area)
          const key = `${item.value ?? item.dataKey ?? "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);
          const isSelected = selected === null || selected === item.value;

          // Get colors count for this item to determine gradient vs solid
          const colorsCount = itemConfig ? getColorsCount(itemConfig) : 1;

          return (
            <div
              key={item.value}
              className={cn(
                "[&>svg]:text-muted-foreground flex items-center gap-1.5 transition-opacity [&>svg]:h-3 [&>svg]:w-3",
                !isSelected && "opacity-30",
                isClickable && "cursor-pointer",
              )}
              onClick={() => {
                if (!isClickable) return;

                onSelectChange?.(selected === item.value ? null : (item.value ?? null));
              }}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={getLegendColorStyle(key, colorsCount)}
                />
              )}
              {itemConfig?.label}
            </div>
          );
        })}
    </div>
  );
}

function getLegendColorStyle(dataKey: string, colorsCount: number): React.CSSProperties {
  if (colorsCount <= 1) {
    // Single color: use solid background via CSS variable
    return {
      backgroundColor: `var(--color-${dataKey}-0)`,
    };
  }

  // Multiple colors: create linear gradient with evenly distributed stops
  const stops = Array.from({ length: colorsCount }, (_, index) => {
    const offset = (index / (colorsCount - 1)) * 100;
    return `var(--color-${dataKey}-${index}) ${offset}%`;
  }).join(", ");

  return {
    background: `linear-gradient(to right, ${stops})`,
  };
}

const ChartLegend = RechartsPrimitive.Legend;

export { ChartLegend, ChartLegendContent };

import { getPayloadConfigFromPayload, useChart } from "@/registry/ui/chart";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";
import * as React from "react";

const ChartLegend = RechartsPrimitive.Legend;

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
          const key = `${nameKey ?? item.dataKey ?? "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);
          const isSelected = selected === null || selected === item.value;

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
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          );
        })}
    </div>
  );
}

export { ChartLegend, ChartLegendContent };

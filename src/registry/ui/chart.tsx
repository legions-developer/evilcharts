// Thanks to @shadcn for creating chart component - Modified by EvilCharts
"use client";

import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";
import * as React from "react";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
>;

interface ChartContextProps {
  config: ChartConfig;
}

const ChartContext = React.createContext<ChartContextProps | null>(null);

export function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

interface ChartContainerProps
  extends
    Omit<React.ComponentProps<"div">, "children">,
    Pick<
      React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>,
      | "initialDimension"
      | "aspect"
      | "debounce"
      | "minHeight"
      | "minWidth"
      | "maxHeight"
      | "height"
      | "width"
      | "onResize"
      | "children"
    > {
  config: ChartConfig;
  innerResponsiveContainerStyle?: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["style"];
}

function ChartContainer({
  id,
  config,
  initialDimension = { width: 320, height: 200 },
  className,
  children,
  ...props
}: Readonly<ChartContainerProps>) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer initialDimension={initialDimension}>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, config]) => config.theme ?? config.color);

  if (!colorConfig.length) {
    return null;
  }

  const generateCssVars = (theme: string) =>
    colorConfig
      .map(([key, itemConfig]) => {
        const color =
          itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ?? itemConfig.color;
        return color ? `  --color-${key}: ${color};` : null;
      })
      .filter(Boolean)
      .join("\n");

  const css = Object.entries(THEMES)
    .map(([theme, prefix]) => `${prefix} [data-chart=${id}] {\n${generateCssVars(theme)}\n}`)
    .join("\n");

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
};

// Helper to extract item config from a payload.
export function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const payloadPayload =
    "payload" in payload && typeof payload.payload === "object" && payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (key in payload && typeof payload[key as keyof typeof payload] === "string") {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string;
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

export { ChartContainer, ChartStyle };

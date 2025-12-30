import { ChartConfig, useChart } from "./chart";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";
import * as React from "react";

export type DotVariant = "default" | "border" | "colored-border";

type ChartDotProps = React.ComponentProps<typeof RechartsPrimitive.Dot> & {
  dataKey: keyof ChartConfig;
  type?: DotVariant;
};

const ChartDot = React.memo(function ChartDot({
  cx,
  cy,
  fill,
  dataKey,
  className,
  fillOpacity = 1,
  type = "default",
}: ChartDotProps) {
  const commonProps = {
    cx,
    cy,
    fill,
    dataKey,
    fillOpacity,
    className,
  };

  const { config } = useChart();
  const baseColor = config[dataKey]?.color;

  switch (type) {
    case "border":
      return <PrimaryBorderDot {...commonProps} fill={baseColor} />;
    case "colored-border":
      return <ColoredBorderDot {...commonProps} stroke={baseColor} />;
    default:
      return <DefaultDot {...commonProps} fill={baseColor} />;
  }
});

const DefaultDot = React.memo((props: ChartDotProps) => {
  return <RechartsPrimitive.Dot {...props} r={3} />;
});

DefaultDot.displayName = "DefaultDot";

const PrimaryBorderDot = React.memo((props: ChartDotProps) => {
  return (
    <RechartsPrimitive.Dot
      {...props}
      r={4.5}
      strokeWidth="3"
      stroke="currentColor"
      className={cn(props.className, "text-background")}
    />
  );
});

PrimaryBorderDot.displayName = "PrimaryBorderDot";

const ColoredBorderDot = React.memo((props: ChartDotProps) => {
  return (
    <RechartsPrimitive.Dot
      {...props}
      r={3}
      fill="currentColor"
      strokeWidth="1"
      fillOpacity="1"
      strokeOpacity={props.fillOpacity}
      className={cn(props.className, "text-background")}
    />
  );
});

ColoredBorderDot.displayName = "ColoredBorderDot";

export { ChartDot };

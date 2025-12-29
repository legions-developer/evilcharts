import { ChartConfig, useChart } from "./chart";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";
import * as React from "react";

export type DotType = "default" | "border" | "colored-border";

type ChartDotProps = React.ComponentProps<typeof RechartsPrimitive.Dot> & {
  dataKey: keyof ChartConfig;
  type?: DotType;
};

const ChartDot = React.memo(function ChartDot({
  cx,
  cy,
  fill,
  dataKey,
  className,
  fillOpacity = 1,
  type = "default",
  ...restProps
}: ChartDotProps) {
  const commonProps = {
    cx,
    cy,
    fill,
    dataKey,
    fillOpacity,
    className,
    ...restProps,
  };

  switch (type) {
    case "border":
      return <PrimaryBorderDot {...commonProps} />;
    case "colored-border":
      return <ColoredBorderDot {...commonProps} />;
    default:
      return <DefaultDot {...commonProps} />;
  }
});

const DefaultDot = React.memo((props: ChartDotProps) => {
  return <RechartsPrimitive.Dot {...props} r={4} />;
});

DefaultDot.displayName = "DefaultDot";

const PrimaryBorderDot = React.memo((props: ChartDotProps) => {
  return (
    <RechartsPrimitive.Dot
      {...props}
      r={4}
      strokeWidth="3"
      stroke="currentColor"
      className={cn(props.className, "text-background")}
    />
  );
});

PrimaryBorderDot.displayName = "PrimaryBorderDot";

const ColoredBorderDot = React.memo((props: ChartDotProps) => {
  const { config } = useChart();
  const strokeColor = config[props.dataKey]?.color;

  return (
    <RechartsPrimitive.Dot
      {...props}
      r={4}
      fill="currentColor"
      strokeWidth="1"
      stroke={strokeColor}
      className={cn(props.className, "text-background")}
    />
  );
});

ColoredBorderDot.displayName = "ColoredBorderDot";

export { ChartDot };

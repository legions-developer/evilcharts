"use client";

import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";
import { motion, AnimatePresence } from "motion/react";
import { JetBrains_Mono } from "next/font/google";
import { Bar, BarChart, XAxis } from "recharts";
import { SVGProps } from "react";
import * as React from "react";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const chartData = [
  { month: "January", desktop: 342 },
  { month: "February", desktop: 876 },
  { month: "March", desktop: 512 },
  { month: "April", desktop: 629 },
  { month: "May", desktop: 458 },
  { month: "June", desktop: 781 },
  { month: "July", desktop: 394 },
  { month: "August", desktop: 925 },
  { month: "September", desktop: 647 },
  { month: "October", desktop: 532 },
  { month: "November", desktop: 803 },
  { month: "December", desktop: 271 },
  { month: "January", desktop: 342 },
  { month: "February", desktop: 876 },
  { month: "March", desktop: 512 },
  { month: "April", desktop: 629 },
  { month: "May", desktop: 458 },
  { month: "June", desktop: 781 },
  { month: "July", desktop: 394 },
  { month: "August", desktop: 925 },
  { month: "September", desktop: 647 },
  { month: "October", desktop: 532 },
  { month: "November", desktop: 803 },
  { month: "December", desktop: 271 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    colors: {
      light: ["#18181b"],
      dark: ["#fafafa"],
    },
  },
} satisfies ChartConfig;

export function EvilMonospaceBarChart() {
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined);
  const leaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleMouseEnter = (index: number) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = undefined;
    }
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setActiveIndex(undefined);
    }, 50);
  };

  return (
    <ChartContainer config={chartConfig} className="h-full w-full p-4">
      <BarChart accessibilityLayer data={chartData} onMouseLeave={handleMouseLeave}>
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <Bar
          dataKey="desktop"
          fill="var(--color-desktop-0)"
          shape={<CustomBar handleBarEnter={handleMouseEnter} activeIndex={activeIndex} />}
        />
      </BarChart>
    </ChartContainer>
  );
}

interface CustomBarProps extends SVGProps<SVGSVGElement> {
  handleBarEnter: (index: number) => void;
  index?: number;
  activeIndex?: number;
  value?: string;
  background?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
}

const CustomBar = (props: CustomBarProps) => {
  const { fill, x, y, width, height, index, activeIndex, value, background, handleBarEnter } =
    props;

  const xPos = Number(x || 0);
  const yPos = Number(y || 0);
  const realWidth = Number(width || 0);
  const realHeight = Number(height || 0);
  const isActive = index === activeIndex;

  // Center position for the bar
  const centerX = xPos + realWidth / 2;
  const centerY = yPos + realHeight / 2;

  // Scale factor: collapsed = thin line, expanded = full width
  const collapsedScale = 0.05;

  // Hit area dimensions - use background for full column height, fallback to bar dimensions
  const hitAreaX = background?.x ?? xPos;
  const hitAreaY = background?.y ?? yPos;
  const hitAreaWidth = background?.width ?? realWidth;
  const hitAreaHeight = background?.height ?? realHeight;

  return (
    <g>
      {/* Invisible hit area for easier hover targeting */}
      <rect
        x={hitAreaX}
        y={hitAreaY}
        width={hitAreaWidth}
        height={hitAreaHeight}
        fill="transparent"
        style={{ cursor: "pointer" }}
        onMouseEnter={() => handleBarEnter(index!)}
      />
      {/* Render bar with scaleX animation from center */}
      <motion.rect
        key={`bar-${index}`}
        x={xPos}
        y={y}
        width={realWidth}
        height={height}
        fill={fill}
        initial={{ scaleX: collapsedScale }}
        animate={{ scaleX: isActive ? 1 : collapsedScale }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        style={{
          transformOrigin: `${centerX}px ${centerY}px`,
          transformBox: "fill-box",
          pointerEvents: "none",
        }}
      />
      {/* Render value text on top of bar */}
      <AnimatePresence>
        {isActive && (
          <motion.text
            key={`text-${index}`}
            className={jetBrainsMono.className}
            initial={{ opacity: 0, y: -10, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(3px)" }}
            transition={{ duration: 0.2 }}
            x={centerX}
            y={yPos - 5}
            textAnchor="middle"
            fill={fill}
            style={{ pointerEvents: "none" }}
          >
            {value}
          </motion.text>
        )}
      </AnimatePresence>
    </g>
  );
};

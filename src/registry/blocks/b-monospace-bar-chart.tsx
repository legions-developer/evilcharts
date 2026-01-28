"use client";

import { type ChartConfig, ChartContainer } from "@/registry/ui/chart";
import { motion, AnimatePresence } from "motion/react";
import { JetBrains_Mono } from "next/font/google";
import { Bar, BarChart, Rectangle, XAxis } from "recharts";

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
  return (
    <ChartContainer config={chartConfig} className="h-full w-full p-4">
      <BarChart accessibilityLayer data={chartData}>
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
          shape={BarShape}
          activeBar={BarShape}
        />
      </BarChart>
    </ChartContainer>
  );
}

interface BarProps {
  index?: number;
  value?: number | [number, number];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  isActive?: boolean;
}

// Scale factor: collapsed = thin line, expanded = full width
const COLLAPSED_SCALE = 0.1; // [!code highlight]

const BarShape = (props: BarProps) => {
  const { fill, x, y, width, height, index, value, isActive } = props;

  const xPos = Number(x || 0);
  const yPos = Number(y || 0);
  const realWidth = Number(width || 0);
  const realHeight = Number(height || 0);

  // Center position for the bar
  const centerX = xPos + realWidth / 2;
  const centerY = yPos + realHeight / 2;

  return (
    <>
      <Rectangle {...props} fill="transparent" />

      <AnimatePresence>
        <motion.rect
          key={`bar-${index}`}
          x={xPos}
          y={yPos}
          width={realWidth}
          height={realHeight}
          fill={fill}
          initial={{ scaleX: isActive ? COLLAPSED_SCALE : 1 }}
          animate={{ scaleX: isActive ? 1 : COLLAPSED_SCALE }}
          exit={{ scaleX: COLLAPSED_SCALE }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          style={{
            transformOrigin: `${centerX}px ${centerY}px`,
            transformBox: "fill-box",
          }}
        />
      </AnimatePresence>
      {isActive && (
        <AnimatePresence>
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
        </AnimatePresence>
      )}
    </>
  );
};

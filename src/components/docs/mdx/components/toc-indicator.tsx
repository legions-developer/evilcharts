"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import * as React from "react";

const STARTING_MARGIN = 8;
const ITEM_HEIGHT = 26.28;
const ITEM_GAP = 8;
const DEPTH_INDENT = 10;
const INITIAL_OFFSET = 8;
const DEPTH_BEND_LENGTH = 8;
const CENTER_OFFSET = 6.5;

const SPRING_CONFIG = { stiffness: 180, damping: 20 };

const GRADIENT_HEIGHT = ITEM_HEIGHT * 2.5;

interface TocItem {
  title?: React.ReactNode;
  url: string;
  depth: number;
}

interface TocIndicatorProps {
  toc: TocItem[];
  activeIndex: number;
  className?: string;
}

interface PathData {
  path: string;
  totalLength: number;
  itemCenterDistances: number[];
}

function getXForDepth(depth: number, minDepth: number): number {
  return STARTING_MARGIN + (depth - minDepth) * DEPTH_INDENT;
}

function getRowBottomY(index: number, isLast: boolean): number {
  const baseY = INITIAL_OFFSET + ITEM_HEIGHT * (index + 1) - ITEM_GAP;
  return isLast ? baseY - 8 : baseY;
}

function getDiagonalDistance(deltaX: number): number {
  return Math.sqrt(deltaX ** 2 + DEPTH_BEND_LENGTH ** 2);
}

function getItemCenterY(index: number): number {
  return INITIAL_OFFSET + ITEM_HEIGHT * index + ITEM_HEIGHT / 2 - ITEM_GAP;
}

function generatePathData(toc: TocItem[]): PathData {
  if (toc.length === 0) return { path: "", totalLength: 0, itemCenterDistances: [] };

  const minDepth = Math.min(...toc.map((item) => item.depth));
  const pathParts: string[] = [];
  const itemCenterDistances: number[] = [];

  let currentX = getXForDepth(toc[0].depth, minDepth);
  let currentY = INITIAL_OFFSET - STARTING_MARGIN;
  let accumulatedLength = 0;

  pathParts.push(`M ${currentX} ${currentY}`);

  for (let i = 0; i < toc.length; i++) {
    const isLastItem = i === toc.length - 1;
    const rowBottomY = getRowBottomY(i, isLastItem);
    const nextItem = toc[i + 1];

    const itemCenterY = getItemCenterY(i);
    const distanceToCenter = itemCenterY - currentY;
    itemCenterDistances.push(accumulatedLength + distanceToCenter + CENTER_OFFSET);

    const verticalLength = rowBottomY - currentY;
    accumulatedLength += verticalLength;
    pathParts.push(`L ${currentX} ${rowBottomY}`);
    currentY = rowBottomY;

    if (nextItem) {
      const nextX = getXForDepth(nextItem.depth, minDepth);

      if (nextX !== currentX) {
        const deltaX = nextX - currentX;
        accumulatedLength += getDiagonalDistance(deltaX);
        pathParts.push(`L ${nextX} ${currentY + DEPTH_BEND_LENGTH}`);
        currentX = nextX;
        currentY += DEPTH_BEND_LENGTH;
      }
    }
  }

  return { path: pathParts.join(" "), totalLength: accumulatedLength, itemCenterDistances };
}

function usePathData(toc: TocItem[]) {
  return React.useMemo(() => generatePathData(toc), [toc]);
}

function getActiveDistance(activeIndex: number, itemCenterDistances: number[]): number {
  const isValidIndex = activeIndex >= 0 && activeIndex < itemCenterDistances.length;
  return isValidIndex ? itemCenterDistances[activeIndex] : 0;
}

export function TocIndicator({ toc, activeIndex, className }: TocIndicatorProps) {
  const { path, totalLength, itemCenterDistances } = usePathData(toc);

  const activeDistance = getActiveDistance(activeIndex, itemCenterDistances);
  const isActive = activeDistance > 0;

  const animatedDistance = useSpring(0, SPRING_CONFIG);
  const prevActiveIndexRef = React.useRef(activeIndex);
  const tailRotate = useSpring(90, SPRING_CONFIG);
  const tailMarginTop = useSpring(-38, SPRING_CONFIG);

  React.useEffect(() => {
    if (activeIndex !== prevActiveIndexRef.current) {
      const movingDown = activeIndex > prevActiveIndexRef.current;
      tailRotate.set(movingDown ? 90 : -90);
      tailMarginTop.set(movingDown ? -38 : -38 + 70);
      prevActiveIndexRef.current = activeIndex;
    }
    animatedDistance.set(activeDistance);
  }, [activeDistance, activeIndex, animatedDistance, tailRotate, tailMarginTop]);

  const offsetDistancePercent = useTransform(animatedDistance, (v) =>
    totalLength > 0 ? `${(v / totalLength) * 100}%` : "0%",
  );

  // Calculate gradient Y positions (gradient moves with progress but has fixed height)
  const startY = INITIAL_OFFSET - STARTING_MARGIN;
  const gradientY2 = useTransform(animatedDistance, (v) => startY + v);
  const gradientY1 = useTransform(gradientY2, (y2) => Math.max(0, y2 - GRADIENT_HEIGHT));

  const cssOffsetPath = `path('${path}')`;

  return (
    <div
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0px, currentColor 15px, currentColor 100%)",
      }}
      className={cn("text-path pointer-events-none absolute h-full w-full", className)}
    >
      <svg className="h-full w-full" overflow="visible">
        <defs>
          <marker
            id="toc-end-circle"
            markerWidth="6"
            markerHeight="6"
            refX="3"
            refY="3"
            orient="auto"
          >
            <circle cx="3" cy="3" r="2" fill="currentColor" />
          </marker>
          <mask id="toc-path-mask" maskUnits="userSpaceOnUse">
            <path
              d={path}
              stroke="white"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </mask>
          <motion.linearGradient
            id="toc-progress-gradient"
            gradientUnits="userSpaceOnUse"
            x1="0"
            x2="0"
            y1={gradientY1}
            y2={gradientY2}
          >
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="1" />
          </motion.linearGradient>
        </defs>
        <path
          d={path}
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          markerEnd="url(#toc-end-circle)"
        />
      </svg>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          mask: "url(#toc-path-mask)",
          WebkitMask: "url(#toc-path-mask)",
        }}
      >
        <motion.div
          id="gradient-tail-of-toc-indicator"
          className="absolute top-0 left-0"
          style={{
            width: 80,
            height: 80,
            offsetPath: cssOffsetPath,
            offsetRotate: "0deg",
            rotate: tailRotate,
            marginLeft: 0.2,
            marginTop: tailMarginTop,
            offsetDistance: offsetDistancePercent,
            opacity: isActive ? 1 : 0,
          }}
        >
          <svg width="80" height="80" viewBox="0 0 80 80" className="overflow-visible">
            <defs>
              <radialGradient
                id="toc-glow-radial"
                cx="0.5"
                cy="0.5"
                fx="0.9"
                gradientUnits="objectBoundingBox"
              >
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="1" />
                <stop offset="100%" stopColor="transparent" stopOpacity="1" />
              </radialGradient>
            </defs>
            <ellipse cx="40" cy="40" rx="40" ry="40" fill="url(#toc-glow-radial)" />
          </svg>
        </motion.div>
      </div>
      <motion.div
        className="bg-primary absolute top-0 left-0 size-[6px] rounded-[1px]"
        style={{
          offsetPath: cssOffsetPath,
          offsetRotate: "0deg",
          rotate: "45deg",
          marginLeft: 0.2,
          marginTop: -3,
          offsetDistance: offsetDistancePercent,
          opacity: isActive ? 1 : 0,
        }}
      />
    </div>
  );
}

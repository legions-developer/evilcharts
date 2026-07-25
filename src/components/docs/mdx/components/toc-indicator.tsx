"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import * as React from "react";

const STARTING_MARGIN = 8;
const DEPTH_INDENT = 10;
const DEPTH_BEND_LENGTH = 8;

const SPRING_CONFIG = { stiffness: 180, damping: 20 };

const GRADIENT_HEIGHT = 66;

interface TocItem {
  title?: React.ReactNode;
  url: string;
  depth: number;
}

// Every row's real geometry, relative to the indicator's own box. Measured rather
// than derived from a constant row height: a heading long enough to wrap makes the
// list taller than any fixed step, and the path — and with it the active marker —
// would drift a full line further out of place with each wrapped entry above it.
export interface RowMetrics {
  top: number;
  height: number;
}

interface TocIndicatorProps {
  toc: TocItem[];
  activeIndex: number;
  className?: string;
  rows: RowMetrics[];
}

interface PathData {
  path: string;
  totalLength: number;
  itemCenterDistances: number[];
}

function getXForDepth(depth: number, minDepth: number): number {
  return STARTING_MARGIN + (depth - minDepth) * DEPTH_INDENT;
}

function getDiagonalDistance(deltaX: number): number {
  return Math.sqrt(deltaX ** 2 + DEPTH_BEND_LENGTH ** 2);
}

function generatePathData(toc: TocItem[], rows: RowMetrics[]): PathData {
  // Before the first measurement there is nothing to draw against; the layout
  // effect fills rows in before paint, so this never shows as a flash.
  if (toc.length === 0 || rows.length !== toc.length) {
    return { path: "", totalLength: 0, itemCenterDistances: [] };
  }

  const minDepth = Math.min(...toc.map((item) => item.depth));
  const pathParts: string[] = [];
  const itemCenterDistances: number[] = [];

  let currentX = getXForDepth(toc[0].depth, minDepth);
  let currentY = rows[0].top - STARTING_MARGIN;
  let accumulatedLength = 0;

  pathParts.push(`M ${currentX} ${currentY}`);

  for (let i = 0; i < toc.length; i++) {
    const isLastItem = i === toc.length - 1;
    const row = rows[i];
    const itemCenterY = row.top + row.height / 2;
    // The line runs to the bottom of each row so the bend into the next depth
    // happens in the gap, but stops at the centre of the last one — that is where
    // the end marker belongs, whether that row is one line or three.
    const rowBottomY = isLastItem ? itemCenterY : row.top + row.height;
    const nextItem = toc[i + 1];

    const distanceToCenter = itemCenterY - currentY;
    itemCenterDistances.push(accumulatedLength + distanceToCenter);

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

function sameRows(a: RowMetrics[], b: RowMetrics[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (row, i) => Math.abs(row.top - b[i].top) < 0.5 && Math.abs(row.height - b[i].height) < 0.5,
    )
  );
}

/**
 * Each row measured against the wrapper the indicator is stretched over, so both
 * share one coordinate system. Called from the PARENT rather than from inside the
 * indicator: the indicator renders before the list, and a sibling's ref is not yet
 * attached when an earlier sibling's layout effect runs — measuring there reads null
 * once and, with only stable refs in its deps, never gets a second chance.
 *
 * Re-measures on anything that can rewrap a heading: the sidebar resizing, a font
 * landing late, the toc itself changing.
 */
export function useRowMetrics(
  originRef: React.RefObject<HTMLDivElement | null>,
  listRef: React.RefObject<HTMLDivElement | null>,
  count: number,
) {
  const [rows, setRows] = React.useState<RowMetrics[]>([]);

  React.useLayoutEffect(() => {
    const origin = originRef.current;
    const list = listRef.current;
    if (!origin || !list) return;

    const measure = () => {
      const originY = origin.getBoundingClientRect().top;
      const next = Array.from(list.children).map((child) => {
        const rect = child.getBoundingClientRect();
        return { top: rect.top - originY, height: rect.height };
      });
      // Bail when nothing moved: the observer fires on our own re-render too, and
      // an unconditional setState would loop.
      setRows((prev) => (sameRows(prev, next) ? prev : next));
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(list);
    for (const child of Array.from(list.children)) observer.observe(child);

    return () => observer.disconnect();
  }, [originRef, listRef, count]);

  return rows;
}

function getActiveDistance(activeIndex: number, itemCenterDistances: number[]): number {
  const isValidIndex = activeIndex >= 0 && activeIndex < itemCenterDistances.length;
  return isValidIndex ? itemCenterDistances[activeIndex] : 0;
}

export function TocIndicator({ toc, activeIndex, className, rows }: TocIndicatorProps) {
  const { path, totalLength, itemCenterDistances } = React.useMemo(
    () => generatePathData(toc, rows),
    [toc, rows],
  );

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
  const startY = rows.length > 0 ? rows[0].top - STARTING_MARGIN : 0;
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
      {/* No vertical nudge: offset-anchor already rides the box's centre along the
          path, and the path now hits each row's true centre — the old -3 was there to
          cancel a fudge factor in the hand-rolled row geometry. */}
      <motion.div
        className="bg-primary absolute top-0 left-0 size-[6px] rounded-[1px]"
        style={{
          offsetPath: cssOffsetPath,
          offsetRotate: "0deg",
          rotate: "45deg",
          marginLeft: 0.2,
          offsetDistance: offsetDistancePercent,
          opacity: isActive ? 1 : 0,
        }}
      />
    </div>
  );
}

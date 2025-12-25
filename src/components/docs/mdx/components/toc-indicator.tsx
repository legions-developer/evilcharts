"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import * as React from "react";

const STARTING_MARGIN = 8;
const ITEM_HEIGHT = 26.28;
const ITEM_GAP = 8;
const DEPTH_INDENT = 10;
const INITIAL_OFFSET = 8;

interface TocIndicatorProps {
  toc: {
    title?: React.ReactNode;
    url: string;
    depth: number;
  }[];
  activeIndex: number;
  className?: string;
}

interface PathData {
  path: string;
  totalLength: number;
  segmentStartLengths: number[]; // cumulative length at START of each item's vertical segment
  hasDepthChangeBefore: boolean[]; // whether the previous item had a depth change
}

function generateZigZagPath(toc: TocIndicatorProps["toc"]): PathData {
  const empty: PathData = { path: "", totalLength: 0, segmentStartLengths: [], hasDepthChangeBefore: [] };
  if (toc.length === 0) return empty;

  const minDepth = Math.min(...toc.map((item) => item.depth));
  const getX = (depth: number) => STARTING_MARGIN + (depth - minDepth) * DEPTH_INDENT;
  const getRowBottom = (i: number, isLast: boolean) =>
    INITIAL_OFFSET + ITEM_HEIGHT * (i + 1) - ITEM_GAP - (isLast ? 8 : 0);

  const segments: number[] = [];
  const depthChanges: boolean[] = [false];
  const pathParts: string[] = [];

  let x = getX(toc[0].depth);
  let y = INITIAL_OFFSET - STARTING_MARGIN;
  let length = 0;

  pathParts.push(`M ${x} ${y}`);

  toc.forEach((item, i) => {
    const isLast = i === toc.length - 1;
    const bottom = getRowBottom(i, isLast);

    // Record length at segment start, then draw vertical line
    segments.push(length);
    length += Math.abs(bottom - y);
    pathParts.push(`L ${x} ${bottom}`);
    y = bottom;

    // Handle depth transition to next item
    const next = toc[i + 1];
    if (!next) return;

    const nextX = getX(next.depth);
    const hasChange = nextX !== x;
    depthChanges.push(hasChange);

    if (hasChange) {
      length += Math.sqrt((nextX - x) ** 2 + 64); // diagonal with 8px vertical
      pathParts.push(`L ${nextX} ${bottom + 8}`);
      x = nextX;
      y = bottom + 8;
    }
  });

  return {
    path: pathParts.join(" "),
    totalLength: length,
    segmentStartLengths: segments,
    hasDepthChangeBefore: depthChanges,
  };
}

export function TocIndicator({ toc, activeIndex, className }: TocIndicatorProps) {
  const pathRef = React.useRef<SVGPathElement>(null);
  const [position, setPosition] = React.useState({ x: 8, y: 0 });
  const {
    path: pathD,
    totalLength,
    segmentStartLengths,
    hasDepthChangeBefore,
  } = React.useMemo(() => generateZigZagPath(toc), [toc]);

  const getOffsetForItem = (index: number) => {
    if (hasDepthChangeBefore[index]) {
      return (ITEM_HEIGHT - ITEM_GAP) / 2;
    }
    return ITEM_HEIGHT / 1.6;
  };

  const activeLength =
    activeIndex >= 0 && activeIndex < segmentStartLengths.length
      ? segmentStartLengths[activeIndex] + getOffsetForItem(activeIndex)
      : 0;

  const dashOffset = totalLength - activeLength;

  React.useEffect(() => {
    if (pathRef.current && activeLength > 0) {
      const point = pathRef.current.getPointAtLength(activeLength);
      setPosition({ x: point.x, y: point.y });
    }
  }, [activeLength]);

  return (
    <div className={cn("text-path pointer-events-none absolute h-full w-full", className)}>
      <svg className="h-full w-full" overflow="visible">
        <defs>
          <marker id="toc-end-circle" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <circle cx="3" cy="3" r="2.5" fill="currentColor" />
          </marker>
        </defs>
        <path
          ref={pathRef}
          d={pathD}
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          markerEnd="url(#toc-end-circle)"
        />
        <motion.path
          d={pathD}
          stroke="white"
          strokeWidth="1"
          fill="none"
          strokeDasharray={totalLength}
          initial={{ strokeDashoffset: totalLength }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 20,
          }}
        />
        <motion.rect
          className="text-primary"
          width="6"
          height="6"
          rx="1"
          fill="currentColor"
          style={{
            rotate: 45,
            transformOrigin: "center",
            transformBox: "fill-box",
          }}
          initial={{ x: 8, y: 0, opacity: 0 }}
          animate={{
            x: position.x - 3,
            y: position.y - 3,
            opacity: activeLength > 0 ? 1 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 20,
          }}
        />
      </svg>
    </div>
  );
}

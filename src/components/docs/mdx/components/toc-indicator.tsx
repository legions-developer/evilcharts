"use client";

import { motion } from "motion/react";
import * as React from "react";

interface TocIndicatorProps {
  itemsLength: number;
  activeIndex: number;
  className?: string;
}

export function TocIndicator({ itemsLength, activeIndex, className }: TocIndicatorProps) {
  return (
    <div className={className}>
      <svg
        style={{
          height: `${itemsLength * 26.28 - 8}px`, // 18.28px (height) + 8px (gap) = 26.28px <--- dont change the pointer value
        }}
        className="w-full"
        overflow="visible"
      >
        <line
          className="dark:text-muted text-[#DFDFDF]"
          x1="50%"
          y1="0"
          x2="50%"
          y2="100%"
          stroke="currentColor"
          strokeWidth="1"
        />
        <ellipse className="dark:text-muted text-[#DFDFDF]" cx="50%" cy="98%" rx="2.5" ry="2.5" fill="currentColor" />
        {activeIndex >= 0 && (
          <>
            <motion.line
              key="line-1"
              className="text-primary"
              x1="50%"
              y1="0"
              x2="50%"
              stroke="currentColor"
              strokeWidth="1"
              initial={{
                y2: 0,
                opacity: 0,
              }}
              animate={{
                y2: 14 + activeIndex * 26.28,
                opacity: 1,
              }}
              transition={{
                type: "spring",
                stiffness: 180,
                damping: 20,
              }}
            />
            <motion.rect
              className="text-primary"
              key="rect-1"
              x="28%"
              width="6"
              height="6"
              rx="1"
              fill="currentColor"
              style={{
                rotate: 45,
                transformOrigin: "center",
                transformBox: "fill-box",
              }}
              initial={{
                y: 0,
                opacity: 0,
              }}
              animate={{
                y: 14 + activeIndex * 26.28,
                opacity: 1,
              }}
              transition={{
                type: "spring",
                stiffness: 180,
                damping: 20,
              }}
            />
          </>
        )}
      </svg>
    </div>
  );
}

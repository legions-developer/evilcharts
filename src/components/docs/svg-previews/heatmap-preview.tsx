import React from "react";

const COLUMNS = 26;
const ROWS = 7;
const CELL = 22;
const GAP = 6;
const PITCH = CELL + GAP;
const LEFT = 450 - (COLUMNS * PITCH - GAP) / 2;
const TOP = 240 - (ROWS * PITCH - GAP) / 2;

const LEVELS: number[] = Array.from({ length: COLUMNS * ROWS }, (_, i) => {
  const column = Math.floor(i / ROWS);
  const row = i % ROWS;
  const wave = Math.sin(column * 0.55 + row * 1.3) + Math.cos(column * 0.21 - row * 0.7);
  if (row === 0 || row === 6) return wave > 1.2 ? 1 : 0;
  if (wave > 1.5) return 4;
  if (wave > 0.9) return 3;
  if (wave > 0.2) return 2;
  if (wave > -0.6) return 1;
  return 0;
});

const LEVEL_OPACITY = [0.08, 0.2, 0.4, 0.7, 1];

export const HeatmapPreview = () => {
  return (
    <svg
      className="text-primary relative z-10 h-full w-full"
      viewBox="0 0 900 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {LEVELS.map((level, i) => {
        const column = Math.floor(i / ROWS);
        const row = i % ROWS;
        const accent = level === 4;
        return (
          <rect
            key={i}
            x={LEFT + column * PITCH}
            y={TOP + row * PITCH}
            width={CELL}
            height={CELL}
            rx="5"
            fill={accent ? "var(--color-vesper-type)" : "currentColor"}
            fillOpacity={accent ? 1 : LEVEL_OPACITY[level]}
          />
        );
      })}
    </svg>
  );
};

import React from "react";

export const LinePreview = () => {
  return (
    <svg
      className="text-primary relative z-10 h-full w-full"
      viewBox="0 0 900 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M182.5 405L287 266L503.5 337L614 229.5L720 266"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M181 338.5L287.5 381.5L400.5 132L503.5 264L612.5 132L718 64.5"
        stroke="var(--color-vesper-type)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="613"
        y1="48"
        x2="613"
        y2="346"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <circle
        className="text-background"
        cx="612.5"
        cy="130"
        r="13"
        fill="var(--color-vesper-type)"
        stroke="currentColor"
        strokeWidth="6"
      />
      <circle
        className="text-background"
        cx="612.5"
        cy="234"
        r="13"
        fill="var(--color-vesper-type)"
        stroke="currentColor"
        strokeWidth="6"
      />
    </svg>
  );
};

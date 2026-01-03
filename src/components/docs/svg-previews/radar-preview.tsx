import React from "react";

export const RadarPreview = () => {
  return (
    <svg
      className="text-primary relative z-10 h-full w-full"
      viewBox="0 0 900 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M449.5 54L611 147.25M449.5 54L288 147.25M449.5 54L449.5 240.5M611 147.25V333.75M611 147.25L449.5 240.5M611 333.75L449.5 427M611 333.75L449.5 240.5M449.5 427L288 333.75M449.5 427L449.5 240.5M288 333.75V147.25M288 333.75L449.5 240.5M288 147.25L449.5 240.5M449.5 193.875L489.875 217.188V263.813L449.5 287.125L409.125 263.813V217.188L449.5 193.875ZM449.5 147.25L530.25 193.875V287.125L449.5 333.75L368.75 287.125V193.875L449.5 147.25ZM449.5 100.625L570.625 170.563V310.437L449.5 380.375L328.375 310.437V170.563L449.5 100.625Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeDasharray="3 4"
        strokeOpacity="0.3"
      />
      <path
        d="M368.5 194.5L328.5 310L449.5 334L570 310L610 147H449.5L368.5 194.5Z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="5"
        strokeOpacity="0.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M365 195L449 381L528.5 286L571 171L449 102.5L365 195Z"
        fill="var(--color-vesper-type)"
        fillOpacity="0.2"
        stroke="var(--color-vesper-type)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        className="text-background"
        cx="449"
        cy="102"
        r="13"
        fill="var(--color-vesper-type)"
        stroke="currentColor"
        strokeWidth="6"
      />
      <circle
        className="text-background"
        cx="571"
        cy="171"
        r="13"
        fill="var(--color-vesper-type)"
        stroke="currentColor"
        strokeWidth="6"
      />
      <circle
        className="text-background"
        cx="365"
        cy="191"
        r="13"
        fill="var(--color-vesper-type)"
        stroke="currentColor"
        strokeWidth="6"
      />
      <circle
        className="text-background"
        cx="449"
        cy="381"
        r="13"
        fill="var(--color-vesper-type)"
        stroke="currentColor"
        strokeWidth="6"
      />
      <circle
        className="text-background"
        cx="529"
        cy="287"
        r="13"
        fill="var(--color-vesper-type)"
        stroke="currentColor"
        strokeWidth="6"
      />
    </svg>
  );
};

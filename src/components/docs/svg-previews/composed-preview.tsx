import React from "react";

export const ComposedPreview = () => {
  return (
    <svg
      className="text-primary relative z-10 h-full w-full"
      viewBox="0 0 900 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M227 236C227 230.477 231.477 226 237 226H297C302.523 226 307 230.477 307 236V414H227V236Z"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <path
        d="M342 288C342 282.477 346.477 278 352 278H412C417.523 278 422 282.477 422 288V414H342V288Z"
        fill="var(--color-vesper-type)"
        fillOpacity="0.5"
      />
      <path
        d="M457 135C457 129.477 461.477 125 467 125H527C532.523 125 537 129.477 537 135V414H457V135Z"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <path
        d="M572 335C572 329.477 576.477 325 582 325H642C647.523 325 652 329.477 652 335V414H572V335Z"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <line
        x1="125"
        y1="418"
        x2="769"
        y2="418"
        stroke="currentColor"
        strokeWidth="8"
        opacity="0.3"
      />
      <path
        d="M125.5 274L266 254.5L380.5 338L495.5 165.5L609 358.5L720 254.5"
        stroke="var(--color-vesper-type)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle
        className="text-background"
        cx="267"
        cy="256"
        r="13"
        fill="var(--color-vesper-type)"
        stroke="currentColor"
        strokeWidth="6"
      />
      <circle
        className="text-background"
        cx="382"
        cy="332"
        r="13"
        fill="var(--color-vesper-type)"
        stroke="currentColor"
        strokeWidth="6"
      />
      <circle
        className="text-background"
        cx="497"
        cy="165"
        r="13"
        fill="var(--color-vesper-type)"
        stroke="currentColor"
        strokeWidth="6"
      />
      <circle
        className="text-background"
        cx="609"
        cy="356"
        r="13"
        fill="var(--color-vesper-type)"
        stroke="currentColor"
        strokeWidth="6"
      />
    </svg>
  );
};

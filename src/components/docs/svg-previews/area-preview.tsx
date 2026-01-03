import React from "react";

export const AreaPreview = () => {
  return (
    <svg
      className="text-primary relative z-10 h-full w-full"
      viewBox="0 0 900 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M183.5 408.5L284.5 262.5L412 295.5L482.5 160L602.5 233L713 72"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M284.5 262.5L183.5 408.5L713 371V72L602.5 233L482.5 160L412 295.5L284.5 262.5Z"
        fill="url(#paint0_linear_36_989)"
      />
      <path
        d="M183 407L282 337.5L398 363.5L501.5 274L605.5 294L715 203"
        stroke="var(--color-vesper-type)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M282 337.5L183 407H715V203L605.5 294L501.5 274L398 363.5L282 337.5Z"
        fill="url(#paint1_linear_36_989)"
      />
      <circle
        className="text-background"
        cx="715"
        cy="72"
        r="13"
        fill="var(--color-vesper-type)"
        stroke="currentColor"
        strokeWidth="6"
      />
      <circle
        className="text-background"
        cx="715"
        cy="203"
        r="13"
        fill="var(--color-vesper-type)"
        stroke="currentColor"
        strokeWidth="6"
      />
      <defs>
        <linearGradient
          id="paint0_linear_36_989"
          x1="448"
          y1="35.5"
          x2="448.25"
          y2="408.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="currentColor" stopOpacity="0.1" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_36_989"
          x1="449"
          y1="55.5"
          x2="449"
          y2="407"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--color-vesper-type)" stopOpacity="0.5" />
          <stop offset="1" stopColor="var(--color-vesper-type)" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

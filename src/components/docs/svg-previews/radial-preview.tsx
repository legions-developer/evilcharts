import React from "react";

export const RadialPreview = () => {
  return (
    <svg
      className="text-primary relative z-10 h-full w-full"
      viewBox="0 0 900 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="450"
        cy="240"
        r="154.5"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="25"
      />
      <circle
        cx="450.5"
        cy="240.5"
        r="112"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="25"
      />
      <path
        d="M448.5 128.5C467.08 128.5 482.912 132.275 499.441 140.471C515.97 148.667 530.241 160.549 541.071 175.132C551.901 189.715 558.98 206.58 561.72 224.332C564.461 242.083 562.785 260.209 556.831 277.211C550.877 294.212 540.817 309.598 527.483 322.097C514.148 334.595 497.924 343.846 480.153 349.083C462.381 354.319 446.786 353.681 428.5 350.5C410.214 347.319 391.764 335.896 377 325"
        stroke="var(--color-vesper-type)"
        strokeWidth="25"
        strokeLinecap="round"
      />
      <circle
        cx="450.5"
        cy="240.5"
        r="62"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="25"
      />
      <path
        d="M391.346 261.97C388.58 251.645 387.799 243.027 388.883 231.859C390.935 221.465 394.663 211.357 401.081 203.187C407.5 195.017 415.734 188.595 425.101 184.453C434.469 180.311 444.254 178.119 454.503 178.919C464.752 179.718 475.171 183.486 484.039 189.052C492.907 194.617 498.61 200.515 504.14 209.618C509.67 218.72 512.57 229.488 512.043 246.84C510.483 262.27 507.715 263.529 501.256 276.13"
        stroke="var(--color-vesper-type)"
        strokeWidth="24"
        strokeLinecap="round"
      />
    </svg>
  );
};

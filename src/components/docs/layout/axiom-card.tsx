import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const AXIOM_PARTNER_URL = "https://partners.axiom.co/gurbinder";

export function AxiomCard({ className }: { className?: string }) {
  return (
    <div className="pl-5">
      <a
        href={AXIOM_PARTNER_URL}
        target="_blank"
        rel="sponsored noopener"
        className={cn(
          "group focus-visible:ring-ring/50 relative flex h-36 flex-col justify-between overflow-hidden rounded-xl border border-white/4 bg-[#0c0c0c] transition-colors duration-200 outline-none hover:border-white/10 focus-visible:ring-[3px] dark:bg-transparent",
          className,
        )}
      >
        <AxiomFlares className="absolute inset-0 size-full" />
        <div className="relative flex items-start justify-between p-3">
          <AxiomWordmark className="h-3 w-auto text-white" />
          <ArrowUpRight
            aria-hidden="true"
            className="-mt-0.5 -mr-0.5 size-3.5 text-white/50 transition-[color,translate] duration-200 group-hover:translate-x-px group-hover:-translate-y-px group-hover:text-white"
          />
        </div>
        <p className="relative bg-linear-to-t from-[#0c0c0c] via-[#0c0c0c]/80 to-transparent px-3 pt-6 pb-3 text-[13px] leading-[1.45] font-medium text-pretty text-white">
          Petabyte-scale schema-less ingest on a fully managed event store with 95%+ compression
        </p>
      </a>
    </div>
  );
}

function AxiomWordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 61 11"
      fill="currentColor"
      role="img"
      aria-label="Axiom"
      className={className}
    >
      <path d="M22 7.84h-3.17l-.4 1.17a.5.5 0 0 1-.47.34h-1.72c-.2 0-.3-.15-.23-.34l3.11-7.86c.08-.19.3-.34.5-.34h1.6c.2 0 .43.15.5.34l3.1 7.86c.07.19-.03.34-.23.34h-1.72a.5.5 0 0 1-.47-.34zm-.56-1.68-1.02-3.1-1.03 3.1z" />
      <path d="M32.13 9.35a.7.7 0 0 1-.55-.3l-1.46-2.43-1.47 2.42a.7.7 0 0 1-.55.31H26c-.2 0-.26-.13-.15-.3l2.82-4.09-2.57-3.85c-.11-.16-.04-.3.16-.3h1.93c.2 0 .45.14.55.31l1.38 2.21 1.35-2.2c.1-.18.36-.32.56-.32h1.94c.2 0 .27.14.16.3l-2.59 3.84 2.84 4.1c.11.17.04.3-.16.3z" />
      <path d="M38.09 8.99c0 .2-.17.36-.37.36h-1.54a.36.36 0 0 1-.36-.36V1.17c0-.2.16-.36.36-.36h1.54c.2 0 .37.16.37.36z" />
      <path d="M39.45 5.05c0-2.48 1.87-4.48 4.74-4.48s4.74 2 4.74 4.48c0 2.5-1.87 4.5-4.74 4.5s-4.74-2-4.74-4.5m7.16 0c0-1.29-.91-2.46-2.42-2.46s-2.42 1.17-2.42 2.46c0 1.3.93 2.5 2.42 2.5 1.5 0 2.42-1.2 2.42-2.5" />
      <path d="M58.61 9.35A.4.4 0 0 1 58.2 9l-.6-4.58-1.7 4.6a.6.6 0 0 1-.5.34h-.75a.6.6 0 0 1-.5-.34l-1.7-4.64-.6 4.62a.4.4 0 0 1-.41.36h-1.45a.3.3 0 0 1-.31-.36l1.07-7.82c.03-.2.21-.36.41-.36h1.35c.2 0 .42.15.49.34l2.02 5.32 2.03-5.32c.07-.19.3-.34.5-.34h1.33c.2 0 .39.16.42.36L60.37 9a.3.3 0 0 1-.31.36z" />
      <path d="m12.12 7.27-2.48-4.3a.8.8 0 0 0-.62-.37H7.48c-.36 0-.5-.25-.33-.56L8 .57A.38.38 0 0 0 7.67 0H5.52a.8.8 0 0 0-.62.36L.7 7.6a.8.8 0 0 0 0 .72l1.08 1.86c.18.31.47.32.65 0l.84-1.44c.18-.31.48-.31.66 0l.76 1.32c.11.2.4.36.62.36h4.98a.8.8 0 0 0 .62-.36l1.2-2.07a.8.8 0 0 0 0-.72m-3.34-.2c.18.3.03.56-.33.56H4.58c-.36 0-.5-.26-.33-.57L6.2 3.71c.18-.31.47-.31.65 0z" />
    </svg>
  );
}

// Axiom's homepage hero flares, cropped around the hotspot to fill the card. The card
// is always dark, so the hero's theme-aware grays are baked in as their dark values.
// Hover effects key off the card's `group`: a bloom fades in and a shine sweeps the hero line.
function AxiomFlares({ className }: { className?: string }) {
  return (
    <svg
      viewBox="160 268 400 225"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
      className={cn("pointer-events-none", className)}
    >
      <defs>
        <radialGradient
          id="axiom-flare-fade"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(400 358) scale(300)"
        >
          <stop offset="0.35" stopColor="white" />
          <stop offset="1" stopColor="black" />
        </radialGradient>
        <mask id="axiom-flare-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="853" height="670">
          <rect width="853" height="670" fill="url(#axiom-flare-fade)" />
        </mask>
        <filter
          id="axiom-flare-blur-line"
          x="96"
          y="86"
          width="575"
          height="575"
          filterUnits="userSpaceOnUse"
        >
          <feGaussianBlur stdDeviation="6.45" />
        </filter>
        <filter
          id="axiom-flare-blur-sm"
          x="330"
          y="280"
          width="150"
          height="150"
          filterUnits="userSpaceOnUse"
        >
          <feGaussianBlur stdDeviation="2.55" />
        </filter>
        <filter
          id="axiom-flare-blur-md"
          x="330"
          y="280"
          width="150"
          height="150"
          filterUnits="userSpaceOnUse"
        >
          <feGaussianBlur stdDeviation="6.25" />
        </filter>
        <filter
          id="axiom-flare-blur-lg"
          x="250"
          y="208"
          width="300"
          height="300"
          filterUnits="userSpaceOnUse"
        >
          <feGaussianBlur stdDeviation="16.45" />
        </filter>
        <filter
          id="axiom-flare-blur-core"
          x="360"
          y="318"
          width="80"
          height="80"
          filterUnits="userSpaceOnUse"
        >
          <feGaussianBlur stdDeviation="11" />
        </filter>
        <filter
          id="axiom-flare-blur-shine"
          x="0"
          y="0"
          width="853"
          height="853"
          filterUnits="userSpaceOnUse"
        >
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
        <linearGradient
          id="axiom-flare-hero-glow"
          x1="110.4"
          y1="648.4"
          x2="658.4"
          y2="100.4"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.08" stopColor="#3B1700" />
          <stop offset="0.32" stopColor="#E66C00" />
          <stop offset="0.5" stopColor="#FFD632" />
          <stop offset="0.69" stopColor="#E66C00" />
          <stop offset="0.92" stopColor="#3B1700" />
        </linearGradient>
        <linearGradient
          id="axiom-flare-hero"
          x1="110.4"
          y1="648.4"
          x2="658.4"
          y2="100.4"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.08" stopColor="#090909" />
          <stop offset="0.3" stopColor="#FF7C19" />
          <stop offset="0.44" stopColor="#ED5903" />
          <stop offset="0.53" stopColor="white" />
          <stop offset="0.63" stopColor="#ED5903" />
          <stop offset="0.75" stopColor="#FF7C19" />
          <stop offset="0.93" stopColor="#3B1700" />
        </linearGradient>
        <linearGradient
          id="axiom-flare-ember"
          gradientUnits="objectBoundingBox"
          x1="0"
          y1="1"
          x2="1"
          y2="0"
        >
          <stop stopColor="#361601" />
          <stop offset="0.25" stopColor="#C65701" />
          <stop offset="0.5" stopColor="#FA8801" />
          <stop offset="0.75" stopColor="#C65701" />
          <stop offset="1" stopColor="#361601" />
        </linearGradient>
        <linearGradient
          id="axiom-flare-ember-deep"
          gradientUnits="objectBoundingBox"
          x1="0"
          y1="1"
          x2="1"
          y2="0"
        >
          <stop stopColor="#090909" />
          <stop offset="0.25" stopColor="#C63601" />
          <stop offset="0.5" stopColor="#FA7501" />
          <stop offset="0.75" stopColor="#C63601" />
          <stop offset="1" stopColor="#090909" />
        </linearGradient>
        {GRAY_LINES.map(({ id, peak }) => (
          <linearGradient
            key={id}
            id={id}
            gradientUnits="objectBoundingBox"
            x1="0"
            y1="1"
            x2="1"
            y2="0"
          >
            <stop stopColor="#111111" stopOpacity="0" />
            <stop offset="0.5" stopColor={peak} />
            <stop offset="1" stopColor="#111111" stopOpacity="0" />
          </linearGradient>
        ))}
        <radialGradient
          id="axiom-flare-streak"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(405.8 352.8) scale(75.7 8.9)"
        >
          <stop stopColor="white" />
          <stop offset="0.25" stopColor="#DB5802" />
          <stop offset="0.5" stopColor="#813101" />
          <stop offset="0.75" stopColor="#572100" />
          <stop offset="1" stopColor="#311200" />
        </radialGradient>
        <radialGradient
          id="axiom-flare-bloom"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(397.3 360.3) rotate(90) scale(23.7 48.8)"
        >
          <stop stopColor="#FE8808" />
          <stop offset="0.5" stopColor="#D75700" />
          <stop offset="1" stopColor="#401500" />
        </radialGradient>
        <linearGradient
          id="axiom-flare-shine"
          x1="40"
          y1="717.4"
          x2="120"
          y2="637.4"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="0.5" stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g mask="url(#axiom-flare-mask)">
        <line
          x1="109.7"
          y1="647.7"
          x2="657.7"
          y2="99.7"
          stroke="url(#axiom-flare-hero-glow)"
          filter="url(#axiom-flare-blur-line)"
        />
        <ellipse
          cx="405.8"
          cy="352.8"
          rx="75.7"
          ry="8.9"
          transform="rotate(-45 405.8 352.8)"
          fill="url(#axiom-flare-streak)"
          filter="url(#axiom-flare-blur-md)"
          opacity="0.3"
        />
        <line
          x1="109.7"
          y1="647.7"
          x2="657.7"
          y2="99.7"
          stroke="url(#axiom-flare-hero)"
          strokeWidth="1.25"
        />
        <line
          x1="276.5"
          y1="555.5"
          x2="659.5"
          y2="172.5"
          stroke="url(#axiom-flare-ember)"
          opacity="0.62"
        />
        <line
          x1="273.5"
          y1="394.5"
          x2="667.5"
          y2="0.5"
          stroke="url(#axiom-flare-ember-deep)"
          opacity="0.7"
        />
        <line
          x1="0.5"
          y1="579.5"
          x2="498.5"
          y2="81.5"
          stroke="url(#axiom-flare-ember)"
          opacity="0.47"
        />
        <line
          x1="307.7"
          y1="756.7"
          x2="690.7"
          y2="373.7"
          stroke="url(#axiom-flare-ember)"
          opacity="0.53"
        />
        <line
          x1="468.7"
          y1="521.7"
          x2="851.7"
          y2="138.7"
          stroke="url(#axiom-flare-ember)"
          opacity="0.38"
        />
        <line
          x1="428.7"
          y1="433.7"
          x2="616.7"
          y2="245.7"
          stroke="url(#axiom-flare-ember)"
          opacity="0.25"
        />
        {GRAY_LINES.map(({ id, x1, y1, x2, y2, opacity }) => (
          <line key={id} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`url(#${id})`} opacity={opacity} />
        ))}
        <g className="opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <ellipse
            cx="400"
            cy="358"
            rx="90"
            ry="30"
            transform="rotate(-45 400 358)"
            fill="url(#axiom-flare-bloom)"
            filter="url(#axiom-flare-blur-lg)"
            opacity="0.35"
          />
        </g>
        <g>
          <ellipse
            cx="397.3"
            cy="360.3"
            rx="48.8"
            ry="23.7"
            transform="rotate(-45 397.3 360.3)"
            fill="url(#axiom-flare-bloom)"
            filter="url(#axiom-flare-blur-lg)"
            opacity="0.31"
          />
          <ellipse
            cx="399.8"
            cy="357.9"
            rx="8.4"
            ry="4.1"
            transform="rotate(-45 399.8 357.9)"
            fill="#E61616"
            filter="url(#axiom-flare-blur-core)"
          />
          <ellipse
            cx="400.2"
            cy="357.5"
            rx="31.8"
            ry="4.1"
            transform="rotate(-45 400.2 357.5)"
            fill="white"
            filter="url(#axiom-flare-blur-sm)"
            opacity="0.14"
          />
        </g>
        <g className="motion-safe:group-hover:animate-flare-shine opacity-0">
          <line
            x1="40"
            y1="717.4"
            x2="120"
            y2="637.4"
            stroke="url(#axiom-flare-shine)"
            strokeWidth="4"
            filter="url(#axiom-flare-blur-shine)"
            opacity="0.6"
          />
          <line
            x1="40"
            y1="717.4"
            x2="120"
            y2="637.4"
            stroke="url(#axiom-flare-shine)"
            strokeWidth="1.25"
          />
        </g>
      </g>
    </svg>
  );
}

const GRAY_LINES = [
  {
    id: "axiom-flare-gray-a",
    peak: "#313131",
    x1: 276.7,
    y1: 647.7,
    x2: 659.7,
    y2: 264.7,
    opacity: 0.35,
  },
  {
    id: "axiom-flare-gray-b",
    peak: "#606060",
    x1: 140.7,
    y1: 352.7,
    x2: 490.7,
    y2: 2.7,
    opacity: 0.16,
  },
  {
    id: "axiom-flare-gray-c",
    peak: "#7b7b7b",
    x1: 480.7,
    y1: 644.7,
    x2: 668.7,
    y2: 456.7,
    opacity: 0.33,
  },
  {
    id: "axiom-flare-gray-d",
    peak: "#606060",
    x1: 331.7,
    y1: 693.7,
    x2: 714.7,
    y2: 310.7,
    opacity: 0.14,
  },
];

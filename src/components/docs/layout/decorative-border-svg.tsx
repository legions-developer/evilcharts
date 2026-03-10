const DecorativeBorder = () => {
  return (
    <svg
      className="pointer-events-none absolute top-0 right-0 z-10 h-[44px] w-[310px] overflow-visible sm:top-[8.5px] sm:right-[8.5px]"
      viewBox="0 0 400 44"
      preserveAspectRatio="none"
      fill="none"
    >
      {/* Top path to mask to mask border*/}
      <path
        d="M 400 0 L 1.5 0"
        stroke="var(--sidebar)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        fill="var(--sidebar)"
      />
      {/* right path to mask border */}
      <path
        d="M 400 0 L 400 53"
        stroke="var(--sidebar)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        fill="var(--sidebar)"
      />
      {/* main path with fill */}
      <path
        className="text-[#E5E5E5] dark:text-[#1B1B1B]"
        d="M 0 0 q 10 0 20 10 l 24 24 q 10 10 20 10 L 390 44 q 10 0 10 10 l 0 -54 Z"
        fill="var(--sidebar)"
      />
      {/* main path with border */}
      <path
        className="text-[#E5E5E5] dark:text-[#1B1B1B]"
        d="M 0 0 q 10 0 20 10 l 24 24 q 10 10 20 10 L 390 44 q 10 0 10 10 v 10 "
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        fill="none"
      />
    </svg>
  );
};

export default DecorativeBorder;

// Per-render SVG `<defs>` ID namespace. Every generated chart gets a fresh
// prefix so its definition IDs — gradients, clip-paths, background masks — and
// the matching `url(#…)` references never collide with another generated SVG
// inlined on the same page (e.g. two "Copy SVG" charts in one README).

/** The `<defs>` IDs a single chart render needs, all sharing one prefix. */
export interface SvgIds {
  /** Per-series fill def — referenced by area, bar, slice and ring fills. */
  grad: (index: number) => string;
  /** Plot-area clip-path (line and bar charts). */
  plotClip: string;
  /** Background-pattern tile. */
  bgPattern: string;
  /** Soft edge-fade mask over the background pattern. */
  bgMask: string;
  /** Gaussian-blur filter feeding the background mask. */
  bgBlur: string;
}

// A process-local counter guarantees uniqueness within one runtime; the random
// salt guards against collisions across separately-generated SVGs (different
// requests or server instances) that end up on the same consumer page.
let counter = 0;

/** Build a fresh, collision-free `<defs>` ID namespace for one chart render. */
export function createSvgIds(): SvgIds {
  const salt = Math.random().toString(36).slice(2).padEnd(6, "0").slice(0, 6);
  const ns = `sh-${(counter++).toString(36)}-${salt}`;
  return {
    grad: (index) => `${ns}-grad-${index}`,
    plotClip: `${ns}-plot-clip`,
    bgPattern: `${ns}-bg-pattern`,
    bgMask: `${ns}-bg-mask`,
    bgBlur: `${ns}-bg-blur`,
  };
}

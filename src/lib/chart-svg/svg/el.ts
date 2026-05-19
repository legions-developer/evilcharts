// A tiny element builder so the SVG code reads like declarative templates
// instead of hand-spliced template literals.

import { escapeXml } from "./escape";

type AttrValue = string | number | boolean | undefined | null;

export type Attrs = Record<string, AttrValue>;

/** Numbers are rounded to 2 decimals; strings are XML-escaped. */
function formatAttr(value: string | number): string {
  if (typeof value === "number") return String(Math.round(value * 100) / 100);
  return escapeXml(value);
}

/** Serialize an attribute map. `undefined` / `null` / `false` entries are dropped. */
function serializeAttrs(attrs: Attrs): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    parts.push(value === true ? key : `${key}="${formatAttr(value)}"`);
  }
  return parts.length ? ` ${parts.join(" ")}` : "";
}

/**
 * Build an SVG element string. With `children` it renders an open/close pair,
 * otherwise a self-closing tag.
 *
 * `children` must already be valid markup — escape raw text with `escapeXml`,
 * or use `text()` which does it for you.
 */
export function el(tag: string, attrs: Attrs = {}, children?: string): string {
  const open = `<${tag}${serializeAttrs(attrs)}`;
  return children === undefined ? `${open}/>` : `${open}>${children}</${tag}>`;
}

/** A `<text>` element with auto-escaped text content. */
export function text(content: string, attrs: Attrs = {}): string {
  return el("text", attrs, escapeXml(content));
}

/** One SMIL keyframe: animate `attr` from→to over `dur`, holding the end value. */
export interface AnimateSpec {
  /** Animated attribute, e.g. "opacity" or "stroke-dashoffset". */
  attr: string;
  from: number | string;
  to: number | string;
  /** Duration and start offset, both in seconds. */
  dur: number;
  begin: number;
  /** Optional cubic-bézier control points for spline easing. */
  easing?: readonly [number, number, number, number];
  /**
   * When > 0, the animation repeats forever on a cycle of this many seconds:
   * it holds at `from` until `begin`, reveals `from`→`to` over `dur`, then
   * holds at `to` for the rest of the cycle before looping. 0 runs it once.
   */
  loopInterval?: number;
}

/** Identity cubic-bézier — a linear segment, used for the loop hold phases. */
const LINEAR_SPLINE = "0 0 1 1";

const fmt3 = (n: number): string => String(Math.round(n * 1000) / 1000);

/**
 * A self-contained looping `<animate>`: one cycle of length `loopInterval`,
 * `repeatCount="indefinite"`. The reveal is expressed as `values`/`keyTimes`
 * (hold → draw → hold) so every element loops on its own with no syncbase or
 * timer element — robust even when the SVG is injected via innerHTML.
 */
function loopingAnimate({
  attr,
  from,
  to,
  dur,
  begin,
  easing,
  loopInterval,
}: Required<Omit<AnimateSpec, "easing">> & Pick<AnimateSpec, "easing">): string {
  const cycle = loopInterval;
  // Reveal window as fractions of the cycle; clamped so keyTimes stay valid
  // even when the cycle is shorter than the staggered draw-on.
  const k0 = Math.min(Math.max(begin / cycle, 0.001), 0.98);
  const k1 = (begin + dur) / cycle;
  const fits = k1 < 0.999;
  const kEnd = Math.min(Math.max(k1, k0 + 0.001), 0.999);

  // 4 keyframes when the draw finishes inside the cycle (hold-draw-hold),
  // 3 when it doesn't (hold-draw, looping straight from the end of the draw).
  const keyTimes = fits ? `0;${fmt3(k0)};${fmt3(kEnd)};1` : `0;${fmt3(k0)};${fmt3(kEnd)}`;
  const values = fits ? `${from};${from};${to};${to}` : `${from};${from};${to}`;
  const keySplines = easing
    ? fits
      ? `${LINEAR_SPLINE};${easing.join(" ")};${LINEAR_SPLINE}`
      : `${LINEAR_SPLINE};${easing.join(" ")}`
    : undefined;

  return el("animate", {
    attributeName: attr,
    dur: `${cycle}s`,
    repeatCount: "indefinite",
    values,
    keyTimes,
    calcMode: easing ? "spline" : undefined,
    keySplines,
  });
}

/** Build an `<animate>` tag — the SMIL that drives the draw-on animation. */
export function animate(spec: AnimateSpec): string {
  const { attr, from, to, dur, begin, easing, loopInterval } = spec;

  if (loopInterval && loopInterval > 0) {
    return loopingAnimate({ attr, from, to, dur, begin, easing, loopInterval });
  }

  return el("animate", {
    attributeName: attr,
    from,
    to,
    dur: `${dur}s`,
    begin: `${begin}s`,
    fill: "freeze",
    calcMode: easing ? "spline" : undefined,
    keyTimes: easing ? "0;1" : undefined,
    keySplines: easing ? easing.join(" ") : undefined,
  });
}

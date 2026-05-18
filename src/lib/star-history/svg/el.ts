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
}

/** Build an `<animate>` tag — the SMIL that drives the draw-on animation. */
export function animate({ attr, from, to, dur, begin, easing }: AnimateSpec): string {
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

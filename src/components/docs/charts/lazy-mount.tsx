"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface LazyMountProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /**
   * Distance from the viewport at which the children start mounting.
   * Same syntax as IntersectionObserver `rootMargin`. Defaults to a generous
   * 300px so charts are ready by the time the user scrolls to them.
   */
  rootMargin?: string;
  className?: string;
}

/**
 * Defers rendering of `children` until the wrapper element is near the viewport.
 *
 * Used to avoid mounting many heavy chart components (Recharts + ResizeObserver
 * + large SVG trees) on the same page at once, which caused noticeable jank on
 * the docs pages where 10–20+ chart previews can live next to each other.
 *
 * SSR safety: starts as not-visible on both server and client, so hydration
 * matches and the chart subtree never runs on the server.
 */
export function LazyMount({
  children,
  fallback = null,
  rootMargin = "300px 0px",
  className,
}: LazyMountProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (isVisible) return;

    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return (
    <div ref={ref} className={cn("size-full", className)}>
      {isVisible ? <React.Suspense fallback={fallback}>{children}</React.Suspense> : fallback}
    </div>
  );
}

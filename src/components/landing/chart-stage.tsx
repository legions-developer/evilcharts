"use client";

import {
  LandingBumpLineChart,
  LandingCircleRadarChart,
  LandingComposedChart,
  LandingDashedLineChart,
  LandingDonutPieChart,
  LandingDottedAreaChart,
  LandingDuotoneBarChart,
  LandingExpandedAreaChart,
  LandingGlowingLineChart,
  LandingGradientAreaChart,
  LandingGradientBarChart,
  LandingHatchedAreaChart,
  LandingHatchedBarChart,
  LandingHorizontalBarChart,
  LandingLinesAreaChart,
  LandingLinesRadarChart,
  LandingPaddedPieChart,
  LandingRadarChart,
  LandingSemiRadialChart,
  LandingStackedBarChart,
  LandingStepLineChart,
  LandingStrippedBarChart,
} from "./landing-chart-cards";
import { EChartsReliabilityScorePieChart } from "@/registry/blocks/echarts/b-reliability-score-echarts-pie-chart";
import { EChartsProgressRingsPieChart } from "@/registry/blocks/echarts/b-progress-rings-echarts-pie-chart";
import { EChartsCacheTiersRadialChart } from "@/registry/blocks/echarts/b-cache-tiers-echarts-radial-chart";
import { EChartsAllocationSankeyChart } from "@/registry/blocks/echarts/b-allocation-echarts-sankey-chart";
import { EChartsMarketSharePieChart } from "@/registry/blocks/echarts/b-market-share-echarts-pie-chart";
import { EChartsPipelineSankeyChart } from "@/registry/blocks/echarts/b-pipeline-echarts-sankey-chart";
import { EChartsRevenueMixPieChart } from "@/registry/blocks/echarts/b-revenue-mix-echarts-pie-chart";
import { EChartsShipmentsLineChart } from "@/registry/blocks/echarts/b-shipments-echarts-line-chart";
import { EChartsPortfolioAreaChart } from "@/registry/blocks/echarts/b-portfolio-echarts-area-chart";
import { EChartsBenchmarkAreaChart } from "@/registry/blocks/echarts/b-benchmark-echarts-area-chart";
import { EChartsMonospaceBarChart } from "@/registry/blocks/echarts/b-monospace-echarts-bar-chart";
import { EChartsBudgetRadialChart } from "@/registry/blocks/echarts/b-budget-echarts-radial-chart";
import { EChartsAudienceAreaChart } from "@/registry/blocks/echarts/b-audience-echarts-area-chart";
import { EChartsPayoutsLineChart } from "@/registry/blocks/echarts/b-payouts-echarts-line-chart";
import { EChartsLatencyAreaChart } from "@/registry/blocks/echarts/b-latency-echarts-area-chart";
import { EChartsRideRadialChart } from "@/registry/blocks/echarts/b-ride-echarts-radial-chart";
import { EChartsPeakBarChart } from "@/registry/blocks/echarts/b-peak-echarts-bar-chart";
import { EChartsGridBarChart } from "@/registry/blocks/echarts/b-grid-echarts-bar-chart";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { animate, cubicBezier, motion, useReducedMotion } from "motion/react";
import { getIconForLanguageExtension } from "@/assets/language/icons";
import { cn } from "@/lib/utils";

const CANVAS_W = 3480;
const CANVAS_H = 2520;

// Every card keeps a fixed slot on the canvas — only the "camera" (the canvas
// transform) ever moves, so focus changes read as pans, not reshuffles.
type StageCard = {
  id: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  node: ReactNode;
};

const CARDS: StageCard[] = [
  // prettier-ignore
  ...[
    { id: "line", title: "payouts-line-chart", x: 60, y: -40, w: 510, h: 320, node: <EChartsPayoutsLineChart /> },
    { id: "radar", title: "radar-chart", x: 60, y: 320, w: 470, h: 290, node: <LandingRadarChart /> },
    { id: "duotone-bar", title: "duotone-bar-chart", x: 60, y: 650, w: 470, h: 290, node: <LandingDuotoneBarChart /> },
    { id: "gradient-bar", title: "gradient-bar-chart", x: 60, y: 980, w: 470, h: 290, node: <LandingGradientBarChart /> },
    { id: "market-share-pie", title: "market-share-pie-chart", x: 60, y: 1310, w: 510, h: 320, node: <EChartsMarketSharePieChart /> },
    { id: "hatched-area", title: "hatched-area-chart", x: 60, y: 1670, w: 470, h: 290, node: <LandingHatchedAreaChart /> },
    { id: "stacked-bar", title: "stacked-bar-chart", x: 60, y: 2000, w: 480, h: 300, node: <LandingStackedBarChart /> },

    { id: "area", title: "portfolio-area-chart", x: 615, y: 40, w: 510, h: 320, node: <EChartsPortfolioAreaChart /> },
    { id: "bar", title: "peak-bar-chart", x: 615, y: 400, w: 480, h: 300, node: <EChartsPeakBarChart /> },
    { id: "composed", title: "composed-chart", x: 615, y: 740, w: 480, h: 300, node: <LandingComposedChart /> },
    { id: "glowing-line", title: "glowing-line-chart", x: 615, y: 1080, w: 470, h: 290, node: <LandingGlowingLineChart /> },
    { id: "cache-tiers-radial", title: "cache-tiers-radial-chart", x: 615, y: 1410, w: 510, h: 320, node: <EChartsCacheTiersRadialChart /> },
    { id: "dotted-area", title: "dotted-area-chart", x: 615, y: 1770, w: 470, h: 290, node: <LandingDottedAreaChart /> },
    { id: "bump-line", title: "bump-line-chart", x: 615, y: 2100, w: 470, h: 290, node: <LandingBumpLineChart /> },

    { id: "pie", title: "revenue-mix-pie-chart", x: 1170, y: 200, w: 510, h: 320, node: <EChartsRevenueMixPieChart /> },
    { id: "radial", title: "budget-radial-chart", x: 1170, y: 560, w: 520, h: 330, node: <EChartsBudgetRadialChart /> },
    { id: "hatched-bar", title: "hatched-bar-chart", x: 1170, y: 930, w: 480, h: 300, node: <LandingHatchedBarChart /> },
    { id: "donut", title: "donut-pie-chart", x: 1170, y: 1270, w: 470, h: 300, node: <LandingDonutPieChart /> },
    { id: "shipments-line", title: "shipments-line-chart", x: 1170, y: 1610, w: 510, h: 320, node: <EChartsShipmentsLineChart /> },
    { id: "circle-radar", title: "circle-radar-chart", x: 1170, y: 1970, w: 470, h: 290, node: <LandingCircleRadarChart /> },

    { id: "gradient-area", title: "gradient-area-chart", x: 1735, y: 40, w: 480, h: 300, node: <LandingGradientAreaChart /> },
    { id: "semi-radial", title: "semi-radial-chart", x: 1735, y: 380, w: 480, h: 300, node: <LandingSemiRadialChart /> },
    { id: "sankey", title: "pipeline-sankey-chart", x: 1735, y: 720, w: 520, h: 330, node: <EChartsPipelineSankeyChart /> },
    { id: "dashed-line", title: "dashed-line-chart", x: 1735, y: 1090, w: 470, h: 290, node: <LandingDashedLineChart /> },
    { id: "monospace-bar", title: "monospace-bar-chart", x: 1735, y: 1420, w: 510, h: 320, node: <EChartsMonospaceBarChart /> },
    { id: "progress-rings-pie", title: "progress-rings-pie-chart", x: 1735, y: 1780, w: 510, h: 320, node: <EChartsProgressRingsPieChart /> },
    { id: "lines-area", title: "lines-area-chart", x: 1735, y: 2140, w: 470, h: 290, node: <LandingLinesAreaChart /> },

    { id: "latency-area", title: "latency-area-chart", x: 2300, y: 60, w: 510, h: 320, node: <EChartsLatencyAreaChart /> },
    { id: "allocation-sankey", title: "allocation-sankey-chart", x: 2300, y: 420, w: 520, h: 330, node: <EChartsAllocationSankeyChart /> },
    { id: "grid-bar", title: "grid-bar-chart", x: 2300, y: 790, w: 480, h: 300, node: <EChartsGridBarChart /> },
    { id: "reliability-pie", title: "reliability-pie-chart", x: 2300, y: 1130, w: 500, h: 320, node: <EChartsReliabilityScorePieChart /> },
    { id: "stripped-bar", title: "stripped-bar-chart", x: 2300, y: 1490, w: 470, h: 290, node: <LandingStrippedBarChart /> },
    { id: "horizontal-bar", title: "horizontal-bar-chart", x: 2300, y: 1820, w: 480, h: 300, node: <LandingHorizontalBarChart /> },
    { id: "lines-radar", title: "lines-radar-chart", x: 2300, y: 2160, w: 470, h: 290, node: <LandingLinesRadarChart /> },

    { id: "audience-area", title: "audience-area-chart", x: 2865, y: 40, w: 510, h: 320, node: <EChartsAudienceAreaChart /> },
    { id: "ride-radial", title: "ride-radial-chart", x: 2865, y: 400, w: 520, h: 330, node: <EChartsRideRadialChart /> },
    { id: "benchmark-area", title: "benchmark-area-chart", x: 2865, y: 770, w: 510, h: 320, node: <EChartsBenchmarkAreaChart /> },
    { id: "step-line", title: "step-line-chart", x: 2865, y: 1130, w: 470, h: 290, node: <LandingStepLineChart /> },
    { id: "expanded-area", title: "expanded-area-chart", x: 2865, y: 1460, w: 480, h: 300, node: <LandingExpandedAreaChart /> },
    { id: "padded-pie", title: "padded-pie-chart", x: 2865, y: 1800, w: 470, h: 300, node: <LandingPaddedPieChart /> },
  ],
];

const FOCUS_INTERVAL_MS = 4600;
const START_INDEX = CARDS.findIndex((card) => card.id === "hatched-bar");
// Never hop to a card bordering the current one — a focus change should be a
// real flight (roughly two column/row pitches away or more).
const MIN_HOP_DISTANCE = 1100;

const hopDistance = (a: number, b: number) => {
  const ca = CARDS[a];
  const cb = CARDS[b];
  return Math.hypot(ca.x + ca.w / 2 - cb.x - cb.w / 2, ca.y + ca.h / 2 - cb.y - cb.h / 2);
};

const clamp = (min: number, value: number, max: number) => Math.min(max, Math.max(min, value));

// ── Camera model ─────────────────────────────────────────────────────────────
// The camera is (lookAt, zoom): the canvas point under the viewport center and
// the scale it renders at. Every frame derives the css transform from those
// two, so the look-at point travels a mathematically straight line while the
// zoom breathes — animating translate and scale as separate channels instead
// made the view veer sideways whenever the zoom dipped.
//
// GTA-character-switch profile: the look-at glides on one S-curve (slow, fast
// middle, slow) while the zoom follows a sin² bell — zero velocity at both
// ends, deepest exactly mid-flight.
const flightPanEase = cubicBezier(0.65, 0, 0.35, 1);
const flightDurationFor = (distance: number) => clamp(1.35, 0.95 + distance / 1050, 2.7);
const flightZoomOutFor = (distance: number) => clamp(0.68, 0.86 - distance * 0.00006, 0.86);

function shuffled(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function CardShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="dark:bg-primary-foreground flex h-full w-full flex-col rounded-[8px] bg-[#F5F5F5] p-1">
      <div className="flex h-7 shrink-0 items-center px-2">
        <span className="text-muted-foreground dark:text-muted-foreground/80 flex items-center gap-1.5 font-mono text-xs [&_svg]:size-3.5">
          {getIconForLanguageExtension("component")}
          <span className="line-clamp-1">{title}</span>
        </span>
      </div>
      <div className="bg-background min-h-0 flex-1 overflow-hidden rounded-[5px] border">
        {children}
      </div>
    </div>
  );
}

export function ChartStage({ className }: { className?: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [active, setActive] = useState(START_INDEX);
  const [prevActive, setPrevActive] = useState(START_INDEX);
  const [hovered, setHovered] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  // False until the first focus change: the camera must render already settled
  // on page load — any mount-time tween reads as the camera lurching into place.
  const [engaged, setEngaged] = useState(false);
  const queueRef = useRef<number[]>([]);
  const lastPickRef = useRef(START_INDEX);
  const shownRef = useRef(START_INDEX);
  const flightRef = useRef<ReturnType<typeof animate> | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setViewport({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion || paused) return;
    const timer = setInterval(() => {
      if (queueRef.current.length === 0) {
        queueRef.current = shuffled(CARDS.length);
      }
      const current = lastPickRef.current;
      // First queued card that is far enough away; when the cycle's tail only
      // holds nearby cards, take the farthest of them instead of stalling.
      let pickAt = queueRef.current.findIndex((i) => hopDistance(i, current) >= MIN_HOP_DISTANCE);
      if (pickAt === -1) {
        pickAt = queueRef.current.reduce(
          (best, i, k, queue) =>
            hopDistance(i, current) > hopDistance(queue[best], current) ? k : best,
          0,
        );
      }
      const next = queueRef.current.splice(pickAt, 1)[0];
      setPrevActive(current);
      lastPickRef.current = next;
      setEngaged(true);
      setActive(next);
    }, FOCUS_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [reducedMotion, paused]);

  const measured = viewport.w > 0 && viewport.h > 0;
  const scale = measured ? clamp(0.5, Math.min(viewport.w / 1050, viewport.h / 950), 0.9) : 0.7;
  const focus = CARDS[active];
  const prevFocus = CARDS[prevActive];
  // Estimated flight length (used only for the highlight timing below — the
  // flight itself measures its true start from the live transform).
  const estimatedDistance = Math.hypot(
    (focus.x + focus.w / 2 - prevFocus.x - prevFocus.w / 2) * scale,
    (focus.y + focus.h / 2 - prevFocus.y - prevFocus.h / 2) * scale,
  );
  // The incoming card lights up only as the camera descends onto it.
  const focusDelay = !reducedMotion && engaged ? flightDurationFor(estimatedDistance) * 0.65 : 0;

  useLayoutEffect(() => {
    const el = canvasRef.current;
    if (!el || !measured) return;
    const setCamera = (lookX: number, lookY: number, s: number) => {
      el.style.transform = `translate(${viewport.w / 2 - lookX * s}px, ${viewport.h / 2 - lookY * s}px) scale(${s})`;
    };
    const targetX = focus.x + focus.w / 2;
    const targetY = focus.y + focus.h / 2;

    flightRef.current?.stop();
    if (!engaged || reducedMotion || shownRef.current === active) {
      // First paint, reduced motion, or a viewport resize: settle instantly.
      setCamera(targetX, targetY, scale);
    } else {
      // Recover the current camera from the live transform (matrix is
      // [s 0 0 s tx ty] because translate is applied before scale).
      const computed = getComputedStyle(el).transform;
      const matrix = computed !== "none" ? new DOMMatrix(computed) : null;
      const fromScale = matrix ? matrix.a : scale;
      const fromX = matrix ? (viewport.w / 2 - matrix.e) / fromScale : targetX;
      const fromY = matrix ? (viewport.h / 2 - matrix.f) / fromScale : targetY;

      const distance = Math.hypot((targetX - fromX) * scale, (targetY - fromY) * scale);
      const duration = flightDurationFor(distance);
      const zoomDepth = scale * (1 - flightZoomOutFor(distance));

      flightRef.current = animate(0, 1, {
        duration,
        ease: "linear",
        onUpdate: (t) => {
          const pan = flightPanEase(t);
          const dip = Math.sin(Math.PI * t) ** 2;
          setCamera(
            fromX + (targetX - fromX) * pan,
            fromY + (targetY - fromY) * pan,
            fromScale + (scale - fromScale) * pan - zoomDepth * dip,
          );
        },
      });
    }
    shownRef.current = active;
  }, [active, focus, measured, scale, viewport.w, viewport.h, engaged, reducedMotion]);

  return (
    <div
      ref={viewportRef}
      className={cn("relative overflow-hidden", className)}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => {
        setPaused(false);
        setHovered(null);
      }}
    >
      {measured && (
        <div
          ref={canvasRef}
          className="absolute top-0 left-0 will-change-transform"
          style={{ width: CANVAS_W, height: CANVAS_H, transformOrigin: "0 0" }}
        >
          <div
            aria-hidden
            className="absolute -inset-[1600px] bg-[radial-gradient(circle,var(--color-border)_1px,transparent_1px)] bg-[size:26px_26px] opacity-50 will-change-transform"
          />
          {CARDS.map((card, index) => {
            const isFocused = index === active;
            const isLifted = isFocused || (!reducedMotion && hovered === index);
            return (
              <motion.div
                key={card.id}
                className={cn(
                  "absolute rounded-[8px] transition-shadow duration-500",
                  isFocused ? "shadow-2xl" : "shadow-md",
                )}
                style={{
                  left: card.x,
                  top: card.y,
                  width: card.w,
                  height: card.h,
                  zIndex: isFocused ? 10 : hovered === index ? 5 : 1,
                }}
                initial={false}
                animate={{
                  opacity: reducedMotion || isLifted ? 1 : 0.3,
                  scale: !reducedMotion && isFocused ? 1.06 : 1,
                }}
                transition={{
                  opacity: {
                    duration: 0.9,
                    ease: "easeInOut",
                    delay: isFocused ? focusDelay : 0,
                  },
                  scale: {
                    type: "spring",
                    stiffness: 170,
                    damping: 26,
                    delay: isFocused ? focusDelay : 0,
                  },
                }}
                onPointerEnter={() => setHovered(index)}
                onPointerLeave={() => setHovered((prev) => (prev === index ? null : prev))}
              >
                <CardShell title={card.title}>{card.node}</CardShell>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

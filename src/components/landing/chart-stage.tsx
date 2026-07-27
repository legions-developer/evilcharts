"use client";

import {
  LandingCircleRadarChart,
  LandingComposedChart,
  LandingDashedLineChart,
  LandingDonutPieChart,
  LandingDottedAreaChart,
  LandingDuotoneBarChart,
  LandingGlowingLineChart,
  LandingGradientAreaChart,
  LandingGradientBarChart,
  LandingHatchedBarChart,
  LandingRadarChart,
  LandingSemiRadialChart,
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
import { getIconForLanguageExtension } from "@/assets/language/icons";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const CANVAS_W = 3600;
const CANVAS_H = 2500;

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
    { id: "line", title: "payouts-line-chart", x: 60, y: 80, w: 510, h: 320, node: <EChartsPayoutsLineChart /> },
    { id: "radar", title: "radar-chart", x: 70, y: 500, w: 470, h: 290, node: <LandingRadarChart /> },
    { id: "duotone-bar", title: "duotone-bar-chart", x: 60, y: 890, w: 470, h: 290, node: <LandingDuotoneBarChart /> },
    { id: "gradient-bar", title: "gradient-bar-chart", x: 80, y: 1280, w: 470, h: 290, node: <LandingGradientBarChart /> },
    { id: "market-share-pie", title: "market-share-pie-chart", x: 70, y: 1670, w: 510, h: 320, node: <EChartsMarketSharePieChart /> },

    { id: "area", title: "portfolio-area-chart", x: 650, y: 40, w: 510, h: 320, node: <EChartsPortfolioAreaChart /> },
    { id: "bar", title: "peak-bar-chart", x: 660, y: 460, w: 480, h: 300, node: <EChartsPeakBarChart /> },
    { id: "composed", title: "composed-chart", x: 650, y: 860, w: 480, h: 300, node: <LandingComposedChart /> },
    { id: "glowing-line", title: "glowing-line-chart", x: 660, y: 1260, w: 470, h: 290, node: <LandingGlowingLineChart /> },
    { id: "cache-tiers-radial", title: "cache-tiers-radial-chart", x: 650, y: 1650, w: 510, h: 320, node: <EChartsCacheTiersRadialChart /> },
    { id: "dotted-area", title: "dotted-area-chart", x: 660, y: 2070, w: 470, h: 290, node: <LandingDottedAreaChart /> },

    { id: "pie", title: "revenue-mix-pie-chart", x: 1250, y: 90, w: 510, h: 320, node: <EChartsRevenueMixPieChart /> },
    { id: "radial", title: "budget-radial-chart", x: 1240, y: 510, w: 520, h: 330, node: <EChartsBudgetRadialChart /> },
    { id: "hatched-bar", title: "hatched-bar-chart", x: 1250, y: 940, w: 480, h: 300, node: <LandingHatchedBarChart /> },
    { id: "donut", title: "donut-pie-chart", x: 1260, y: 1340, w: 470, h: 300, node: <LandingDonutPieChart /> },
    { id: "shipments-line", title: "shipments-line-chart", x: 1240, y: 1740, w: 510, h: 320, node: <EChartsShipmentsLineChart /> },
    { id: "circle-radar", title: "circle-radar-chart", x: 1250, y: 2160, w: 470, h: 290, node: <LandingCircleRadarChart /> },

    { id: "gradient-area", title: "gradient-area-chart", x: 1830, y: 60, w: 480, h: 300, node: <LandingGradientAreaChart /> },
    { id: "semi-radial", title: "semi-radial-chart", x: 1840, y: 460, w: 480, h: 300, node: <LandingSemiRadialChart /> },
    { id: "sankey", title: "pipeline-sankey-chart", x: 1830, y: 860, w: 520, h: 330, node: <EChartsPipelineSankeyChart /> },
    { id: "dashed-line", title: "dashed-line-chart", x: 1840, y: 1290, w: 470, h: 290, node: <LandingDashedLineChart /> },
    { id: "monospace-bar", title: "monospace-bar-chart", x: 1830, y: 1680, w: 510, h: 320, node: <EChartsMonospaceBarChart /> },
    { id: "progress-rings-pie", title: "progress-rings-pie-chart", x: 1840, y: 2100, w: 510, h: 320, node: <EChartsProgressRingsPieChart /> },

    { id: "latency-area", title: "latency-area-chart", x: 2420, y: 100, w: 510, h: 320, node: <EChartsLatencyAreaChart /> },
    { id: "allocation-sankey", title: "allocation-sankey-chart", x: 2410, y: 520, w: 520, h: 330, node: <EChartsAllocationSankeyChart /> },
    { id: "grid-bar", title: "grid-bar-chart", x: 2420, y: 950, w: 480, h: 300, node: <EChartsGridBarChart /> },
    { id: "reliability-pie", title: "reliability-pie-chart", x: 2430, y: 1350, w: 500, h: 320, node: <EChartsReliabilityScorePieChart /> },
    { id: "stripped-bar", title: "stripped-bar-chart", x: 2420, y: 1770, w: 470, h: 290, node: <LandingStrippedBarChart /> },

    { id: "audience-area", title: "audience-area-chart", x: 3010, y: 60, w: 510, h: 320, node: <EChartsAudienceAreaChart /> },
    { id: "ride-radial", title: "ride-radial-chart", x: 3020, y: 480, w: 520, h: 330, node: <EChartsRideRadialChart /> },
    { id: "benchmark-area", title: "benchmark-area-chart", x: 3010, y: 910, w: 510, h: 320, node: <EChartsBenchmarkAreaChart /> },
    { id: "step-line", title: "step-line-chart", x: 3020, y: 1330, w: 470, h: 290, node: <LandingStepLineChart /> },
  ],
];

const FOCUS_INTERVAL_MS = 3600;
const START_INDEX = CARDS.findIndex((card) => card.id === "hatched-bar");

function shuffled(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

const clamp = (min: number, value: number, max: number) => Math.min(max, Math.max(min, value));

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
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [active, setActive] = useState(START_INDEX);
  const [hovered, setHovered] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  // False until the first focus change: the camera must render already settled
  // on page load — any mount-time tween reads as the camera lurching into place.
  const [engaged, setEngaged] = useState(false);
  const queueRef = useRef<number[]>([]);
  const lastPickRef = useRef(START_INDEX);
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
        if (queueRef.current[0] === lastPickRef.current) {
          queueRef.current.push(queueRef.current.shift()!);
        }
      }
      lastPickRef.current = queueRef.current.shift()!;
      setEngaged(true);
      setActive(lastPickRef.current);
    }, FOCUS_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [reducedMotion, paused]);

  const measured = viewport.w > 0 && viewport.h > 0;
  const scale = measured ? clamp(0.5, Math.min(viewport.w / 1050, viewport.h / 950), 0.9) : 0.7;
  const focus = CARDS[active];
  // The active card always lands dead-center; the dot field extends far past
  // the canvas so corner focuses never expose a bare edge.
  const cameraX = viewport.w / 2 - (focus.x + focus.w / 2) * scale;
  const cameraY = viewport.h / 2 - (focus.y + focus.h / 2) * scale;

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
        <motion.div
          className="absolute top-0 left-0 will-change-transform"
          style={{ width: CANVAS_W, height: CANVAS_H, transformOrigin: "0 0" }}
          initial={false}
          animate={{
            x: cameraX,
            y: cameraY,
            scale: reducedMotion || !engaged ? scale : [null, scale * 0.94, scale],
          }}
          transition={
            engaged
              ? {
                  x: { type: "spring", stiffness: 44, damping: 17, mass: 1.1 },
                  y: { type: "spring", stiffness: 44, damping: 17, mass: 1.1 },
                  scale: { duration: 1.4, times: [0, 0.45, 1], ease: "easeInOut" },
                }
              : { duration: 0 }
          }
        >
          <div
            aria-hidden
            className="absolute -inset-[1600px] bg-[radial-gradient(circle,var(--color-border)_1px,transparent_1px)] bg-[size:26px_26px] opacity-50"
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
                  opacity: { duration: 0.7, ease: "easeInOut" },
                  scale: { type: "spring", stiffness: 260, damping: 19 },
                }}
                onPointerEnter={() => setHovered(index)}
                onPointerLeave={() => setHovered((prev) => (prev === index ? null : prev))}
              >
                <CardShell title={card.title}>{card.node}</CardShell>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

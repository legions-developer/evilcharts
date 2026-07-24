"use client";

import {
  resolveTooltipPosition,
  roundnessClass,
  tooltipIndicatorHtml,
  tooltipRow,
  tooltipVariantClass,
  type TooltipPosition,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/registry/ui/echarts-tooltip";
import {
  buildChartCss,
  getColorsCount,
  resolveColors,
  withAlpha,
  type ChartConfig,
  type ResolvedColors,
} from "@/registry/ui/echarts-chart";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from "react";
import { TooltipComponent, type TooltipComponentOption } from "echarts/components";
import { SankeyChart, type SankeySeriesOption } from "echarts/charts";
import { sampleGradient } from "@/registry/ui/echarts-dot";
import { motion, useReducedMotion } from "motion/react";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import * as echarts from "echarts/core";

// Re-export the shared types that were previously declared inline here, so
// existing consumers/examples keep importing them from the chart module.
export type { ChartConfig, TooltipPosition, TooltipRoundness, TooltipVariant };

// Modular registration keeps the bundle lean — only the pieces this chart needs.
// A sankey draws its own node/link geometry, so there is no grid, axis, or
// dataZoom here; the tooltip is the one extra component. GraphicComponent is
// deliberately NOT registered — this chart adds no raw graphic overlays.
echarts.use([SankeyChart, TooltipComponent, CanvasRenderer]);

type EChartsInstance = ReturnType<typeof echarts.init>;

// The exact option surface this chart uses — a sankey series plus the tooltip.
// Narrower than echarts' full EChartsOption, so a misspelled key fails the
// compile instead of silently reaching setOption.
type EChartsOption = ComposeOption<SankeySeriesOption | TooltipComponentOption>;

// Single-item views of the composed series' node/link arrays — the modular entry
// points don't export the sankey node/edge item option types directly, so derive
// them from the composed series to keep the builders fully type-checked.
type SankeyNodeItem = NonNullable<SankeySeriesOption["data"]>[number];
type SankeyEdgeItem = NonNullable<SankeySeriesOption["links"]>[number];

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const REVEAL_DURATION = 1000; // intro draw-in length, in milliseconds
const LOADING_ANIMATION_DURATION = 2000; // shimmer loop, in milliseconds
const DEFAULT_NODE_WIDTH = 10;
const DEFAULT_NODE_PADDING = 10;
const DEFAULT_LINK_CURVATURE = 0.5;
const DEFAULT_ITERATIONS = 32;
const GRAY = "rgba(120, 120, 120, 1)"; // fallback when a node has no resolved color

// ─────────────────────────────────────────────────────────────────────────────
// Theme knobs — every opacity in the diagram draws from these. Base colors come
// from the consumer's CSS tokens (resolved from the live DOM), so only the
// opacity factors live here. `withAlpha` MULTIPLIES a token's own alpha, so a
// translucent background/border token stays honest. Tune here, not inline.
// ─────────────────────────────────────────────────────────────────────────────
const NODE_FILL_OPACITY = 1; // resting/selected node rectangle — the bold, opaque element (stroke analogue) reads solid at full opacity (bumped from Recharts fillOpacity 0.9)
const NODE_DIM_OPACITY = 0.3; // node not connected to the current selection (stroke-dim analogue — kept)
const LINK_FILL_OPACITY = 0.4; // resting link band (Recharts fillOpacity 0.4 — the translucent fill base, kept)
const LINK_DIM_OPACITY = 0.05; // link not touching the current selection — the translucent band (fill analogue) recedes further (halved from 0.1)
const LABEL_DIM_OPACITY = 0.3; // node label faded when its node is dimmed
// Glow is a canvas shadow — the analogue of the Recharts twin's feGaussianBlur
// filter. Two stacked passes build a smooth Gaussian-like falloff instead of one
// tight ring: a tighter inner halo from the element itself, plus a wide faint
// outer halo from a silent duplicate series drawn underneath. Both are cast in
// the element's OWN color (a canvas shadow can't be a gradient), sampled from its
// paint so it never reads as a foreign tint. Tuned to match the Recharts blur.
const GLOW_BLUR = 12; // inner-glow radius for glowing nodes/links, in pixels
const GLOW_BLUR_OUTER = 28; // wider, fainter outer-glow radius, in pixels
const GLOW_ALPHA = 0.55; // inner-glow color alpha, × the element's own color alpha
const GLOW_ALPHA_OUTER = 0.3; // outer-glow color alpha, × the element's own color alpha
const INSIDE_PLATE_ALPHA = 0.55; // inside-label plate fill, × background alpha (twin's white/50 · black/60 wash)
const INSIDE_RIM_WIDTH = 2; // colored rim around the inside-label plate, in pixels (twin's 1px inset edge)

// The loading skeleton is a fixed gray sankey swept by a shimmer band. Unlike the
// area chart's clip window (fully transparent outside the sweep), the sankey keeps
// a low BASE floor so the blocky node/link geometry stays legible between sweeps —
// the bright band still rides across as an absolute-pixel gradient shared by nodes
// and links, sine-feathered at its edges.
const LOADING_NODE_FLOOR = 0.1; // node fill outside the sweep, × foreground alpha
const LOADING_NODE_PEAK = 0.42; // node fill inside the sweep, × foreground alpha
const LOADING_LINK_FLOOR = 0.04; // link fill outside the sweep, × foreground alpha
const LOADING_LINK_PEAK = 0.16; // link fill inside the sweep, × foreground alpha
const LOADING_SHIMMER_BAND = 0.22; // sweep half-width, fraction of chart width
const LOADING_SHIMMER_FEATHER = 0.22; // eased edge softening of the sweep

// Fixed skeleton graph — three columns, auto-laid-out by echarts. Values are
// arbitrary; only the shape matters while loading.
const SKELETON_NODES = [
  { name: "s0" },
  { name: "s1" },
  { name: "s2" },
  { name: "m0" },
  { name: "m1" },
  { name: "m2" },
  { name: "e0" },
  { name: "e1" },
];
const SKELETON_LINKS = [
  { source: "s0", target: "m0", value: 8 },
  { source: "s0", target: "m1", value: 5 },
  { source: "s1", target: "m1", value: 7 },
  { source: "s1", target: "m2", value: 4 },
  { source: "s2", target: "m1", value: 5 },
  { source: "s2", target: "m2", value: 6 },
  { source: "m0", target: "e0", value: 7 },
  { source: "m1", target: "e0", value: 9 },
  { source: "m1", target: "e1", value: 6 },
  { source: "m2", target: "e1", value: 8 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type LinkVariant = "gradient" | "solid" | "source" | "target";
export type NodeLabelPosition = "inside" | "outside";
// TooltipVariant and TooltipRoundness now live in @/registry/ui/echarts-tooltip and
// are imported + re-exported at the top of this file.
// Sankey has no directional draw-in — only "default" (echarts' native reveal) and
// "none" (off). Kept as a small union for copy-paste parity with the other
// EvilCharts entrance off-switches rather than a directional alias.
export type SankeyAnimationType = "none" | "default";

// ChartConfig (and its AtLeastOneThemeColor constraint) now lives in the shared
// @/registry/ui/echarts-chart module and is imported + re-exported at the top.

// A single flow node. `icon` mirrors the Recharts twin's data shape for source
// compatibility, but canvas can't mount a React node, so it is not rendered.
export type SankeyNode = {
  name: string;
  icon?: ReactNode;
};

// A single directed flow. `source`/`target` are indices into `nodes`, matching
// the Recharts Sankey data contract.
export type SankeyLink = {
  source: number;
  target: number;
  value: number;
};

export type SankeyData = {
  nodes: SankeyNode[];
  links: SankeyLink[];
};

export interface EChartsSankeyChartProps {
  data: SankeyData; // nodes + links rendered by the chart
  config: ChartConfig; // node colors + labels keyed by node name
  children: ReactNode; // composed parts — <Node>, <NodeLabel>, <Link>, <Tooltip>
  className?: string; // extra classes for the chart container
  nodeWidth?: number; // width of each node in pixels
  nodePadding?: number; // vertical gap between nodes (echarts nodeGap)
  linkCurvature?: number; // link curve amount, 0 (straight) to 1 (maximum)
  iterations?: number; // layout iterations — higher is more accurate
  // `sort` and `verticalAlign` mirror the Recharts twin's prop surface but have
  // no ECharts sankey equivalent (the layout always sorts + distributes
  // vertically). They are accepted and ignored; see the port notes.
  sort?: boolean;
  align?: "left" | "justify"; // horizontal node alignment (echarts nodeAlign)
  verticalAlign?: "justify" | "top";
  defaultSelectedNode?: string | null; // node selected on first render
  onSelectionChange?: (selection: { dataKey: string; value: number } | null) => void; // fires when the selected node changes
  isLoading?: boolean; // shows the animated loading skeleton
  animation?: boolean; // master switch for the intro draw-in — false renders instantly
  animationType?: SankeyAnimationType; // "none" disables the intro reveal
  chartOptions?: Record<string, unknown>; // escape hatch merged over the built ECharts option
}

// ─────────────────────────────────────────────────────────────────────────────
// Composible parts — DECLARATIVE CONFIG. Every part renders `null`; the root
// walks `children` by reference (child.type === Node, …) to collect its props.
// A sankey's nodes and links are intrinsic to its data, so <Node>/<Link> always
// render — they only CONFIGURE the diagram. <NodeLabel> and <Tooltip> follow the
// twin's presence semantics: omit them and that part does not render.
// ─────────────────────────────────────────────────────────────────────────────

export interface NodeProps {
  radius?: number; // corner radius of node rectangles in pixels
  isClickable?: boolean; // lets nodes be selected by clicking them
  glow?: string[]; // node names that get a soft outer glow
  children?: ReactNode; // optional <NodeLabel> composition
}

/**
 * Configures how the sankey nodes render. A configuration slot — the root reads
 * its props and wires them into the ECharts sankey series, so it renders nothing
 * itself. Compose a <NodeLabel> inside it to show labels.
 */
const Node: FC<NodeProps> = () => null;

export interface NodeLabelProps {
  position?: NodeLabelPosition; // places labels inside or beside the nodes
  showValues?: boolean; // appends each node's total flow value
  valueFormatter?: (value: number) => string; // formats node values when shown
}

/**
 * Declares labels for the <Node> it is composed inside. Like <Node>, it is a
 * configuration slot and renders nothing on its own. With no `position`, no
 * labels show — matching the Recharts twin.
 */
const NodeLabel: FC<NodeLabelProps> = () => null;

export interface LinkProps {
  variant?: LinkVariant; // coloring strategy for the link bands
  verticalPadding?: number; // reserved for parity with the Recharts twin (see notes)
  glow?: number[]; // link indices that get a soft outer glow
}

/**
 * Configures how the sankey links render. Like <Node>, it is a configuration slot
 * read by the root and renders nothing itself. The `variant` controls how each
 * link band is colored.
 */
const Link: FC<LinkProps> = () => null;

export interface TooltipProps {
  variant?: TooltipVariant; // visual style of the tooltip surface
  roundness?: TooltipRoundness; // border-radius of the tooltip
  position?: TooltipPosition; // "variable" follows the pointer (default); "fixed" pins the tooltip near the top and tracks the pointer's X
  defaultIndex?: number; // reserved for parity with the Recharts twin (see notes)
}

/** Presence enables the hover tooltip. Renders nothing. */
const Tooltip: FC<TooltipProps> = () => null;

// ─────────────────────────────────────────────────────────────────────────────
// Children collection — walk the declarative config into plain objects the option
// builder consumes. <NodeLabel> is read from the <Node>'s own children.
// ─────────────────────────────────────────────────────────────────────────────

type NodeSlot = {
  radius: number;
  isClickable: boolean;
  glow: string[];
};
type NodeLabelSlot = {
  position?: NodeLabelPosition; // undefined → no labels, like the Recharts twin
  showValues: boolean;
  valueFormatter?: (value: number) => string;
};
type LinkSlot = {
  variant: LinkVariant;
  verticalPadding: number;
  glow: number[];
};
type TooltipSlot = {
  present: boolean;
  variant: TooltipVariant;
  roundness: TooltipRoundness;
  position: TooltipPosition;
  defaultIndex?: number;
};

type CollectedConfig = {
  nodeConfig: NodeSlot;
  nodeLabel: NodeLabelSlot | null;
  linkConfig: LinkSlot;
  tooltip: TooltipSlot;
};

function collectConfig(children: ReactNode): CollectedConfig {
  let nodeConfig: NodeSlot = { radius: 0, isClickable: false, glow: [] };
  let nodeLabel: NodeLabelSlot | null = null;
  let linkConfig: LinkSlot = { variant: "gradient", verticalPadding: 0, glow: [] };
  let tooltip: TooltipSlot = {
    present: false,
    variant: "default",
    roundness: "lg",
    position: "variable",
  };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const type = child.type;

    if (type === Node) {
      const props = child.props as NodeProps;
      nodeConfig = {
        radius: props.radius ?? 0,
        isClickable: props.isClickable ?? false,
        glow: props.glow ?? [],
      };
      Children.forEach(props.children, (labelChild) => {
        if (isValidElement(labelChild) && labelChild.type === NodeLabel) {
          const lp = labelChild.props as NodeLabelProps;
          nodeLabel = {
            position: lp.position,
            showValues: lp.showValues ?? false,
            valueFormatter: lp.valueFormatter,
          };
        }
      });
    } else if (type === Link) {
      const props = child.props as LinkProps;
      linkConfig = {
        variant: props.variant ?? "gradient",
        verticalPadding: props.verticalPadding ?? 0,
        glow: props.glow ?? [],
      };
    } else if (type === Tooltip) {
      const props = child.props as TooltipProps;
      tooltip = {
        present: true,
        variant: props.variant ?? "default",
        roundness: props.roundness ?? "lg",
        position: props.position ?? "variable",
        defaultIndex: props.defaultIndex,
      };
    }
  });

  return { nodeConfig, nodeLabel, linkConfig, tooltip };
}

// Color plumbing (ChartConfig, getColorsCount, distributeColors, buildChartCss,
// normalizeColor, withAlpha, ResolvedColors, resolveColors) now lives in
// @/registry/ui/echarts-chart and is imported at the top of this file. `resolveColors`
// falls back to GRAY (rgba(120, 120, 120, 1)) for an unresolved node slot, matching
// this file's GRAY constant.

// ─────────────────────────────────────────────────────────────────────────────
// Paint helpers — the ECharts analogue of the Recharts SVG paints. Node fills are
// a vertical gradient of the node's colors; link fills follow the <Link> variant.
// ─────────────────────────────────────────────────────────────────────────────

// A node's fill: a vertical multi-stop gradient of its color slots (top → bottom),
// or a solid color when it has only one. Mirrors the twin's `NodeColorGradients`,
// which paints each node with a `y1=0 → y2=1` linear gradient.
function nodeGradient(slots: string[]): string | echarts.graphic.LinearGradient {
  if (slots.length <= 1) return slots[0] ?? GRAY;
  const stops = slots.map((color, i) => ({ offset: i / (slots.length - 1), color }));
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, stops);
}

// A link band's fill for a given variant. `gradient` bakes the twin's 0.2/0.5/0.2
// source→target stop alphas into the color; `source`/`target` reuse the node's
// vertical gradient; `solid` is the foreground token. The connected/dimmed alpha
// is applied separately as `lineStyle.opacity`, matching the twin's `fillOpacity`.
function edgeColor(
  variant: LinkVariant,
  sourceSlots: string[],
  targetSlots: string[],
  foreground: string,
): string | echarts.graphic.LinearGradient {
  switch (variant) {
    case "gradient": {
      const source = sourceSlots[0] ?? GRAY;
      const target = targetSlots[0] ?? GRAY;
      return new echarts.graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: withAlpha(source, 0.2) },
        { offset: 0.5, color: withAlpha(source, 0.5) },
        { offset: 1, color: withAlpha(target, 0.2) },
      ]);
    }
    case "source":
      return nodeGradient(sourceSlots);
    case "target":
      return nodeGradient(targetSlots);
    case "solid":
    default:
      return foreground;
  }
}

// `sampleGradient` — the concrete color a node's/link's gradient shows at position
// t ∈ [0, 1] — now lives in @/registry/ui/echarts-dot and is imported at the top.
// A canvas shadow can only be cast in a SOLID color, so the glow samples the
// element's OWN paint at a representative point (its mid color) instead of a
// foreign tint, keeping the glow in the node's own hue.

// The solid glow color for a link band, following its <Link> variant: the source
// or target node's mid color for the node-colored variants (and for `gradient`,
// whose band is dominated by the source hue), the foreground token for `solid`.
function edgeGlowColor(
  variant: LinkVariant,
  sourceSlots: string[],
  targetSlots: string[],
  foreground: string,
): string {
  switch (variant) {
    case "target":
      return sampleGradient(targetSlots, 0.5);
    case "solid":
      return foreground;
    case "source":
    case "gradient":
    default:
      return sampleGradient(sourceSlots, 0.5);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Selection helpers — a node click highlights the node plus its direct neighbors
// and dims the rest, exactly like the Recharts twin's `isNodeConnected`.
// ─────────────────────────────────────────────────────────────────────────────

// The selected node plus every node one link away from it.
function connectedNodeSet(data: SankeyData, selected: string): Set<string> {
  const set = new Set<string>([selected]);
  const selectedIdx = data.nodes.findIndex((node) => node.name === selected);
  if (selectedIdx === -1) return set;

  for (const link of data.links) {
    if (link.source === selectedIdx) {
      const name = data.nodes[link.target]?.name;
      if (name) set.add(name);
    } else if (link.target === selectedIdx) {
      const name = data.nodes[link.source]?.name;
      if (name) set.add(name);
    }
  }
  return set;
}

// Each node's total flow: outgoing sum, falling back to incoming for leaf nodes —
// the same value the twin surfaces in labels, the tooltip, and `onSelectionChange`.
function computeNodeValues(data: SankeyData): Record<string, number> {
  const values: Record<string, number> = {};
  data.nodes.forEach((node, index) => {
    let outgoing = 0;
    let incoming = 0;
    for (const link of data.links) {
      if (link.source === index) outgoing += link.value;
      if (link.target === index) incoming += link.value;
    }
    values[node.name] = outgoing > 0 ? outgoing : incoming;
  });
  return values;
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton helper — a hard clip window swept across the fixed skeleton.
// `floor` keeps the geometry faintly visible between sweeps; `peak` is the bright
// band. `center` may run outside [0, 1] so the window fully enters and exits.
// ─────────────────────────────────────────────────────────────────────────────

function shimmerWindowStops(center: number, color: string, floor: number, peak: number) {
  const half = LOADING_SHIMMER_BAND;
  const feather = LOADING_SHIMMER_FEATHER;

  const alphaAt = (x: number) => {
    const dist = Math.abs(x - center);
    if (dist <= half - feather) return peak;
    if (dist >= half) return floor;
    // Sine-eased falloff — a linear ramp still reads as a hard cut.
    const eased = Math.sin(((1 - (dist - (half - feather)) / feather) * Math.PI) / 2);
    return floor + (peak - floor) * eased;
  };

  const offsets = [
    0,
    center - half,
    center - half + feather,
    center,
    center + half - feather,
    center + half,
    1,
  ]
    .filter((x) => x >= 0 && x <= 1)
    .sort((a, b) => a - b);

  const stops: { offset: number; color: string }[] = [];
  for (const offset of offsets) {
    if (stops.length === 0 || offset - stops[stops.length - 1].offset > 1e-4) {
      stops.push({ offset, color: withAlpha(color, alphaAt(offset)) });
    }
  }
  return stops;
}

// Tooltip HTML primitives (roundnessClass, tooltipVariantClass, tooltipIndicatorHtml,
// tooltipRow, resolveTooltipPosition, indicatorBackground) now live in
// @/registry/ui/echarts-tooltip and are imported at the top. The tooltip DOM lives
// inside `[data-chart={id}]`, so the injected `--color-*` vars and Tailwind classes
// resolve directly (no color read).

// ─────────────────────────────────────────────────────────────────────────────
// Option builders — pure functions from a snapshot context to ECharts option
// fragments. The component reads its refs ONCE per build into this context;
// nothing below touches React state or the chart instance, so each fragment can
// be reasoned about (and tested) in isolation.
// ─────────────────────────────────────────────────────────────────────────────

type OptionBuildContext = {
  data: SankeyData;
  config: ChartConfig;
  nodeConfig: NodeSlot;
  nodeLabel: NodeLabelSlot | null;
  linkConfig: LinkSlot;
  tooltipSlot: TooltipSlot;
  selectedNode: string | null;
  nodeWidth: number;
  nodePadding: number;
  linkCurvature: number;
  iterations: number;
  align: "left" | "justify";
  isLoading: boolean;
  resolved: ResolvedColors;
  nodeValues: Record<string, number>;
  outsideLabels: boolean; // reserves right padding for outside labels
};

// The node label config, shared by every node. Two-line rich text when values are
// shown; per-node opacity (for selection dimming) is applied on the node items.
function buildNodeLabel(ctx: OptionBuildContext): SankeySeriesOption["label"] {
  const { nodeLabel, config, nodeValues, resolved } = ctx;
  const position = nodeLabel?.position;

  // No <NodeLabel>, or one with no position, shows nothing — Recharts parity.
  if (position !== "inside" && position !== "outside") return { show: false };

  const { tokens } = resolved;
  const inside = position === "inside";
  const showValues = nodeLabel?.showValues ?? false;
  const format = nodeLabel?.valueFormatter ?? ((value: number) => value.toLocaleString());

  const labelOf = (name: string) => {
    const label = config[name]?.label;
    return typeof label === "string" ? label : name;
  };

  const formatter = (params: unknown): string => {
    const name = String((params as { name?: string | number }).name ?? "");
    const nameText = labelOf(name);
    if (!showValues) return `{name|${nameText}}`;
    return `{name|${nameText}}\n{value|${format(nodeValues[name] ?? 0)}}`;
  };

  return {
    show: true,
    // Inside sits centered on the node; outside hangs to the node's right.
    position: inside ? "inside" : "right",
    align: inside ? "center" : "left",
    formatter,
    rich: {
      name: {
        color: tokens.foreground,
        fontSize: inside ? 10 : 12,
        fontWeight: 500,
        lineHeight: 15,
      },
      value: {
        color: withAlpha(tokens.foreground, inside ? 0.6 : 0.5),
        fontFamily: "monospace",
        fontSize: inside ? 11 : 12,
        lineHeight: 15,
      },
    },
    // No label-scoped backing box for inside labels: the whole node is rebuilt as
    // the plate in buildSankeySeries (a full-rect background wash with the node's
    // color showing only as a rounded rim), so the text sits centered directly on
    // that plate — matching the twin, where the plate spans the entire node rect.
  };
}

function buildSankeySeries(ctx: OptionBuildContext): SankeySeriesOption {
  const {
    data,
    nodeConfig,
    linkConfig,
    selectedNode,
    nodeWidth,
    nodePadding,
    linkCurvature,
    iterations,
    align,
    resolved,
    outsideLabels,
  } = ctx;
  const { tokens, series: slotsByName } = resolved;
  const hasSelection = selectedNode !== null;
  const connected = hasSelection ? connectedNodeSet(data, selectedNode) : null;
  // With inside labels the node is rebuilt as a card: a translucent background
  // plate fills the whole rect and the node's own color/gradient shows only as a
  // rounded rim (the colored card behind it — the __sankey-plate series — tints
  // through the plate). Mirrors the twin's full-rect inset plate + 1px colored edge.
  const insideLabels = ctx.nodeLabel?.position === "inside";

  const nodes: SankeyNodeItem[] = data.nodes.map((node) => {
    const slots = slotsByName[node.name] ?? [GRAY];
    const dimmed = connected ? !connected.has(node.name) : false;
    const glowing = nodeConfig.glow.includes(node.name);

    // Inner glow pass — cast in the node's own mid color (see sampleGradient).
    // The wide outer pass is the silent __sankey-glow series drawn underneath.
    const glowStyle = glowing
      ? { shadowBlur: GLOW_BLUR, shadowColor: withAlpha(sampleGradient(slots, 0.5), GLOW_ALPHA) }
      : {};

    return {
      name: node.name,
      itemStyle: insideLabels
        ? {
            // Dark card: plate fill spans the full rect, color rides the rim only.
            color: withAlpha(tokens.background, INSIDE_PLATE_ALPHA),
            borderColor: nodeGradient(slots),
            borderWidth: INSIDE_RIM_WIDTH,
            borderRadius: nodeConfig.radius,
            opacity: dimmed ? NODE_DIM_OPACITY : 1,
            ...glowStyle,
          }
        : {
            color: nodeGradient(slots),
            opacity: dimmed ? NODE_DIM_OPACITY : NODE_FILL_OPACITY,
            borderWidth: 0,
            borderRadius: nodeConfig.radius,
            ...glowStyle,
          },
      // Fade a node's own label with it when the selection dims it.
      label: { opacity: dimmed ? LABEL_DIM_OPACITY : 1 },
    };
  });

  const links: SankeyEdgeItem[] = data.links.map((link, index) => {
    const source = data.nodes[link.source]?.name ?? String(link.source);
    const target = data.nodes[link.target]?.name ?? String(link.target);
    const sourceSlots = slotsByName[source] ?? [GRAY];
    const targetSlots = slotsByName[target] ?? [GRAY];
    // Connected = nothing selected, or this link touches the selected node.
    const isConnected = !hasSelection || source === selectedNode || target === selectedNode;
    const glowing = linkConfig.glow.includes(index);

    return {
      source,
      target,
      value: link.value,
      lineStyle: {
        color: edgeColor(linkConfig.variant, sourceSlots, targetSlots, tokens.foreground),
        opacity: isConnected ? LINK_FILL_OPACITY : LINK_DIM_OPACITY,
        // A link band is translucent, so it can't take a second opaque glow pass
        // underneath without doubling its color — it gets the single inner glow,
        // cast in the band's representative color (source hue for most variants).
        ...(glowing
          ? {
              shadowBlur: GLOW_BLUR,
              shadowColor: withAlpha(
                edgeGlowColor(linkConfig.variant, sourceSlots, targetSlots, tokens.foreground),
                GLOW_ALPHA,
              ),
            }
          : {}),
      },
    };
  });

  return {
    id: "__sankey",
    type: "sankey",
    z: 3, // above the __sankey-glow outer-halo series (z: 2)
    left: 8,
    // Outside labels hang to the right of the rightmost column — reserve room.
    right: outsideLabels ? 120 : 8,
    top: 12,
    bottom: 12,
    nodeWidth,
    nodeGap: nodePadding,
    layoutIterations: iterations,
    nodeAlign: align === "left" ? "left" : "justify",
    draggable: false,
    // The twin has no hover-dimming — hovering only shows the tooltip. `focus:
    // "none"` keeps every element at full styling on hover (no adjacency blur).
    emphasis: { focus: "none" },
    lineStyle: { curveness: linkCurvature },
    label: buildNodeLabel(ctx),
    data: nodes,
    links,
  };
}

// The colored card drawn UNDER the inside-label plate. With inside labels the
// real node's fill becomes a translucent background plate (see buildSankeySeries),
// so this silent duplicate — identical layout, pixel-exact under the real nodes —
// supplies the node's actual color/gradient behind that plate. The plate's
// translucency lets this color tint through (a pale card in light, a dark card in
// dark), matching the Recharts twin's colored rect beneath its white/black wash.
// Returns null unless inside labels are active, so the extra series is only paid
// for on demand.
function buildInsidePlateSeries(ctx: OptionBuildContext): SankeySeriesOption | null {
  const {
    data,
    nodeConfig,
    nodeLabel,
    selectedNode,
    nodeWidth,
    nodePadding,
    linkCurvature,
    iterations,
    align,
    resolved,
    outsideLabels,
  } = ctx;
  if (nodeLabel?.position !== "inside") return null;

  const { series: slotsByName } = resolved;
  const hasSelection = selectedNode !== null;
  const connected = hasSelection ? connectedNodeSet(data, selectedNode) : null;

  const nodes: SankeyNodeItem[] = data.nodes.map((node) => {
    const slots = slotsByName[node.name] ?? [GRAY];
    const dimmed = connected ? !connected.has(node.name) : false;
    return {
      name: node.name,
      itemStyle: {
        color: nodeGradient(slots),
        opacity: dimmed ? NODE_DIM_OPACITY : NODE_FILL_OPACITY,
        borderWidth: 0,
        borderRadius: nodeConfig.radius,
      },
      label: { show: false },
    };
  });

  // Links exist only so the layout matches the main series pixel-exact; they are
  // fully transparent here — the real bands are drawn by the __sankey series.
  const links: SankeyEdgeItem[] = data.links.map((link) => ({
    source: data.nodes[link.source]?.name ?? String(link.source),
    target: data.nodes[link.target]?.name ?? String(link.target),
    value: link.value,
    lineStyle: { opacity: 0 },
  }));

  return {
    id: "__sankey-plate",
    type: "sankey",
    z: 2, // below the real __sankey series (z: 3), above the __sankey-glow halo
    silent: true,
    left: 8,
    right: outsideLabels ? 120 : 8,
    top: 12,
    bottom: 12,
    nodeWidth,
    nodeGap: nodePadding,
    layoutIterations: iterations,
    nodeAlign: align === "left" ? "left" : "justify",
    draggable: false,
    emphasis: { disabled: true },
    label: { show: false },
    lineStyle: { curveness: linkCurvature },
    data: nodes,
    links,
  };
}

// The wide, faint OUTER glow pass. A canvas shadow can't blur an element's own
// gradient fill (the shadow is a single flat color), and one shadow pass reads as
// a tight ring — so a soft, Recharts-like halo is built from TWO passes: the main
// series casts the tight inner one, and this silent duplicate — identical layout,
// so its nodes sit pixel-exact under the real ones — casts a wider, fainter outer
// one. Only glowing nodes are visible here; every other node and ALL links are
// transparent (opacity 0 casts no shadow and can't double the translucent bands).
// Returns null when nothing glows, so the extra series is only paid for on demand.
function buildGlowSeries(ctx: OptionBuildContext): SankeySeriesOption | null {
  const {
    data,
    nodeConfig,
    selectedNode,
    nodeWidth,
    nodePadding,
    linkCurvature,
    iterations,
    align,
    resolved,
    outsideLabels,
  } = ctx;
  if (nodeConfig.glow.length === 0) return null;

  const { series: slotsByName } = resolved;
  const hasSelection = selectedNode !== null;
  const connected = hasSelection ? connectedNodeSet(data, selectedNode) : null;

  const nodes: SankeyNodeItem[] = data.nodes.map((node) => {
    const glowing = nodeConfig.glow.includes(node.name);
    const dimmed = connected ? !connected.has(node.name) : false;
    const slots = slotsByName[node.name] ?? [GRAY];
    // Non-glowing (or selection-dimmed) nodes contribute no halo.
    const active = glowing && !dimmed;
    return {
      name: node.name,
      itemStyle: {
        color: nodeGradient(slots),
        // The real node (opacity NODE_FILL_OPACITY) sits exactly on top, so this
        // fill is hidden and only its shadow shows; 0 fully removes the pass for
        // inactive nodes.
        opacity: active ? NODE_FILL_OPACITY : 0,
        borderWidth: 0,
        borderRadius: nodeConfig.radius,
        ...(active
          ? {
              shadowBlur: GLOW_BLUR_OUTER,
              shadowColor: withAlpha(sampleGradient(slots, 0.5), GLOW_ALPHA_OUTER),
            }
          : {}),
      },
      label: { show: false },
    };
  });

  const links: SankeyEdgeItem[] = data.links.map((link) => ({
    source: data.nodes[link.source]?.name ?? String(link.source),
    target: data.nodes[link.target]?.name ?? String(link.target),
    value: link.value,
    lineStyle: { opacity: 0 }, // never drawn — avoids doubling the real bands
  }));

  return {
    id: "__sankey-glow",
    type: "sankey",
    z: 2, // below the real __sankey series (z: 3)
    silent: true,
    left: 8,
    right: outsideLabels ? 120 : 8,
    top: 12,
    bottom: 12,
    nodeWidth,
    nodeGap: nodePadding,
    layoutIterations: iterations,
    nodeAlign: align === "left" ? "left" : "justify",
    draggable: false,
    emphasis: { disabled: true },
    label: { show: false },
    lineStyle: { curveness: linkCurvature },
    data: nodes,
    links,
  };
}

// Tooltip HTML builder, closed over the build context. A sankey fires item events
// for both nodes (`dataType: "node"`) and links (`dataType: "edge"`); the
// formatter renders the right row for each.
function createTooltipFormatter(ctx: OptionBuildContext) {
  const { config, nodeValues, tooltipSlot } = ctx;

  const labelOf = (name: string) => {
    const label = config[name]?.label;
    return typeof label === "string" ? label : name;
  };
  const colorsOf = (name: string) => (config[name] ? getColorsCount(config[name]) : 1);
  // A sankey tooltip carries no axis title — each hovered node/link surfaces a
  // single indicator+label+value row. The shared tooltipShell always renders a
  // title slot, so the outer surface stays a chart-local, title-less wrapper
  // (reusing the shared roundness/variant classes); the row itself is the shared
  // tooltipRow with the shared indicator swatch and no per-row dim.
  const wrap = (body: string) =>
    `<div class="grid min-w-32 items-start gap-1.5 border border-border/50 px-2.5 py-1.5 text-xs shadow-xl ${roundnessClass[tooltipSlot.roundness]} ${tooltipVariantClass[tooltipSlot.variant]}"><div class="grid gap-1.5">${body}</div></div>`;

  return (params: unknown): string => {
    const p = params as {
      dataType?: string;
      name?: string;
      data?: { source?: string | number; target?: string | number; value?: number };
    };

    if (p.dataType === "edge") {
      const source = String(p.data?.source ?? "");
      const target = String(p.data?.target ?? "");
      const value = typeof p.data?.value === "number" ? p.data.value.toLocaleString() : "";
      return wrap(
        tooltipRow({
          indicatorHtml: tooltipIndicatorHtml(source, colorsOf(source)),
          labelText: `${labelOf(source)} → ${labelOf(target)}`,
          valueText: value,
          dimmed: "",
        }),
      );
    }

    const name = String(p.name ?? "");
    const value = (nodeValues[name] ?? 0).toLocaleString();
    return wrap(
      tooltipRow({
        indicatorHtml: tooltipIndicatorHtml(name, colorsOf(name)),
        labelText: labelOf(name),
        valueText: value,
        dimmed: "",
      }),
    );
  };
}

function buildTooltipOption(ctx: OptionBuildContext): TooltipComponentOption {
  const { tooltipSlot, isLoading } = ctx;
  return {
    show: tooltipSlot.present && !isLoading,
    trigger: "item",
    confine: true,
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    extraCssText: "box-shadow:none;",
    // "variable" (default) keeps ECharts' item-follow position — the current
    // behavior; "fixed" pins the tooltip near the top and tracks only the
    // pointer's X. The sankey tooltip is item-triggered (nodes/links, no axis),
    // so it wires the position directly through resolveTooltipPosition rather
    // than tooltipBaseOption, which is trigger:"axis" only.
    position: resolveTooltipPosition(tooltipSlot.position),
    formatter: createTooltipFormatter(ctx),
  };
}

// Loading skeleton — a fixed gray sankey, invisible until the first shimmer tick
// tints it. Node fills and link fills are set to fully-transparent foreground so
// there is no flash before the rAF loop positions the sweep.
function buildLoadingOption(ctx: OptionBuildContext): EChartsOption {
  const { resolved } = ctx;
  const transparent = withAlpha(resolved.tokens.foreground, 0);

  return {
    animation: false,
    tooltip: { show: false },
    series: [
      {
        id: "__loading",
        type: "sankey",
        left: 12,
        right: 12,
        top: 12,
        bottom: 12,
        nodeWidth: DEFAULT_NODE_WIDTH,
        nodeGap: DEFAULT_NODE_PADDING,
        layoutIterations: DEFAULT_ITERATIONS,
        draggable: false,
        silent: true,
        emphasis: { disabled: true },
        label: { show: false },
        itemStyle: { color: transparent, borderWidth: 0 },
        lineStyle: { color: transparent, curveness: DEFAULT_LINK_CURVATURE },
        data: SKELETON_NODES,
        links: SKELETON_LINKS,
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Live imperative state — everything the ECharts event handlers, the shimmer rAF,
// and the theme repush read or write OUTSIDE the React render cycle, grouped in
// one ref-stable object. None of it is render output, which is why it is not
// React state.
// ─────────────────────────────────────────────────────────────────────────────

type LiveState = {
  resolved: ResolvedColors | null; // colors read off the live DOM — feeds builds and the shimmer
  hasRevealed: boolean; // the intro draw-in already played on this chart instance
  // Latest callbacks/flags for the imperative ECharts click handler.
  handlers: {
    onSelectionChange?: (selection: { dataKey: string; value: number } | null) => void;
    isNodeClickable: boolean;
    nodeValues: Record<string, number>;
  };
  // Update-style re-push for paths that bypass React entirely (theme flips,
  // resizes) — set by the sync effect.
  repush: () => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apache ECharts port of the EvilCharts sankey chart, exposing a compound-as-config
 * API so its JSX reads identically to the Recharts twin. The root owns the flow
 * data, selection state, the loading skeleton, and the intro reveal; the visual
 * parts — `<Node>`, `<NodeLabel>`, `<Link>`, `<Tooltip>` — are composed as
 * declarative children that render nothing. The root walks those children by
 * reference and drives a single imperative ECharts instance. Fully self-contained:
 * its only dependencies are `react`, `echarts`, and `motion`.
 */
export function EChartsSankeyChart({
  data,
  config,
  children,
  className,
  nodeWidth = DEFAULT_NODE_WIDTH,
  nodePadding = DEFAULT_NODE_PADDING,
  linkCurvature = DEFAULT_LINK_CURVATURE,
  iterations = DEFAULT_ITERATIONS,
  align = "justify",
  defaultSelectedNode = null,
  onSelectionChange,
  isLoading = false,
  animation = true,
  animationType = "default",
  chartOptions,
}: EChartsSankeyChartProps) {
  const rawId = useId();
  const chartId = `chart-${rawId.replace(/:/g, "")}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const echartsRef = useRef<EChartsInstance | null>(null);

  // The single imperative surface (see LiveState). `resolved` lives here rather
  // than in state: as state it would force an extra render pass and an effect
  // whose only job is to push the option. Object identity is stable for the
  // component's lifetime.
  const live = useRef<LiveState>({
    resolved: null,
    hasRevealed: false,
    handlers: {
      onSelectionChange,
      isNodeClickable: false,
      nodeValues: {},
    },
    repush: () => {},
  }).current;

  const shouldReduceMotion = useReducedMotion();

  const [selectedNode, setSelectedNode] = useState<string | null>(defaultSelectedNode);

  // ── Declarative config, collected from children by reference ─────────────────
  const collected = useMemo(() => collectConfig(children), [children]);
  const { nodeConfig, nodeLabel, linkConfig, tooltip: tooltipSlot } = collected;

  const nodeValues = useMemo(() => computeNodeValues(data), [data]);
  const outsideLabels = nodeLabel?.position === "outside";

  const css = useMemo(() => buildChartCss(chartId, config), [chartId, config]);

  // Node names double as the color keys — resolve `--color-{name}-{n}` for each.
  const nodeNames = useMemo(() => data.nodes.map((node) => node.name), [data]);

  // Refresh the click handler's snapshot of the latest callbacks/flags every render.
  live.handlers = {
    onSelectionChange,
    isNodeClickable: nodeConfig.isClickable,
    nodeValues,
  };

  const toggleSelection = useCallback(
    (name: string) => {
      setSelectedNode((prev) => {
        const next = prev === name ? null : name;
        const { onSelectionChange: cb, nodeValues: values } = live.handlers;
        cb?.(next === null ? null : { dataKey: next, value: values[next] ?? 0 });
        return next;
      });
    },
    [live],
  );

  // ── Option builder ───────────────────────────────────────────────────────────
  // Thin orchestrator over the pure builders above: snapshot the imperative
  // surface into an OptionBuildContext, then assemble.
  const buildOption = useCallback((): EChartsOption => {
    const resolved = live.resolved;
    if (!resolved) return {};

    const ctx: OptionBuildContext = {
      data,
      config,
      nodeConfig,
      nodeLabel,
      linkConfig,
      tooltipSlot,
      selectedNode,
      nodeWidth,
      nodePadding,
      linkCurvature,
      iterations,
      align,
      isLoading,
      resolved,
      nodeValues,
      outsideLabels,
    };

    if (isLoading) return buildLoadingOption(ctx);

    // Draw order, bottom → top: the outer-halo pass (when any node glows), then
    // the colored card under inside-label plates, then the real sankey on top.
    const series: SankeySeriesOption[] = [];
    const glowSeries = buildGlowSeries(ctx);
    if (glowSeries) series.push(glowSeries);
    const plateSeries = buildInsidePlateSeries(ctx);
    if (plateSeries) series.push(plateSeries);
    series.push(buildSankeySeries(ctx));

    return {
      animation: false,
      tooltip: buildTooltipOption(ctx),
      series,
    };
  }, [
    live,
    data,
    config,
    nodeConfig,
    nodeLabel,
    linkConfig,
    tooltipSlot,
    selectedNode,
    nodeWidth,
    nodePadding,
    linkCurvature,
    iterations,
    align,
    isLoading,
    nodeValues,
    outsideLabels,
  ]);

  // ── Init + resize + theme observer (once) ────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    const container = containerRef.current;
    if (!mount || !container) return;

    const chart = echarts.init(mount);
    echartsRef.current = chart;

    const resizeObserver = new ResizeObserver(() => {
      // Observers always fire once right after observe(). Repushing on that no-op
      // fire would land one frame into the intro and stomp the reveal — only
      // react when the renderer size actually changed.
      if (mount.clientWidth === chart.getWidth() && mount.clientHeight === chart.getHeight()) {
        return;
      }
      chart.resize();
      live.repush();
    });
    resizeObserver.observe(mount);

    // Light/dark flips change no React state — re-resolve and push directly.
    const themeObserver = new MutationObserver(() => {
      live.repush();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Clicking a node toggles its selection. Sankey click params carry
    // `dataType: "node"` (vs "edge" for links); only nodes are selectable, and
    // only when <Node isClickable> is set.
    chart.on("click", (params) => {
      const { isNodeClickable } = live.handlers;
      if (!isNodeClickable) return;
      const p = params as { dataType?: string; name?: string };
      if (p.dataType !== "node") return;
      if (typeof p.name === "string") toggleSelection(p.name);
    });

    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
      chart.dispose();
      echartsRef.current = null;
      // The reveal guard belongs to the chart instance it guarded. Without this
      // reset, StrictMode's dev-only mount→unmount→remount plays the entrance on
      // the throwaway instance and the surviving one renders without it.
      live.hasRevealed = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync ECharts with props/theme/selection — resolve, build, push ────────────
  useEffect(() => {
    const chart = echartsRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;

    // Colors come from the <style> committed just before this effect ran — read
    // them here, right before the push, rather than round-tripping through state.
    live.resolved = resolveColors(container, config, nodeNames);

    const push = (withEntrance: boolean) => {
      const option = buildOption();
      const merged = chartOptions ? { ...option, ...chartOptions } : option;
      Object.assign(merged, {
        animation: withEntrance,
        animationDuration: REVEAL_DURATION,
        animationDurationUpdate: 0,
      });
      // chartOptions is an untyped escape hatch — the spread erases the option's
      // shape, so re-assert it. The only cast in the file.
      chart.setOption(merged as EChartsOption, { notMerge: true });
    };

    // Intro reveal — ECharts' native draw-in, enabled only for the first real
    // render. Every later push (selection, theme) applies instantly, since
    // notMerge would otherwise replay the entrance on each of them. A loading
    // cycle re-arms it: the Recharts twin remounts its diagram after loading and
    // replays the intro, so data → loading → data draws in again here too.
    if (isLoading) live.hasRevealed = false;
    const shouldReveal = !live.hasRevealed && !isLoading;
    if (shouldReveal) live.hasRevealed = true;
    const revealEnabled =
      animation && shouldReveal && animationType !== "none" && !shouldReduceMotion;
    push(revealEnabled);

    // Theme flips and resizes re-enter here without touching React: re-read the
    // tokens (the .dark class changed, or the renderer resized) and push an
    // update-style option.
    live.repush = () => {
      live.resolved = resolveColors(container, config, nodeNames);
      push(false);
    };
  }, [
    live,
    buildOption,
    chartOptions,
    isLoading,
    animation,
    animationType,
    shouldReduceMotion,
    config,
    nodeNames,
  ]);

  // ── Loading shimmer — rAF sweeps a bright band across the fixed skeleton ──────
  useEffect(() => {
    const chart = echartsRef.current;
    if (!chart || !isLoading) return;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const phase = ((((now - start) / LOADING_ANIMATION_DURATION) % 1) + 1) % 1;

      // Read tokens per frame, so a theme flip mid-loading retints the shimmer.
      const foreground = live.resolved?.tokens.foreground ?? GRAY;
      const w = chart.getWidth();
      const h = chart.getHeight();
      if (!w || !h) {
        raf = requestAnimationFrame(tick);
        return;
      }
      // Sweep the clip window from fully off-screen left to fully off-screen
      // right, leaned 45°. ABSOLUTE pixel coordinates (global gradient) are
      // shared by nodes and links, so every element lights up as the same band
      // passes its x-position — nodes in a column brighten together.
      const maxT = (w + h) / (2 * w);
      const center = phase * (maxT + 2 * LOADING_SHIMMER_BAND) - LOADING_SHIMMER_BAND;
      const clip = (floor: number, peak: number) =>
        new echarts.graphic.LinearGradient(
          0,
          0,
          w,
          w,
          shimmerWindowStops(center, foreground, floor, peak),
          true,
        );
      chart.setOption(
        {
          series: [
            {
              id: "__loading",
              itemStyle: { color: clip(LOADING_NODE_FLOOR, LOADING_NODE_PEAK), borderWidth: 0 },
              lineStyle: {
                color: clip(LOADING_LINK_FLOOR, LOADING_LINK_PEAK),
                curveness: DEFAULT_LINK_CURVATURE,
              },
            },
          ],
        },
        { silent: true, lazyUpdate: true },
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, isLoading]);

  return (
    <div
      ref={containerRef}
      data-chart={chartId}
      className={`relative flex flex-col text-xs ${className ?? ""}`}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="relative min-h-0 w-full flex-1">
        <div ref={mountRef} className="h-full min-h-0 w-full" />
      </div>

      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="text-primary bg-background flex items-center justify-center gap-2 rounded-md border px-2 py-0.5 text-sm"
          >
            <div className="border-border border-t-primary h-3 w-3 animate-spin rounded-full border" />
            <span>Loading</span>
          </motion.div>
        </div>
      )}
    </div>
  );
}

EChartsSankeyChart.Node = Node;
EChartsSankeyChart.NodeLabel = NodeLabel;
EChartsSankeyChart.Link = Link;
EChartsSankeyChart.Tooltip = Tooltip;

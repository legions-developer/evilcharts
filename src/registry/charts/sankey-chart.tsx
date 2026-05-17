"use client";

import {
  type ChartConfig,
  ChartContainer,
  getColorsCount,
  LoadingIndicator,
} from "@/registry/ui/chart";
import {
  ChartTooltip,
  ChartTooltipContent,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/registry/ui/tooltip";
import { ChartBackground, type BackgroundVariant } from "@/registry/ui/background";
import {
  Children,
  createContext,
  isValidElement,
  use,
  useCallback,
  useId,
  useMemo,
  useState,
  type FC,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Sankey as RechartsSankey,
  Layer,
  type SankeyProps,
  type SankeyNodeProps,
  type SankeyLinkProps,
  type SankeyData,
  type SankeyNode as RechartsSankeyNode,
} from "recharts";
import { motion } from "motion/react";

// Constants
const LOADING_ANIMATION_DURATION = 2000; // full loading cycle duration in milliseconds
const DEFAULT_NODE_WIDTH = 10;
const DEFAULT_NODE_PADDING = 10;
const DEFAULT_LINK_CURVATURE = 0.5;
const DEFAULT_ITERATIONS = 32;

type LinkVariant = "gradient" | "solid" | "source" | "target";
type NodeLabelPosition = "inside" | "outside";

// ─────────────────────────────────────────────────────────────────────────────
// Shared context
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shared state for every part of the chart. Lifted into <EvilSankeyChart /> so
 * that <Node />, <Link />, and <Tooltip /> can read it without prop drilling.
 * A sankey chart's data is rigid — the root passes `nodes`/`links` straight to
 * Recharts — so the parts here configure how those nodes and links render.
 */
type SankeyChartContextValue = {
  data: SankeyData; // the nodes + links rendered by the chart
  config: ChartConfig; // colors + labels keyed by node name
  chartId: string; // colon-free id scoping this chart's SVG defs
  isLoading: boolean; // whether the chart shows its loading skeleton
  selectedNode: string | null; // currently selected node name, or null when none
  selectNode: (nodeName: string | null) => void; // sets the selected node
};

const SankeyChartContext = createContext<SankeyChartContextValue | null>(null);

// Reads the chart context, throwing a helpful error when used outside <EvilSankeyChart />
function useSankeyChart() {
  const context = use(SankeyChartContext);

  if (!context) {
    throw new Error(
      "Sankey chart parts (<Node />, <Link />, <Tooltip />, …) must be used within <EvilSankeyChart />",
    );
  }

  return context;
}

// ─────────────────────────────────────────────────────────────────────────────
// Root container
// ─────────────────────────────────────────────────────────────────────────────

type EvilSankeyChartBaseProps = {
  data: SankeyData; // nodes + links rendered by the chart
  config: ChartConfig; // node colors + labels keyed by node name
  children: ReactNode; // composed parts — <Node />, <Link />, <Tooltip />, …
  className?: string; // extra classes for the chart container
  sankeyProps?: Omit<SankeyProps, "data">; // escape hatch for the raw Recharts Sankey
  nodeWidth?: number; // width of each node in pixels
  nodePadding?: number; // vertical gap between nodes in pixels
  linkCurvature?: number; // link curve amount, 0 (straight) to 1 (maximum)
  iterations?: number; // layout iterations — higher is more accurate
  sort?: boolean; // sorts nodes automatically for an optimal layout
  align?: "left" | "justify"; // horizontal node alignment strategy
  verticalAlign?: "justify" | "top"; // vertical node alignment strategy
  backgroundVariant?: BackgroundVariant; // background pattern behind the chart
  defaultSelectedNode?: string | null; // node selected on first render
  onSelectionChange?: (selection: { dataKey: string; value: number } | null) => void; // fires when the selected node changes
  isLoading?: boolean; // shows the animated loading skeleton
};

type EvilSankeyChartProps = EvilSankeyChartBaseProps;

/**
 * Root of the composible sankey chart. Owns the flow data, the shared context,
 * the layout configuration, and the loading skeleton. The visual parts — the
 * nodes, links, and tooltip — are composed as children, so a consumer renders
 * exactly the parts they need with the styling they want.
 */
export function EvilSankeyChart({
  data,
  config,
  children,
  className,
  sankeyProps,
  nodeWidth = DEFAULT_NODE_WIDTH,
  nodePadding = DEFAULT_NODE_PADDING,
  linkCurvature = DEFAULT_LINK_CURVATURE,
  iterations = DEFAULT_ITERATIONS,
  sort = true,
  align = "justify",
  verticalAlign = "justify",
  backgroundVariant,
  defaultSelectedNode = null,
  onSelectionChange,
  isLoading = false,
}: EvilSankeyChartProps) {
  const chartId = useId().replace(/:/g, ""); // colon-free id keeps CSS/SVG selectors valid
  const [selectedNode, setSelectedNode] = useState<string | null>(defaultSelectedNode);

  // Updates selection state and notifies the parent with the node's flow value
  const selectNode = useCallback(
    (nodeName: string | null) => {
      setSelectedNode(nodeName);

      if (!onSelectionChange) return;

      if (nodeName === null) {
        onSelectionChange(null);
        return;
      }

      onSelectionChange({ dataKey: nodeName, value: getNodeValue(data, nodeName) });
    },
    [onSelectionChange, data],
  );

  const contextValue = useMemo<SankeyChartContextValue>(
    () => ({ data, config, chartId, isLoading, selectedNode, selectNode }),
    [data, config, chartId, isLoading, selectedNode, selectNode],
  );

  return (
    <SankeyChartContext value={contextValue}>
      <ChartContainer className={className} config={config}>
        <LoadingIndicator isLoading={isLoading} />
        {backgroundVariant && <ChartBackground variant={backgroundVariant} />}
        {!isLoading && (
          <RechartsSankey
            id={chartId}
            data={data}
            nodeWidth={nodeWidth}
            nodePadding={nodePadding}
            linkCurvature={linkCurvature}
            iterations={iterations}
            sort={sort}
            align={align}
            verticalAlign={verticalAlign}
            {...resolveSankeyRenderers(children)}
            {...sankeyProps}
          >
            {children}
            <defs>
              <NodeColorGradients config={config} chartId={chartId} />
            </defs>
          </RechartsSankey>
        )}
        {isLoading && (
          <svg
            viewBox="0 0 500 250"
            preserveAspectRatio="xMidYMid meet"
            width="100%"
            height="100%"
            className="absolute inset-0"
          >
            <LoadingSankey />
          </svg>
        )}
      </ChartContainer>
    </SankeyChartContext>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Composible parts
// ─────────────────────────────────────────────────────────────────────────────

type NodeProps = {
  radius?: number; // corner radius of node rectangles in pixels
  isClickable?: boolean; // lets nodes be selected by clicking them
  glow?: string[]; // node names that get a soft outer glow
  children?: ReactNode; // optional <NodeLabel /> composition
};

/**
 * Configures how the sankey nodes render. It is a configuration slot — the root
 * reads its props and wires them into the Recharts Sankey `node` renderer, so it
 * renders nothing itself. Compose a <NodeLabel /> inside it to show labels.
 */
export const Node: FC<NodeProps> = () => null;

type NodeLabelProps = {
  position?: NodeLabelPosition; // places labels inside or beside the nodes
  showValues?: boolean; // appends each node's total flow value
  valueFormatter?: (value: number) => string; // formats node values when shown
};

/**
 * Declares labels for the <Node /> it is composed inside. Like <Node />, it is a
 * configuration slot and renders nothing on its own.
 */
export const NodeLabel: FC<NodeLabelProps> = () => null;

type LinkProps = {
  variant?: LinkVariant; // coloring strategy for the link bands
  verticalPadding?: number; // shrinks link width where it meets a node
  glow?: number[]; // link indices that get a soft outer glow
};

/**
 * Configures how the sankey links render. Like <Node />, it is a configuration
 * slot read by the root and renders nothing itself. The `variant` controls how
 * each link band is colored.
 */
export const Link: FC<LinkProps> = () => null;

type TooltipProps = {
  variant?: TooltipVariant; // visual style of the tooltip surface
  roundness?: TooltipRoundness; // border-radius of the tooltip
  defaultIndex?: number; // data index shown by default with no hover
};

/**
 * The hover tooltip. Reads the chart's loading state from context and is hidden
 * automatically while the chart shows its skeleton.
 */
export function Tooltip({ variant, roundness, defaultIndex }: TooltipProps) {
  const { isLoading } = useSankeyChart();

  if (isLoading) return null;

  return (
    <ChartTooltip
      defaultIndex={defaultIndex}
      content={
        <ChartTooltipContent nameKey="name" hideLabel roundness={roundness} variant={variant} />
      }
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Children resolution — turns composed <Node />/<Link /> into Sankey renderers
// ─────────────────────────────────────────────────────────────────────────────

// Sums a node's outgoing flow, falling back to incoming flow for leaf nodes
const getNodeValue = (data: SankeyData, nodeName: string): number => {
  const nodeIndex = data.nodes.findIndex((node) => node.name === nodeName);
  if (nodeIndex === -1) return 0;

  const outgoing = data.links
    .filter((link) => link.source === nodeIndex)
    .reduce((sum, link) => sum + link.value, 0);
  const incoming = data.links
    .filter((link) => link.target === nodeIndex)
    .reduce((sum, link) => sum + link.value, 0);

  return outgoing > 0 ? outgoing : incoming;
};

// Reads composed <Node /> and <Link /> children into the Sankey `node`/`link` render props
const resolveSankeyRenderers = (
  children: ReactNode,
): Pick<SankeyProps, "node" | "link"> => {
  let nodeProps: NodeProps | null = null;
  let linkProps: LinkProps | null = null;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    if (child.type === Node) {
      nodeProps = (child as ReactElement<NodeProps>).props;
    }

    if (child.type === Link) {
      linkProps = (child as ReactElement<LinkProps>).props;
    }
  });

  return {
    node: (props: SankeyNodeProps) => <SankeyNode {...props} nodeConfig={nodeProps} />,
    link: (props: SankeyLinkProps) => <SankeyLink {...props} linkConfig={linkProps} />,
  };
};

// Reads the <NodeLabel /> composed inside a <Node />, if any
const resolveNodeLabel = (children: ReactNode): NodeLabelProps | null => {
  let label: NodeLabelProps | null = null;

  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === NodeLabel) {
      label = (child as ReactElement<NodeLabelProps>).props;
    }
  });

  return label;
};

// ─────────────────────────────────────────────────────────────────────────────
// Node renderer — draws a single sankey node from the resolved <Node /> config
// ─────────────────────────────────────────────────────────────────────────────

type SankeyNodeRendererProps = SankeyNodeProps & {
  nodeConfig: NodeProps | null; // resolved props from the composed <Node />
};

/**
 * Renders a single sankey node rectangle, plus its optional label and value.
 * The root passes one of these per node, configured from the composed <Node />.
 */
const SankeyNode = ({ x, y, width, height, payload, nodeConfig }: SankeyNodeRendererProps) => {
  const { config, chartId, data, selectedNode, selectNode } = useSankeyChart();

  const radius = nodeConfig?.radius ?? 0;
  const isClickable = nodeConfig?.isClickable ?? false;
  const glow = nodeConfig?.glow ?? [];
  const label = resolveNodeLabel(nodeConfig?.children);

  const nodeName = payload.name;
  const nodeValue = payload.value;
  const nodeIcon = (payload as RechartsSankeyNode & { icon?: ReactNode }).icon;

  const isHighlighted = isNodeConnected(data, selectedNode, nodeName);
  const isGlowing = glow.includes(nodeName);
  const hasConfigColor = nodeName in config;
  const configLabel = config[nodeName]?.label ?? nodeName;
  const dimmed = isClickable && !isHighlighted;

  const valueFormatter = label?.valueFormatter ?? ((value: number) => value.toLocaleString());
  const showValues = label?.showValues ?? false;

  const labelX = x + width / 2;
  const labelY = showValues ? y + height / 2 - 8 : y + height / 2;
  const valueY = y + height / 2 + 8;
  const outsideLabelX = x + width + 8;
  const outsideLabelY = y + height / 2;

  return (
    <Layer>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={radius}
        ry={radius}
        fill={hasConfigColor ? `url(#${chartId}-sankey-colors-${nodeName})` : "currentColor"}
        fillOpacity={dimmed ? 0.3 : 0.9}
        filter={isGlowing ? `url(#${chartId}-node-glow-${nodeName})` : undefined}
        className="transition-opacity duration-200"
        style={isClickable ? { cursor: "pointer" } : undefined}
        onClick={() => {
          if (!isClickable) return;
          selectNode(selectedNode === nodeName ? null : nodeName);
        }}
      />
      {isGlowing && (
        <defs>
          <GlowFilter chartId={chartId} name={nodeName} type="node" />
        </defs>
      )}
      {label?.position === "inside" && (
        <>
          <rect
            x={x + 1}
            y={y + 1}
            width={width - 2}
            height={height - 2}
            rx={Math.max(0, radius - 1)}
            ry={Math.max(0, radius - 1)}
            opacity={dimmed ? 0.3 : 1}
            className="fill-white/50 transition-opacity duration-200 dark:fill-black/60"
            style={{ pointerEvents: "none" }}
          />
          {nodeIcon && (
            <foreignObject
              x={labelX - 8}
              y={labelY - 30}
              width={16}
              height={16}
              opacity={dimmed ? 0.3 : 1}
              className="transition-opacity duration-200"
              style={{ pointerEvents: "none" }}
            >
              <div className="text-foreground/80 flex items-center justify-center dark:text-white/80">
                {nodeIcon}
              </div>
            </foreignObject>
          )}
          <text
            x={labelX}
            y={nodeIcon ? labelY - 4 : labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-[10px] font-medium transition-opacity duration-200 dark:fill-white"
            opacity={dimmed ? 0.3 : 1}
            style={{ pointerEvents: "none" }}
          >
            {configLabel}
          </text>
          {showValues && (
            <text
              x={labelX}
              y={valueY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground/60 font-mono text-xs font-medium tabular-nums transition-opacity duration-200 dark:fill-white"
              opacity={dimmed ? 0.3 : 0.6}
              style={{ pointerEvents: "none" }}
            >
              {valueFormatter(nodeValue)}
            </text>
          )}
        </>
      )}
      {label?.position === "outside" && (
        <>
          <text
            x={outsideLabelX}
            y={outsideLabelY - (showValues ? 8 : 0)}
            textAnchor="start"
            dominantBaseline="middle"
            className="fill-foreground text-xs"
            style={{ pointerEvents: "none" }}
          >
            {configLabel}
          </text>
          {showValues && (
            <text
              x={outsideLabelX}
              y={outsideLabelY + 8}
              textAnchor="start"
              dominantBaseline="middle"
              opacity={0.5}
              className="fill-foreground font-mono text-xs tabular-nums dark:fill-white"
              style={{ pointerEvents: "none" }}
            >
              {valueFormatter(nodeValue)}
            </text>
          )}
        </>
      )}
    </Layer>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Link renderer — draws a single sankey link from the resolved <Link /> config
// ─────────────────────────────────────────────────────────────────────────────

type SankeyLinkRendererProps = SankeyLinkProps & {
  linkConfig: LinkProps | null; // resolved props from the composed <Link />
};

/**
 * Renders a single sankey link band, colored by the composed <Link /> variant.
 * Highlights the bands connected to the selected node and dims the rest.
 */
const SankeyLink = ({
  sourceX,
  targetX,
  sourceY,
  targetY,
  sourceControlX,
  targetControlX,
  linkWidth,
  index,
  payload,
  linkConfig,
}: SankeyLinkRendererProps) => {
  const { config, chartId, selectedNode } = useSankeyChart();

  const variant = linkConfig?.variant ?? "gradient";
  const verticalPadding = linkConfig?.verticalPadding ?? 0;
  const glow = linkConfig?.glow ?? [];

  const sourceName = payload.source.name;
  const targetName = payload.target.name;

  const isConnected =
    selectedNode === null || selectedNode === sourceName || selectedNode === targetName;
  const isGlowing = glow.includes(index);

  const paddedLinkWidth = Math.max(1, linkWidth - verticalPadding);
  const halfWidth = paddedLinkWidth / 2;

  const linkAreaPath = `M${sourceX},${sourceY - halfWidth}
    C${sourceControlX},${sourceY - halfWidth} ${targetControlX},${targetY - halfWidth} ${targetX},${targetY - halfWidth}
    L${targetX},${targetY + halfWidth}
    C${targetControlX},${targetY + halfWidth} ${sourceControlX},${sourceY + halfWidth} ${sourceX},${sourceY + halfWidth}
    Z`;

  return (
    <Layer>
      <defs>
        {variant === "gradient" && (
          <LinkGradient
            chartId={chartId}
            index={index}
            config={config}
            sourceName={sourceName}
            targetName={targetName}
          />
        )}
        <LinkStrokeGradient chartId={chartId} index={index} />
        {isGlowing && <GlowFilter chartId={chartId} name={String(index)} type="link" />}
      </defs>
      <path
        d={linkAreaPath}
        fill={getLinkFill(variant, chartId, index, config, sourceName, targetName)}
        fillOpacity={isConnected ? 0.4 : 0.1}
        stroke={
          selectedNode !== null && isConnected ? `url(#${chartId}-link-stroke-${index})` : "none"
        }
        strokeWidth={1}
        strokeOpacity={0.3}
        filter={isGlowing ? `url(#${chartId}-link-glow-${index})` : undefined}
        className="transition-opacity duration-200"
      />
    </Layer>
  );
};

// Checks whether a node is the selected one or directly linked to it
const isNodeConnected = (
  data: SankeyData,
  selectedNode: string | null,
  nodeName: string,
): boolean => {
  if (selectedNode === null || selectedNode === nodeName) return true;

  const selectedIdx = data.nodes.findIndex((node) => node.name === selectedNode);
  const nodeIdx = data.nodes.findIndex((node) => node.name === nodeName);

  return data.links.some(
    (link) =>
      (link.source === selectedIdx && link.target === nodeIdx) ||
      (link.source === nodeIdx && link.target === selectedIdx),
  );
};

// Resolves the SVG paint reference for a link band based on its variant
const getLinkFill = (
  variant: LinkVariant,
  chartId: string,
  index: number,
  config: ChartConfig,
  sourceName: string,
  targetName: string,
): string => {
  switch (variant) {
    case "gradient":
      return `url(#${chartId}-link-gradient-${index})`;
    case "source":
      return sourceName in config ? `url(#${chartId}-sankey-colors-${sourceName})` : "currentColor";
    case "target":
      return targetName in config ? `url(#${chartId}-sankey-colors-${targetName})` : "currentColor";
    case "solid":
    default:
      return "currentColor";
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Style definitions — SVG defs scoped to the chart's unique id
// ─────────────────────────────────────────────────────────────────────────────

/** Vertical color gradient for every configured node, painted by name. */
const NodeColorGradients = ({
  config,
  chartId,
}: {
  config: ChartConfig;
  chartId: string;
}) => {
  return (
    <>
      {Object.entries(config).map(([dataKey, nodeConfig]) => {
        const colorsCount = getColorsCount(nodeConfig);

        return (
          <linearGradient
            key={`${chartId}-sankey-colors-${dataKey}`}
            id={`${chartId}-sankey-colors-${dataKey}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            {colorsCount === 1 ? (
              <>
                <stop offset="0%" stopColor={`var(--color-${dataKey}-0)`} />
                <stop offset="100%" stopColor={`var(--color-${dataKey}-0)`} />
              </>
            ) : (
              Array.from({ length: colorsCount }, (_, index) => {
                const offset = `${(index / (colorsCount - 1)) * 100}%`;
                return (
                  <stop
                    key={offset}
                    offset={offset}
                    stopColor={`var(--color-${dataKey}-${index}, var(--color-${dataKey}-0))`}
                  />
                );
              })
            )}
          </linearGradient>
        );
      })}
    </>
  );
};

/** Source-to-target fade gradient that fills a single gradient-variant link. */
const LinkGradient = ({
  chartId,
  index,
  config,
  sourceName,
  targetName,
}: {
  chartId: string;
  index: number;
  config: ChartConfig;
  sourceName: string;
  targetName: string;
}) => {
  const sourceColor = sourceName in config ? `var(--color-${sourceName}-0)` : "currentColor";
  const targetColor = targetName in config ? `var(--color-${targetName}-0)` : "currentColor";

  return (
    <linearGradient id={`${chartId}-link-gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor={sourceColor} stopOpacity={0.2} />
      <stop offset="50%" stopColor={sourceColor} stopOpacity={0.5} />
      <stop offset="100%" stopColor={targetColor} stopOpacity={0.2} />
    </linearGradient>
  );
};

/** Primary-colored stroke gradient highlighting a link connected to the selection. */
const LinkStrokeGradient = ({ chartId, index }: { chartId: string; index: number }) => {
  return (
    <linearGradient id={`${chartId}-link-stroke-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0} />
      <stop offset="15%" stopColor="var(--primary)" stopOpacity={0.8} />
      <stop offset="50%" stopColor="var(--primary)" stopOpacity={1} />
      <stop offset="85%" stopColor="var(--primary)" stopOpacity={0.8} />
      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
    </linearGradient>
  );
};

/** Soft outer-glow SVG filter applied to a glowing node or link. */
const GlowFilter = ({
  chartId,
  name,
  type,
}: {
  chartId: string;
  name: string;
  type: "node" | "link";
}) => {
  return (
    <filter
      id={`${chartId}-${type}-glow-${name}`}
      x="-200%"
      y="-200%"
      width="400%"
      height="400%"
    >
      <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
      <feColorMatrix
        in="blur"
        type="matrix"
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.6 0"
        result="glow"
      />
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The skeleton sankey shown while the chart is loading. Rendered by the root in
 * place of the real diagram — a fixed grid of pulsing nodes and links.
 */
const LoadingSankey = () => {
  const nodes = [
    { x: 30, y: 25, width: 12, height: 65, delay: 0 },
    { x: 30, y: 110, width: 12, height: 50, delay: 0.3 },
    { x: 30, y: 180, width: 12, height: 45, delay: 0.15 },
    { x: 244, y: 20, width: 12, height: 55, delay: 0.45 },
    { x: 244, y: 95, width: 12, height: 75, delay: 0.6 },
    { x: 244, y: 190, width: 12, height: 40, delay: 0.25 },
    { x: 458, y: 35, width: 12, height: 80, delay: 0.5 },
    { x: 458, y: 135, width: 12, height: 90, delay: 0.1 },
  ];

  const links = [
    { from: 0, to: 3, width: 26, delay: 0.2 },
    { from: 0, to: 4, width: 18, delay: 0.7 },
    { from: 1, to: 4, width: 24, delay: 0.4 },
    { from: 1, to: 5, width: 12, delay: 0.9 },
    { from: 2, to: 4, width: 16, delay: 0.1 },
    { from: 2, to: 5, width: 14, delay: 0.55 },
    { from: 3, to: 6, width: 22, delay: 0.35 },
    { from: 3, to: 7, width: 18, delay: 0.8 },
    { from: 4, to: 6, width: 28, delay: 0.05 },
    { from: 4, to: 7, width: 32, delay: 0.65 },
    { from: 5, to: 7, width: 16, delay: 0.45 },
  ];

  // Builds a bezier path connecting the right edge of one node to the left of another
  const getLinkPath = (fromIdx: number, toIdx: number) => {
    const from = nodes[fromIdx];
    const to = nodes[toIdx];
    const startX = from.x + from.width;
    const startY = from.y + from.height / 2;
    const endX = to.x;
    const endY = to.y + to.height / 2;
    const controlX1 = startX + (endX - startX) * 0.4;
    const controlX2 = startX + (endX - startX) * 0.6;
    return `M${startX},${startY} C${controlX1},${startY} ${controlX2},${endY} ${endX},${endY}`;
  };

  const baseDuration = LOADING_ANIMATION_DURATION / 1000;

  return (
    <>
      {links.map((link, i) => (
        <motion.path
          key={`loading-link-${link.from}-${link.to}`}
          d={getLinkPath(link.from, link.to)}
          fill="none"
          stroke="currentColor"
          strokeWidth={link.width}
          initial={{ opacity: 0.04 }}
          animate={{ opacity: [0.04, 0.14, 0.04] }}
          transition={{
            duration: baseDuration * (0.8 + (i % 3) * 0.2),
            delay: link.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      {nodes.map((node, i) => (
        <motion.rect
          key={`loading-node-${node.x}-${node.y}`}
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          rx={2}
          fill="currentColor"
          initial={{ opacity: 0.15 }}
          animate={{ opacity: [0.15, 0.4, 0.15] }}
          transition={{
            duration: baseDuration * (0.9 + (i % 4) * 0.1),
            delay: node.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
};

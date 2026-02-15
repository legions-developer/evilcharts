"use client";

import {
  ChartTooltip,
  ChartTooltipContent,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/registry/ui/tooltip";
import {
  type ChartConfig,
  ChartContainer,
  getColorsCount,
  LoadingIndicator,
} from "@/registry/ui/chart";
import type {
  SankeyProps,
  SankeyNodeProps,
  SankeyLinkProps,
  SankeyData,
  SankeyNode,
} from "recharts";
import { ChartBackground, type BackgroundVariant } from "@/registry/ui/background";
import { useCallback, useId, useState, type ReactNode } from "react";
import { Sankey, Layer } from "recharts";
import { motion } from "motion/react";

// Loading animation constants
const LOADING_ANIMATION_DURATION = 2000; // Full cycle duration in ms

// Constants
const DEFAULT_NODE_WIDTH = 10;
const DEFAULT_NODE_PADDING = 10;
const DEFAULT_LINK_CURVATURE = 0.5;
const DEFAULT_ITERATIONS = 32;

type LinkVariant = "gradient" | "solid" | "source" | "target";

// Node label position type
type NodeLabelPosition = "inside" | "outside" | "none";

type EvilSankeyChartProps = {
  // Data
  data: SankeyData;
  chartConfig: ChartConfig;
  className?: string;
  sankeyProps?: Omit<SankeyProps, "data">;

  // Layout
  nodeWidth?: number;
  nodePadding?: number;
  linkCurvature?: number;
  iterations?: number;
  sort?: boolean;
  align?: "left" | "justify";
  verticalAlign?: "justify" | "top";

  // Styling
  linkVariant?: LinkVariant;
  nodeRadius?: number;
  linkVerticalPadding?: number;

  // Node Labels
  showNodeLabels?: NodeLabelPosition;
  showNodeValues?: boolean;
  nodeValueFormatter?: (value: number) => string;

  // Hide Stuffs
  hideTooltip?: boolean;
  // Tooltip
  tooltipRoundness?: TooltipRoundness;
  tooltipVariant?: TooltipVariant;
  tooltipDefaultIndex?: number;

  // Interactive Stuffs
  isLoading?: boolean;

  // Glow Effects
  glowingNodes?: string[];
  glowingLinks?: number[];
  // Background
  backgroundVariant?: BackgroundVariant;
};

type EvilSankeyChartClickable = {
  isClickable: true;
  onSelectionChange?: (selection: { dataKey: string; value: number } | null) => void;
};

type EvilSankeyChartNotClickable = {
  isClickable?: false;
  onSelectionChange?: never;
};

type EvilSankeyChartPropsWithCallback = EvilSankeyChartProps &
  (EvilSankeyChartClickable | EvilSankeyChartNotClickable);

export function EvilSankeyChart({
  data,
  chartConfig,
  className,
  sankeyProps,
  nodeWidth = DEFAULT_NODE_WIDTH,
  nodePadding = DEFAULT_NODE_PADDING,
  linkCurvature = DEFAULT_LINK_CURVATURE,
  iterations = DEFAULT_ITERATIONS,
  sort = true,
  align = "justify",
  verticalAlign = "justify",
  linkVariant = "gradient",
  nodeRadius = 0,
  linkVerticalPadding = 0,
  showNodeLabels = "none",
  showNodeValues = false,
  nodeValueFormatter = (value: number) => value.toLocaleString(),
  hideTooltip = false,
  tooltipRoundness,
  tooltipVariant,
  tooltipDefaultIndex,
  isClickable = false,
  isLoading = false,
  glowingNodes = [],
  glowingLinks = [],
  onSelectionChange,
  backgroundVariant,
}: EvilSankeyChartPropsWithCallback) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const chartId = useId().replace(/:/g, "");

  // Handler to update selection and call callback
  const handleNodeClick = useCallback(
    (nodeName: string | null) => {
      setSelectedNode(nodeName);
      if (isClickable && onSelectionChange) {
        if (nodeName === null) {
          onSelectionChange(null);
        } else {
          // Calculate node value: sum of all outgoing links (or incoming if no outgoing)
          const nodeIndex = data.nodes.findIndex((node) => node.name === nodeName);
          if (nodeIndex !== -1) {
            // Sum of outgoing links
            const outgoingValue = data.links
              .filter((link) => link.source === nodeIndex)
              .reduce((sum, link) => sum + link.value, 0);
            // Sum of incoming links (if no outgoing)
            const incomingValue = data.links
              .filter((link) => link.target === nodeIndex)
              .reduce((sum, link) => sum + link.value, 0);
            // Use outgoing value if available, otherwise incoming
            const value = outgoingValue > 0 ? outgoingValue : incomingValue;
            onSelectionChange({ dataKey: nodeName, value });
          }
        }
      }
    },
    [isClickable, onSelectionChange, data],
  );

  return (
    <ChartContainer className={className} config={chartConfig}>
      <LoadingIndicator isLoading={isLoading} />
      {backgroundVariant && <ChartBackground variant={backgroundVariant} />}
      {!isLoading && (
        <Sankey
          id="evil-charts-sankey-chart"
          data={data}
          nodeWidth={nodeWidth}
          nodePadding={nodePadding}
          linkCurvature={linkCurvature}
          iterations={iterations}
          sort={sort}
          align={align}
          verticalAlign={verticalAlign}
          node={(props: SankeyNodeProps) => (
            <CustomNode
              {...props}
              chartId={chartId}
              chartConfig={chartConfig}
              data={data}
              selectedNode={selectedNode}
              isClickable={isClickable}
              nodeRadius={nodeRadius}
              showNodeLabels={showNodeLabels}
              showNodeValues={showNodeValues}
              nodeValueFormatter={nodeValueFormatter}
              glowingNodes={glowingNodes}
              onNodeClick={(name: string) => {
                if (!isClickable) return;
                handleNodeClick(selectedNode === name ? null : name);
              }}
            />
          )}
          link={(props: SankeyLinkProps) => (
            <CustomLink
              {...props}
              chartId={chartId}
              chartConfig={chartConfig}
              selectedNode={selectedNode}
              linkVariant={linkVariant}
              linkVerticalPadding={linkVerticalPadding}
              glowingLinks={glowingLinks}
            />
          )}
          {...sankeyProps}
        >
          {!hideTooltip && (
            <ChartTooltip
              defaultIndex={tooltipDefaultIndex}
              content={
                <ChartTooltipContent
                  nameKey="name"
                  hideLabel
                  roundness={tooltipRoundness}
                  variant={tooltipVariant}
                />
              }
            />
          )}
          {/* ======== CHART STYLES ======== */}
          <defs>
            {/* Color gradients for nodes */}
            <NodeColorGradientStyle chartConfig={chartConfig} chartId={chartId} />

            {/* Glow filters for nodes */}
            {glowingNodes.length > 0 && (
              <GlowFilterStyle chartId={chartId} glowingNodes={glowingNodes} type="node" />
            )}

            {/* Glow filters for links */}
            {glowingLinks.length > 0 && (
              <GlowFilterStyle
                chartId={chartId}
                glowingNodes={glowingLinks.map(String)}
                type="link"
              />
            )}
          </defs>
        </Sankey>
      )}

      {/* Loading state */}
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
  );
}

// Custom node component with labels, icons, and glow effects
type CustomNodeProps = SankeyNodeProps & {
  chartId: string;
  chartConfig: ChartConfig;
  data: SankeyData;
  selectedNode: string | null;
  isClickable: boolean;
  nodeRadius: number;
  showNodeLabels: NodeLabelPosition;
  showNodeValues: boolean;
  nodeValueFormatter: (value: number) => string;
  glowingNodes: string[];
  onNodeClick: (name: string) => void;
};

const CustomNode = ({
  x,
  y,
  width,
  height,
  payload,
  chartId,
  chartConfig,
  data,
  selectedNode,
  isClickable,
  nodeRadius,
  showNodeLabels,
  showNodeValues,
  nodeValueFormatter,
  glowingNodes,
  onNodeClick,
}: CustomNodeProps) => {
  const nodeName = payload.name;
  const nodeValue = payload.value;
  const nodeIcon = (payload as SankeyNode & { icon?: ReactNode }).icon;

  // Check if this node is the selected one, or connected to the selected one via a link
  const isConnectedToSelected = (() => {
    if (selectedNode === null) return true;
    if (selectedNode === nodeName) return true;
    const selectedIdx = data.nodes.findIndex((n) => n.name === selectedNode);
    const thisIdx = data.nodes.findIndex((n) => n.name === nodeName);
    return data.links.some(
      (link) =>
        (link.source === selectedIdx && link.target === thisIdx) ||
        (link.source === thisIdx && link.target === selectedIdx),
    );
  })();
  const isSelected = isConnectedToSelected;
  const isGlowing = glowingNodes.includes(nodeName);

  const hasConfigColor = nodeName in chartConfig;
  const configLabel = chartConfig[nodeName]?.label ?? nodeName;

  const getFilter = () => {
    if (isGlowing) return `url(#${chartId}-node-glow-${nodeName})`;
    return undefined;
  };

  // Calculate positions for inside labels
  const labelX = x + width / 2;
  const labelY = showNodeValues ? y + height / 2 - 8 : y + height / 2;
  const valueY = y + height / 2 + 8;

  // Calculate positions for outside labels (to the right of the node)
  const outsideLabelX = x + width + 8;
  const outsideLabelY = y + height / 2;

  return (
    <Layer>
      {/* Main node rectangle - using native rect for proper rx/ry support */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={nodeRadius}
        ry={nodeRadius}
        fill={hasConfigColor ? `url(#${chartId}-sankey-colors-${nodeName})` : "currentColor"}
        fillOpacity={isClickable && !isSelected ? 0.3 : 0.9}
        filter={getFilter()}
        className="transition-opacity duration-200"
        style={isClickable ? { cursor: "pointer" } : undefined}
        onClick={() => onNodeClick(nodeName)}
      />

      {/* Inside labels */}
      {showNodeLabels === "inside" && (
        <>
          {/* Background overlay for label readability */}
          <rect
            x={x + 1}
            y={y + 1}
            width={width - 2}
            height={height - 2}
            rx={Math.max(0, nodeRadius - 1)}
            ry={Math.max(0, nodeRadius - 1)}
            opacity={isClickable && !isSelected ? 0.3 : 1}
            className="fill-white/50 transition-opacity duration-200 dark:fill-black/60"
            style={{ pointerEvents: "none" }}
          />

          {/* Icon if provided */}
          {nodeIcon && (
            <foreignObject
              x={labelX - 8}
              y={labelY - 30}
              width={16}
              height={16}
              opacity={isClickable && !isSelected ? 0.3 : 1}
              className="transition-opacity duration-200"
              style={{ pointerEvents: "none" }}
            >
              <div className="text-foreground/80 flex items-center justify-center dark:text-white/80">
                {nodeIcon}
              </div>
            </foreignObject>
          )}

          {/* Label text */}
          <text
            x={labelX}
            y={nodeIcon ? labelY - 4 : labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-[10px] font-medium transition-opacity duration-200 dark:fill-white"
            opacity={isClickable && !isSelected ? 0.3 : 1}
            style={{ pointerEvents: "none" }}
          >
            {configLabel}
          </text>

          {/* Value text */}
          {showNodeValues && (
            <text
              x={labelX}
              y={valueY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground/60 font-mono text-xs font-medium tabular-nums transition-opacity duration-200 dark:fill-white"
              opacity={isClickable && !isSelected ? 0.3 : 0.6}
              style={{ pointerEvents: "none" }}
            >
              {nodeValueFormatter(nodeValue)}
            </text>
          )}
        </>
      )}

      {/* Outside labels (to the side of nodes) */}
      {showNodeLabels === "outside" && (
        <>
          <text
            x={outsideLabelX}
            y={outsideLabelY - (showNodeValues ? 8 : 0)}
            textAnchor="start"
            dominantBaseline="middle"
            className="fill-foreground text-xs"
            style={{ pointerEvents: "none" }}
          >
            {configLabel}
          </text>

          {showNodeValues && (
            <text
              x={outsideLabelX}
              y={outsideLabelY + 8}
              textAnchor="start"
              dominantBaseline="middle"
              opacity={0.5}
              className="fill-foreground font-mono text-xs tabular-nums dark:fill-white"
              style={{ pointerEvents: "none" }}
            >
              {nodeValueFormatter(nodeValue)}
            </text>
          )}
        </>
      )}
    </Layer>
  );
};

// Custom link component with gradient variants and connection highlighting
type CustomLinkProps = SankeyLinkProps & {
  chartId: string;
  chartConfig: ChartConfig;
  selectedNode: string | null;
  linkVariant: LinkVariant;
  linkVerticalPadding: number;
  glowingLinks: number[];
};

const CustomLink = ({
  sourceX,
  targetX,
  sourceY,
  targetY,
  sourceControlX,
  targetControlX,
  linkWidth,
  index,
  payload,
  chartId,
  chartConfig,
  selectedNode,
  linkVariant,
  linkVerticalPadding,
  glowingLinks,
}: CustomLinkProps) => {
  const sourceName = payload.source.name;
  const targetName = payload.target.name;

  // Check if either source or target is selected
  const isConnected =
    selectedNode === null || selectedNode === sourceName || selectedNode === targetName;

  const isGlowing = glowingLinks.includes(index);

  const getFilter = () => {
    if (isGlowing) return `url(#${chartId}-link-glow-${index})`;
    return undefined;
  };

  // Calculate link fill based on variant
  const getLinkFill = () => {
    const hasSourceColor = sourceName in chartConfig;
    const hasTargetColor = targetName in chartConfig;

    switch (linkVariant) {
      case "gradient":
        // Create a unique gradient for this link
        return `url(#${chartId}-link-gradient-${index})`;
      case "source":
        return hasSourceColor ? `url(#${chartId}-sankey-colors-${sourceName})` : "currentColor";
      case "target":
        return hasTargetColor ? `url(#${chartId}-sankey-colors-${targetName})` : "currentColor";
      case "solid":
      default:
        return "currentColor";
    }
  };

  // Apply vertical padding to the link width (reduces stroke width to create padding effect)
  const paddedLinkWidth = Math.max(1, linkWidth - linkVerticalPadding);
  const halfWidth = paddedLinkWidth / 2;

  // Build a closed area path for the link band (top edge forward, bottom edge backward)
  const linkAreaPath = `M${sourceX},${sourceY - halfWidth}
    C${sourceControlX},${sourceY - halfWidth} ${targetControlX},${targetY - halfWidth} ${targetX},${targetY - halfWidth}
    L${targetX},${targetY + halfWidth}
    C${targetControlX},${targetY + halfWidth} ${sourceControlX},${sourceY + halfWidth} ${sourceX},${sourceY + halfWidth}
    Z`;

  return (
    <Layer>
      {/* Define gradient for this specific link if using gradient variant */}
      <defs>
        {/* Gradient fill for links */}
        {linkVariant === "gradient" && (
          <linearGradient
            id={`${chartId}-link-gradient-${index}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop
              offset="0%"
              stopColor={
                sourceName in chartConfig ? `var(--color-${sourceName}-0)` : "currentColor"
              }
              stopOpacity={0.2}
            />
            <stop
              offset="50%"
              stopColor={
                sourceName in chartConfig ? `var(--color-${sourceName}-0)` : "currentColor"
              }
              stopOpacity={0.5}
            />
            <stop
              offset="100%"
              stopColor={
                targetName in chartConfig ? `var(--color-${targetName}-0)` : "currentColor"
              }
              stopOpacity={0.2}
            />
          </linearGradient>
        )}
        <linearGradient id={`${chartId}-link-stroke-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0} />
          <stop offset="15%" stopColor="var(--primary)" stopOpacity={0.8} />
          <stop offset="50%" stopColor="var(--primary)" stopOpacity={1} />
          <stop offset="85%" stopColor="var(--primary)" stopOpacity={0.8} />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
        </linearGradient>
      </defs>

      <path
        d={linkAreaPath}
        fill={getLinkFill()}
        fillOpacity={isConnected ? 0.4 : 0.1}
        stroke={
          selectedNode !== null && isConnected ? `url(#${chartId}-link-stroke-${index})` : "none"
        }
        strokeWidth={1}
        strokeOpacity={0.3}
        filter={getFilter()}
        className="transition-opacity duration-200"
      />
    </Layer>
  );
};

// Animated skeleton loading state with nodes and links
const LoadingSankey = () => {
  // Full-width loading skeleton with 3 columns of nodes (with padding from edges)
  const nodes = [
    // Column 1 (left side with padding)
    { x: 30, y: 25, width: 12, height: 65, delay: 0 },
    { x: 30, y: 110, width: 12, height: 50, delay: 0.3 },
    { x: 30, y: 180, width: 12, height: 45, delay: 0.15 },
    // Column 2 (center)
    { x: 244, y: 20, width: 12, height: 55, delay: 0.45 },
    { x: 244, y: 95, width: 12, height: 75, delay: 0.6 },
    { x: 244, y: 190, width: 12, height: 40, delay: 0.25 },
    // Column 3 (right side with padding)
    { x: 458, y: 35, width: 12, height: 80, delay: 0.5 },
    { x: 458, y: 135, width: 12, height: 90, delay: 0.1 },
  ];

  // Links with unique delays for varied animation timing
  const links = [
    // Column 1 -> Column 2
    { from: 0, to: 3, width: 26, delay: 0.2 },
    { from: 0, to: 4, width: 18, delay: 0.7 },
    { from: 1, to: 4, width: 24, delay: 0.4 },
    { from: 1, to: 5, width: 12, delay: 0.9 },
    { from: 2, to: 4, width: 16, delay: 0.1 },
    { from: 2, to: 5, width: 14, delay: 0.55 },
    // Column 2 -> Column 3
    { from: 3, to: 6, width: 22, delay: 0.35 },
    { from: 3, to: 7, width: 18, delay: 0.8 },
    { from: 4, to: 6, width: 28, delay: 0.05 },
    { from: 4, to: 7, width: 32, delay: 0.65 },
    { from: 5, to: 7, width: 16, delay: 0.45 },
  ];

  // Generate bezier path between two nodes
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
      {/* Loading links */}
      {links.map((link, i) => (
        <motion.path
          key={`loading-link-${i}`}
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

      {/* Loading nodes */}
      {nodes.map((node, i) => (
        <motion.rect
          key={`loading-node-${i}`}
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

// Create vertical color gradient for sankey nodes
const NodeColorGradientStyle = ({
  chartConfig,
  chartId,
}: {
  chartConfig: ChartConfig;
  chartId: string;
}) => {
  return (
    <>
      {Object.entries(chartConfig).map(([dataKey, config]) => {
        const colorsCount = getColorsCount(config);

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
              Array.from({ length: colorsCount }, (_, index) => (
                <stop
                  key={index}
                  offset={`${(index / (colorsCount - 1)) * 100}%`}
                  stopColor={`var(--color-${dataKey}-${index}, var(--color-${dataKey}-0))`}
                />
              ))
            )}
          </linearGradient>
        );
      })}
    </>
  );
};

// Apply soft glow filter effect to nodes or links using SVG filters
const GlowFilterStyle = ({
  chartId,
  glowingNodes,
  type,
}: {
  chartId: string;
  glowingNodes: string[];
  type: "node" | "link";
}) => {
  return (
    <>
      {glowingNodes.map((nodeName) => (
        <filter
          key={`${chartId}-${type}-glow-${nodeName}`}
          id={`${chartId}-${type}-glow-${nodeName}`}
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
      ))}
    </>
  );
};

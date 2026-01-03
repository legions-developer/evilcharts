"use client";

import {
  type ChartConfig,
  ChartContainer,
  getColorsCount,
  LoadingIndicator,
} from "@/registry/ui/chart";
import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { Sankey, Layer, Tooltip } from "recharts";
import { motion } from "motion/react";

// Loading animation constants
const LOADING_ANIMATION_DURATION = 2000; // Full cycle duration in ms

// Constants
const DEFAULT_NODE_WIDTH = 10;
const DEFAULT_NODE_PADDING = 10;
const DEFAULT_LINK_CURVATURE = 0.5;
const DEFAULT_ITERATIONS = 32;

type SankeyProps = ComponentProps<typeof Sankey>;

// Sankey node data structure
export type SankeyNode = {
  name: string;
  icon?: ReactNode;
};

// Sankey link data structure
export type SankeyLink = {
  source: number;
  target: number;
  value: number;
};

// Sankey data structure
export type SankeyData = {
  nodes: SankeyNode[];
  links: SankeyLink[];
};

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

  // Interactive Stuffs
  isClickable?: boolean;
  isLoading?: boolean;

  // Glow Effects
  glowingNodes?: string[];
  neonNodes?: string[];
  glowingLinks?: number[];
  neonLinks?: number[];
};

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
  isClickable = false,
  isLoading = false,
  glowingNodes = [],
  neonNodes = [],
  glowingLinks = [],
  neonLinks = [],
}: EvilSankeyChartProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const chartId = useId().replace(/:/g, "");

  return (
    <ChartContainer className={className} config={chartConfig}>
      <LoadingIndicator isLoading={isLoading} />
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
              selectedNode={selectedNode}
              isClickable={isClickable}
              nodeRadius={nodeRadius}
              showNodeLabels={showNodeLabels}
              showNodeValues={showNodeValues}
              nodeValueFormatter={nodeValueFormatter}
              glowingNodes={glowingNodes}
              neonNodes={neonNodes}
              onNodeClick={(name: string) => {
                if (!isClickable) return;
                setSelectedNode(selectedNode === name ? null : name);
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
              neonLinks={neonLinks}
            />
          )}
          {...sankeyProps}
        >
          {!hideTooltip && (
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const tooltipData = payload[0]?.payload as any;

                // Check if it's a link or node by checking for source property
                if (tooltipData?.source !== undefined && tooltipData?.target !== undefined) {
                  // It's a link
                  const sourceNode = tooltipData.source;
                  const targetNode = tooltipData.target;
                  return (
                    <div className="bg-background border-border rounded-lg border px-3 py-2 shadow-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-foreground font-medium">
                          {sourceNode?.name ?? "Source"}
                        </span>
                        <span className="text-muted-foreground">&rarr;</span>
                        <span className="text-foreground font-medium">
                          {targetNode?.name ?? "Target"}
                        </span>
                      </div>
                      <div className="text-muted-foreground mt-1 text-xs">
                        Value:{" "}
                        <span className="text-foreground font-medium">{tooltipData.value}</span>
                      </div>
                    </div>
                  );
                } else {
                  // It's a node
                  return (
                    <div className="bg-background border-border rounded-lg border px-3 py-2 shadow-lg">
                      <div className="text-foreground text-sm font-medium">{tooltipData.name}</div>
                      {tooltipData.value !== undefined && (
                        <div className="text-muted-foreground mt-1 text-xs">
                          Total:{" "}
                          <span className="text-foreground font-medium">{tooltipData.value}</span>
                        </div>
                      )}
                    </div>
                  );
                }
              }}
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

            {/* Neon filters for nodes */}
            {neonNodes.length > 0 && (
              <NeonFilterStyle chartId={chartId} neonNodes={neonNodes} type="node" />
            )}

            {/* Glow filters for links */}
            {glowingLinks.length > 0 && (
              <GlowFilterStyle
                chartId={chartId}
                glowingNodes={glowingLinks.map(String)}
                type="link"
              />
            )}

            {/* Neon filters for links */}
            {neonLinks.length > 0 && (
              <NeonFilterStyle chartId={chartId} neonNodes={neonLinks.map(String)} type="link" />
            )}
          </defs>
        </Sankey>
      )}

      {/* Loading state */}
      {isLoading && (
        <svg width="100%" height="100%" className="absolute inset-0">
          <LoadingSankey />
        </svg>
      )}
    </ChartContainer>
  );
}

// ========================================
// CUSTOM NODE COMPONENT
// ========================================

type SankeyNodeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
};

type CustomNodeProps = SankeyNodeProps & {
  chartId: string;
  chartConfig: ChartConfig;
  selectedNode: string | null;
  isClickable: boolean;
  nodeRadius: number;
  showNodeLabels: NodeLabelPosition;
  showNodeValues: boolean;
  nodeValueFormatter: (value: number) => string;
  glowingNodes: string[];
  neonNodes: string[];
  onNodeClick: (name: string) => void;
};

const CustomNode = ({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  payload,
  chartId,
  chartConfig,
  selectedNode,
  isClickable,
  nodeRadius,
  showNodeLabels,
  showNodeValues,
  nodeValueFormatter,
  glowingNodes,
  neonNodes,
  onNodeClick,
}: CustomNodeProps) => {
  const nodeName = payload?.name ?? "";
  const nodeValue = payload?.value ?? 0;
  const nodeIcon = payload?.icon;
  const isSelected = selectedNode === null || selectedNode === nodeName;
  const isGlowing = glowingNodes.includes(nodeName);
  const isNeon = neonNodes.includes(nodeName);

  const hasConfigColor = nodeName in chartConfig;
  const configLabel = chartConfig[nodeName]?.label ?? nodeName;

  const getFilter = () => {
    if (isNeon) return `url(#${chartId}-node-neon-${nodeName})`;
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
          {/* Dark background for label readability */}
          <rect
            x={x + 2}
            y={y + 2}
            width={width - 4}
            height={height - 4}
            rx={Math.max(0, nodeRadius - 2)}
            ry={Math.max(0, nodeRadius - 2)}
            fill="rgba(0, 0, 0, 0.6)"
            style={{ pointerEvents: "none" }}
          />

          {/* Icon if provided */}
          {nodeIcon && (
            <foreignObject
              x={labelX - 8}
              y={labelY - 30}
              width={16}
              height={16}
              style={{ pointerEvents: "none" }}
            >
              <div className="flex items-center justify-center text-white/80">{nodeIcon}</div>
            </foreignObject>
          )}

          {/* Label text */}
          <text
            x={labelX}
            y={nodeIcon ? labelY - 4 : labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-white text-[10px] font-medium"
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
              className="fill-white text-xs font-bold tabular-nums"
              style={{ pointerEvents: "none", fontFamily: "monospace" }}
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
            className="fill-foreground text-xs font-medium"
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
              className="fill-muted-foreground text-xs tabular-nums"
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

// ========================================
// CUSTOM LINK COMPONENT
// ========================================

type SankeyLinkProps = {
  sourceX?: number;
  targetX?: number;
  sourceY?: number;
  targetY?: number;
  sourceControlX?: number;
  targetControlX?: number;
  linkWidth?: number;
  index?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
};

type CustomLinkProps = SankeyLinkProps & {
  chartId: string;
  chartConfig: ChartConfig;
  selectedNode: string | null;
  linkVariant: LinkVariant;
  linkVerticalPadding: number;
  glowingLinks: number[];
  neonLinks: number[];
};

const CustomLink = ({
  sourceX = 0,
  targetX = 0,
  sourceY = 0,
  targetY = 0,
  sourceControlX = 0,
  targetControlX = 0,
  linkWidth = 0,
  index = 0,
  payload,
  chartId,
  chartConfig,
  selectedNode,
  linkVariant,
  linkVerticalPadding,
  glowingLinks,
  neonLinks,
}: CustomLinkProps) => {
  const sourceNode = payload?.source;
  const targetNode = payload?.target;
  const sourceName = sourceNode?.name ?? "";
  const targetName = targetNode?.name ?? "";

  // Check if either source or target is selected
  const isConnected =
    selectedNode === null || selectedNode === sourceName || selectedNode === targetName;

  const isGlowing = glowingLinks.includes(index);
  const isNeon = neonLinks.includes(index);

  const getFilter = () => {
    if (isNeon) return `url(#${chartId}-link-neon-${index})`;
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

  // Build the bezier path for the link
  const path = `
    M${sourceX},${sourceY}
    C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
  `;

  return (
    <Layer>
      {/* Define gradient for this specific link if using gradient variant */}
      {linkVariant === "gradient" && (
        <defs>
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
              stopOpacity={0.5}
            />
            <stop
              offset="100%"
              stopColor={
                targetName in chartConfig ? `var(--color-${targetName}-0)` : "currentColor"
              }
              stopOpacity={0.5}
            />
          </linearGradient>
        </defs>
      )}
      <path
        d={path}
        fill="none"
        stroke={getLinkFill()}
        strokeWidth={paddedLinkWidth}
        strokeOpacity={isConnected ? 0.4 : 0.1}
        filter={getFilter()}
        className="transition-opacity duration-200"
      />
    </Layer>
  );
};

// ========================================
// LOADING STATE
// ========================================

const LoadingSankey = () => {
  // Simple loading animation with placeholder nodes and links
  const nodes = [
    { x: 20, y: 40, width: 15, height: 80 },
    { x: 20, y: 150, width: 15, height: 60 },
    { x: 150, y: 60, width: 15, height: 100 },
    { x: 150, y: 180, width: 15, height: 40 },
    { x: 280, y: 80, width: 15, height: 120 },
  ];

  return (
    <>
      {/* Loading nodes */}
      {nodes.map((node, i) => (
        <motion.rect
          key={`loading-node-${i}`}
          x={`${node.x}px`}
          y={`${node.y}px`}
          width={`${node.width}px`}
          height={`${node.height}px`}
          rx={2}
          fill="currentColor"
          initial={{ opacity: 0.1 }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{
            duration: LOADING_ANIMATION_DURATION / 1000,
            delay: (i / nodes.length) * (LOADING_ANIMATION_DURATION / 1000),
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Loading links (simplified bezier curves) */}
      <motion.path
        d="M35,80 C90,80 90,110 165,110"
        fill="none"
        stroke="currentColor"
        strokeWidth={30}
        initial={{ opacity: 0.05 }}
        animate={{ opacity: [0.05, 0.15, 0.05] }}
        transition={{
          duration: LOADING_ANIMATION_DURATION / 1000,
          delay: 0.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.path
        d="M35,180 C90,180 90,200 165,200"
        fill="none"
        stroke="currentColor"
        strokeWidth={20}
        initial={{ opacity: 0.05 }}
        animate={{ opacity: [0.05, 0.15, 0.05] }}
        transition={{
          duration: LOADING_ANIMATION_DURATION / 1000,
          delay: 0.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.path
        d="M165,110 C220,110 220,140 295,140"
        fill="none"
        stroke="currentColor"
        strokeWidth={40}
        initial={{ opacity: 0.05 }}
        animate={{ opacity: [0.05, 0.15, 0.05] }}
        transition={{
          duration: LOADING_ANIMATION_DURATION / 1000,
          delay: 0.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </>
  );
};

// ========================================
// GRADIENT STYLES
// ========================================

// Vertical color gradient for sankey nodes
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

// ========================================
// GLOW/NEON FILTER STYLES
// ========================================

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

const NeonFilterStyle = ({
  chartId,
  neonNodes,
  type,
}: {
  chartId: string;
  neonNodes: string[];
  type: "node" | "link";
}) => {
  return (
    <>
      {neonNodes.map((nodeName) => (
        <filter
          key={`${chartId}-${type}-neon-${nodeName}`}
          id={`${chartId}-${type}-neon-${nodeName}`}
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="outerBlur" />
          <feColorMatrix
            in="outerBlur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0"
            result="outerGlow"
          />
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="middleBlur" />
          <feColorMatrix
            in="middleBlur"
            type="matrix"
            values="1 0 0 0 0.05  0 1 0 0 0.05  0 0 1 0 0.05  0 0 0 1.2 0"
            result="middleGlow"
          />
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="coreBlur" />
          <feColorMatrix
            in="coreBlur"
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"
            result="whiteCore"
          />
          <feMerge>
            <feMergeNode in="outerGlow" />
            <feMergeNode in="middleGlow" />
            <feMergeNode in="whiteCore" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      ))}
    </>
  );
};

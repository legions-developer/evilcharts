"use client";

import { EvilSankeyChart } from "@/registry/charts/sankey-chart";
import type { SankeyData } from "recharts";
import { type ChartConfig } from "@/registry/ui/chart";

// Sales report data - similar to the design with CRT, PPT, DMG categories
const data: SankeyData = {
  nodes: [
    { name: "CRT_L" }, // Left CRT
    { name: "PPT_L" }, // Left PPT
    { name: "DMG_L" }, // Left DMG
    { name: "PPT_M" }, // Middle PPT
    { name: "DMG_M" }, // Middle DMG
    { name: "CRT_R" }, // Right CRT
    { name: "PPT_R" }, // Right PPT
    { name: "DMG_R" }, // Right DMG
  ],
  links: [
    // From left CRT to middle nodes
    { source: 0, target: 3, value: 750 },
    { source: 0, target: 4, value: 502 },

    // From left PPT to middle nodes
    { source: 1, target: 3, value: 1500 },
    { source: 1, target: 4, value: 1498 },

    // From left DMG to middle nodes
    { source: 2, target: 3, value: 3931 },
    { source: 2, target: 4, value: 1612 },

    // From middle PPT to right nodes
    { source: 3, target: 5, value: 2000 },
    { source: 3, target: 6, value: 2091 },
    { source: 3, target: 7, value: 1840 },

    // From middle DMG to right nodes
    { source: 4, target: 5, value: 1991 },
    { source: 4, target: 7, value: 1158 },
  ],
};

const chartConfig = {
  CRT_L: {
    label: "CRT",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
  PPT_L: {
    label: "PPT",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  DMG_L: {
    label: "DMG",
    colors: {
      light: ["#06b6d4", "#8b5cf6"],
      dark: ["#22d3ee", "#a78bfa"],
    },
  },
  PPT_M: {
    label: "PPT",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  DMG_M: {
    label: "DMG",
    colors: {
      light: ["#06b6d4", "#8b5cf6"],
      dark: ["#22d3ee", "#a78bfa"],
    },
  },
  CRT_R: {
    label: "CRT",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
  PPT_R: {
    label: "PPT",
    colors: {
      light: ["#8b5cf6", "#10b981"],
      dark: ["#a78bfa", "#34d399"],
    },
  },
  DMG_R: {
    label: "DMG",
    colors: {
      light: ["#06b6d4", "#10b981"],
      dark: ["#22d3ee", "#34d399"],
    },
  },
} satisfies ChartConfig;

export function EvilExampleLabeledNodesSankeyChart() {
  return (
    <EvilSankeyChart
      className="h-full w-full p-4"
      data={data}
      chartConfig={chartConfig}
      nodeWidth={80}
      nodePadding={24}
      nodeRadius={4}
      linkVariant="gradient"
      linkVerticalPadding={8}
      showNodeLabels="inside" // [!code highlight]
      showNodeValues={true} // [!code highlight]
      nodeValueFormatter={(value) => value.toLocaleString()}
      isClickable
    />
  );
}

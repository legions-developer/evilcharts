"use client";

import { EvilSankeyChart } from "@/registry/charts/sankey-chart";
import type { SankeyData } from "recharts";
import { type ChartConfig } from "@/registry/ui/chart";

// Sales report data with solid colors
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
    { source: 0, target: 3, value: 800 },
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
      light: ["#a3a3a3"], // lighter than #525252
      dark: ["#525252"],
    },
  },
  PPT_L: {
    label: "PPT",
    colors: {
      light: ["#d1b3ff"], // lighter than #8b5cf6
      dark: ["#8b5cf6"],
    },
  },
  DMG_L: {
    label: "DMG",
    colors: {
      light: ["#a3a3a3"], // lighter than #404040
      dark: ["#404040"],
    },
  },
  PPT_M: {
    label: "PPT",
    colors: {
      light: ["#c4b5fd"], // lighter than #7c3aed
      dark: ["#7c3aed"],
    },
  },
  DMG_M: {
    label: "DMG",
    colors: {
      light: ["#67e8f9"], // lighter than #06b6d4
      dark: ["#06b6d4"],
    },
  },
  CRT_R: {
    label: "CRT",
    colors: {
      light: ["#6ee7b7"], // lighter than #10b981
      dark: ["#10b981"],
    },
  },
  PPT_R: {
    label: "PPT",
    colors: {
      light: ["#a3a3a3"], // lighter than #525252
      dark: ["#525252"],
    },
  },
  DMG_R: {
    label: "DMG",
    colors: {
      light: ["#a3a3a3"], // lighter than #404040
      dark: ["#404040"],
    },
  },
} satisfies ChartConfig;

export function EvilExampleSolidLabeledNodesSankeyChart() {
  return (
    <EvilSankeyChart
      className="h-full w-full p-4"
      data={data}
      chartConfig={chartConfig}
      nodeWidth={80}
      nodePadding={24}
      nodeRadius={4}
      linkVariant="source"
      linkVerticalPadding={8}
      showNodeLabels="inside" // [!code highlight]
      nodeValueFormatter={(value) => value.toLocaleString()}
      isClickable
    />
  );
}

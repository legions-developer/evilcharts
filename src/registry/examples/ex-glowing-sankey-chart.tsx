"use client";

import { EvilSankeyChart } from "@/registry/charts/sankey-chart";
import type { SankeyData } from "recharts";
import { type ChartConfig } from "@/registry/ui/chart";

// Energy flow - sources to consumption sectors
const data: SankeyData = {
  nodes: [
    { name: "Solar" },
    { name: "Wind" },
    { name: "Nuclear" },
    { name: "NaturalGas" },
    { name: "Grid" },
    { name: "Residential" },
    { name: "Industrial" },
    { name: "Commercial" },
    { name: "Transport" },
  ],
  links: [
    { source: 0, target: 4, value: 18500 },
    { source: 1, target: 4, value: 24200 },
    { source: 2, target: 4, value: 31000 },
    { source: 3, target: 4, value: 42800 },
    { source: 4, target: 5, value: 28600 },
    { source: 4, target: 6, value: 38900 },
    { source: 4, target: 7, value: 22400 },
    { source: 4, target: 8, value: 26600 },
  ],
};

const chartConfig = {
  Solar: {
    label: "Solar",
    colors: {
      light: ["#fbbf24"],
      dark: ["#fcd34d"],
    },
  },
  Wind: {
    label: "Wind",
    colors: {
      light: ["#06b6d4"],
      dark: ["#22d3ee"],
    },
  },
  Nuclear: {
    label: "Nuclear",
    colors: {
      light: ["#a855f7"],
      dark: ["#c084fc"],
    },
  },
  NaturalGas: {
    label: "Natural Gas",
    colors: {
      light: ["#f97316"],
      dark: ["#fb923c"],
    },
  },
  Grid: {
    label: "Power Grid",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  Residential: {
    label: "Residential",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
  Industrial: {
    label: "Industrial",
    colors: {
      light: ["#6366f1"],
      dark: ["#818cf8"],
    },
  },
  Commercial: {
    label: "Commercial",
    colors: {
      light: ["#ec4899"],
      dark: ["#f472b6"],
    },
  },
  Transport: {
    label: "Transport",
    colors: {
      light: ["#84cc16"],
      dark: ["#a3e635"],
    },
  },
} satisfies ChartConfig;

export function EvilExampleSankeyChart() {
  return (
    <EvilSankeyChart
      isClickable
      className="h-full w-full p-4"
      data={data}
      chartConfig={chartConfig}
      linkVariant="source"
      glowingNodes={["Solar", "Wind", "Grid"]} // [!code highlight]
    />
  );
}

"use client";

import { EvilSankeyChart } from "@/registry/charts/sankey-chart";
import type { SankeyData } from "recharts";
import { type ChartConfig } from "@/registry/ui/chart";

// E-commerce journey - traffic to purchase
const data: SankeyData = {
  nodes: [
    { name: "Direct" },
    { name: "Email" },
    { name: "Referral" },
    { name: "Browse" },
    { name: "Search" },
    { name: "ViewItem" },
    { name: "AddToCart" },
    { name: "Checkout" },
    { name: "Abandoned" },
  ],
  links: [
    { source: 0, target: 3, value: 15200 },
    { source: 1, target: 3, value: 8400 },
    { source: 2, target: 3, value: 6800 },
    { source: 3, target: 4, value: 18600 },
    { source: 3, target: 8, value: 11800 },
    { source: 4, target: 5, value: 12400 },
    { source: 4, target: 8, value: 6200 },
    { source: 5, target: 6, value: 8100 },
    { source: 5, target: 8, value: 4300 },
    { source: 6, target: 7, value: 5400 },
    { source: 6, target: 8, value: 2700 },
  ],
};

const chartConfig = {
  Direct: {
    label: "Direct Traffic",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  Email: {
    label: "Email Campaign",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  Referral: {
    label: "Referral",
    colors: {
      light: ["#06b6d4"],
      dark: ["#22d3ee"],
    },
  },
  Browse: {
    label: "Browse",
    colors: {
      light: ["#f59e0b"],
      dark: ["#fbbf24"],
    },
  },
  Search: {
    label: "Search",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
  ViewItem: {
    label: "View Item",
    colors: {
      light: ["#ec4899"],
      dark: ["#f472b6"],
    },
  },
  AddToCart: {
    label: "Add to Cart",
    colors: {
      light: ["#f97316"],
      dark: ["#fb923c"],
    },
  },
  Checkout: {
    label: "Checkout",
    colors: {
      light: ["#22c55e"],
      dark: ["#4ade80"],
    },
  },
  Abandoned: {
    label: "Abandoned",
    colors: {
      light: ["#e11d48"],
      dark: ["#f43f5e"],
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
      linkVariant="solid" // [!code highlight]
    />
  );
}

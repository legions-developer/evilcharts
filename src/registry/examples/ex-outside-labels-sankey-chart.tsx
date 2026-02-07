"use client";

import { EvilSankeyChart } from "@/registry/charts/sankey-chart";
import type { SankeyData } from "recharts";
import { type ChartConfig } from "@/registry/ui/chart";

// Marketing funnel data
const data: SankeyData = {
  nodes: [
    { name: "Organic" },
    { name: "PaidAds" },
    { name: "Social" },
    { name: "Landing" },
    { name: "Product" },
    { name: "Cart" },
    { name: "Purchase" },
    { name: "Bounced" },
  ],
  links: [
    { source: 0, target: 3, value: 42000 },
    { source: 1, target: 3, value: 28000 },
    { source: 2, target: 3, value: 18000 },
    { source: 3, target: 4, value: 52000 },
    { source: 3, target: 7, value: 36000 },
    { source: 4, target: 5, value: 31000 },
    { source: 4, target: 7, value: 21000 },
    { source: 5, target: 6, value: 24000 },
    { source: 5, target: 7, value: 7000 },
  ],
};

const chartConfig = {
  Organic: {
    label: "Organic Search",
    colors: {
      light: ["#059669"],
      dark: ["#34d399"],
    },
  },
  PaidAds: {
    label: "Paid Ads",
    colors: {
      light: ["#dc2626"],
      dark: ["#f87171"],
    },
  },
  Social: {
    label: "Social Media",
    colors: {
      light: ["#7c3aed"],
      dark: ["#a78bfa"],
    },
  },
  Landing: {
    label: "Landing Page",
    colors: {
      light: ["#0891b2"],
      dark: ["#22d3ee"],
    },
  },
  Product: {
    label: "Product Page",
    colors: {
      light: ["#2563eb"],
      dark: ["#60a5fa"],
    },
  },
  Cart: {
    label: "Cart",
    colors: {
      light: ["#ea580c"],
      dark: ["#fb923c"],
    },
  },
  Purchase: {
    label: "Purchase",
    colors: {
      light: ["#16a34a"],
      dark: ["#4ade80"],
    },
  },
  Bounced: {
    label: "Bounced",
    colors: {
      light: ["#f43f5e"],
      dark: ["#fb7185"],
    },
  },
} satisfies ChartConfig;

export function EvilExampleOutsideLabelsSankeyChart() {
  return (
    <EvilSankeyChart
      className="h-full w-full p-4"
      data={data}
      chartConfig={chartConfig}
      nodeWidth={8}
      nodePadding={20}
      nodeRadius={4}
      linkVariant="source"
      showNodeLabels="outside" // [!code highlight]
      showNodeValues={true} // [!code highlight]
      nodeValueFormatter={(value) => value.toLocaleString()}
      isClickable
    />
  );
}

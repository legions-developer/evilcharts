"use client";

import { EvilSankeyChart } from "@/registry/charts/sankey-chart";
import type { SankeyData } from "recharts";
import { type ChartConfig } from "@/registry/ui/chart";

// Content distribution - how content flows to platforms
const data: SankeyData = {
  nodes: [
    { name: "BlogPosts" },
    { name: "Videos" },
    { name: "Podcasts" },
    { name: "Twitter" },
    { name: "LinkedIn" },
    { name: "YouTube" },
    { name: "Newsletter" },
  ],
  links: [
    { source: 0, target: 3, value: 12000 },
    { source: 0, target: 4, value: 8500 },
    { source: 0, target: 6, value: 15000 },
    { source: 1, target: 5, value: 28000 },
    { source: 1, target: 3, value: 4200 },
    { source: 2, target: 5, value: 9800 },
    { source: 2, target: 4, value: 3600 },
  ],
};

const chartConfig = {
  BlogPosts: {
    label: "Blog Posts",
    colors: {
      light: ["#3b82f6"],
      dark: ["#60a5fa"],
    },
  },
  Videos: {
    label: "Videos",
    colors: {
      light: ["#ef4444"],
      dark: ["#f87171"],
    },
  },
  Podcasts: {
    label: "Podcasts",
    colors: {
      light: ["#8b5cf6"],
      dark: ["#a78bfa"],
    },
  },
  Twitter: {
    label: "Twitter",
    colors: {
      light: ["#0ea5e9"],
      dark: ["#38bdf8"],
    },
  },
  LinkedIn: {
    label: "LinkedIn",
    colors: {
      light: ["#0077b5"],
      dark: ["#0a95d9"],
    },
  },
  YouTube: {
    label: "YouTube",
    colors: {
      light: ["#dc2626"],
      dark: ["#ef4444"],
    },
  },
  Newsletter: {
    label: "Newsletter",
    colors: {
      light: ["#10b981"],
      dark: ["#34d399"],
    },
  },
} satisfies ChartConfig;

export function EvilExampleSankeyChart() {
  return (
    <EvilSankeyChart
      className="h-full w-full p-4"
      data={data}
      chartConfig={chartConfig}
      linkVariant="source"
      isLoading // [!code highlight]
    />
  );
}

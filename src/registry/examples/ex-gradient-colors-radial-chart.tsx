"use client";

import { EvilRadialChart } from "@/registry/charts/radial-chart";
import { type ChartConfig } from "@/registry/ui/chart";

const data = [
  { browser: "chrome", visitors: 275 },
  { browser: "safari", visitors: 200 },
  { browser: "firefox", visitors: 187 },
  { browser: "edge", visitors: 173 },
  { browser: "other", visitors: 90 },
];

const chartConfig = {
  chrome: {
    label: "Chrome",
    colors: {
      light: ["#ff6b6b", "#feca57", "#48dbfb"], // Coral -> Gold -> Electric Blue // [!code highlight]
      dark: ["#ff7979", "#ffeaa7", "#74b9ff"], // [!code highlight]
    },
  },
  safari: {
    label: "Safari",
    colors: {
      light: ["#a29bfe", "#fd79a8", "#fdcb6e"], // Lavender -> Pink -> Sunflower // [!code highlight]
      dark: ["#b8b5ff", "#ff9ff3", "#ffeaa7"], // [!code highlight]
    },
  },
  firefox: {
    label: "Firefox",
    colors: {
      light: ["#00d2d3", "#54a0ff", "#5f27cd"], // Turquoise -> Blue -> Purple // [!code highlight]
      dark: ["#01e2e3", "#74b9ff", "#7c3aed"], // [!code highlight]
    },
  },
  edge: {
    label: "Edge",
    colors: {
      light: ["#ff9f43", "#ee5a24", "#b71540"], // Tangerine -> Vermillion -> Wine // [!code highlight]
      dark: ["#ffbe76", "#f0932b", "#e74c3c"], // [!code highlight]
    },
  },
  other: {
    label: "Other",
    colors: {
      light: ["#1dd1a1", "#10ac84", "#01a3a4"], // Mint -> Jungle -> Teal // [!code highlight]
      dark: ["#55efc4", "#00b894", "#00cec9"], // [!code highlight]
    },
  },
} satisfies ChartConfig;

export function EvilExampleRadialChart() {
  return (
    <EvilRadialChart
      className="h-full w-full p-4"
      data={data}
      dataKey="visitors"
      nameKey="browser"
      chartConfig={chartConfig}
    />
  );
}

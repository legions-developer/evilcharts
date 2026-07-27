"use client";

import { EChartsAreaChart, type ChartConfig } from "@/registry/charts/echarts-area-chart";
import { EChartsComposedChart } from "@/registry/charts/echarts-composed-chart";
import { EChartsRadialChart } from "@/registry/charts/echarts-radial-chart";
import { EChartsRadarChart } from "@/registry/charts/echarts-radar-chart";
import { EChartsLineChart } from "@/registry/charts/echarts-line-chart";
import { EChartsPieChart } from "@/registry/charts/echarts-pie-chart";
import { EChartsBarChart } from "@/registry/charts/echarts-bar-chart";

const monthly = [
  { month: "Jan", primary: 186, secondary: 80 },
  { month: "Feb", primary: 305, secondary: 200 },
  { month: "Mar", primary: 237, secondary: 120 },
  { month: "Apr", primary: 173, secondary: 190 },
  { month: "May", primary: 209, secondary: 130 },
  { month: "Jun", primary: 264, secondary: 140 },
  { month: "Jul", primary: 232, secondary: 178 },
  { month: "Aug", primary: 291, secondary: 210 },
];

const radarData = [
  { axis: "Speed", core: 92, edge: 74 },
  { axis: "Uptime", core: 86, edge: 95 },
  { axis: "Scale", core: 78, edge: 88 },
  { axis: "DX", core: 95, edge: 70 },
  { axis: "A11y", core: 82, edge: 79 },
  { axis: "Theming", core: 90, edge: 84 },
];

const radarConfig = {
  core: {
    label: "Core",
    colors: {
      light: ["#e11d48", "#f97316", "#eab308"],
      dark: ["#fb7185", "#fb923c", "#fde047"],
    },
  },
  edge: {
    label: "Edge",
    colors: {
      light: ["#0ea5e9", "#6366f1", "#a855f7"],
      dark: ["#38bdf8", "#818cf8", "#c084fc"],
    },
  },
} satisfies ChartConfig;

export function LandingRadarChart() {
  return (
    <EChartsRadarChart data={radarData} config={radarConfig} className="h-full w-full p-3">
      <EChartsRadarChart.PolarGrid />
      <EChartsRadarChart.PolarAngleAxis dataKey="axis" />
      <EChartsRadarChart.Tooltip />
      <EChartsRadarChart.Radar dataKey="core" variant="filled">
        <EChartsRadarChart.Dot variant="colored-border" />
        <EChartsRadarChart.ActiveDot variant="default" />
      </EChartsRadarChart.Radar>
      <EChartsRadarChart.Radar dataKey="edge" variant="filled">
        <EChartsRadarChart.Dot variant="colored-border" />
        <EChartsRadarChart.ActiveDot variant="default" />
      </EChartsRadarChart.Radar>
    </EChartsRadarChart>
  );
}

const composedData = [
  { month: "Jan", volume: 4200, trend: 1800 },
  { month: "Feb", volume: 5800, trend: 2400 },
  { month: "Mar", volume: 4100, trend: 1600 },
  { month: "Apr", volume: 6200, trend: 2800 },
  { month: "May", volume: 5400, trend: 2200 },
  { month: "Jun", volume: 7800, trend: 3400 },
  { month: "Jul", volume: 6100, trend: 2600 },
  { month: "Aug", volume: 8200, trend: 3800 },
  { month: "Sep", volume: 5900, trend: 2500 },
  { month: "Oct", volume: 6800, trend: 3000 },
  { month: "Nov", volume: 7200, trend: 3200 },
  { month: "Dec", volume: 9100, trend: 4200 },
];

const composedConfig = {
  volume: {
    label: "Volume",
    colors: {
      light: ["#0284c7", "#4f46e5"],
      dark: ["#38bdf8", "#818cf8"],
    },
  },
  trend: {
    label: "Trend",
    colors: {
      light: ["#ea580c", "#db2777"],
      dark: ["#fb923c", "#f472b6"],
    },
  },
} satisfies ChartConfig;

export function LandingComposedChart() {
  return (
    <EChartsComposedChart
      data={composedData}
      config={composedConfig}
      xDataKey="month"
      className="h-full w-full p-3"
    >
      <EChartsComposedChart.Grid />
      <EChartsComposedChart.XAxis dataKey="month" />
      <EChartsComposedChart.Tooltip />
      <EChartsComposedChart.Bar dataKey="volume" />
      <EChartsComposedChart.Line dataKey="trend" />
    </EChartsComposedChart>
  );
}

const gradientAreaConfig = {
  primary: {
    label: "Sessions",
    colors: {
      light: ["#06b6d4", "#3b82f6", "#8b5cf6"],
      dark: ["#22d3ee", "#60a5fa", "#a78bfa"],
    },
  },
  secondary: {
    label: "Signups",
    colors: {
      light: ["#f59e0b", "#f97316"],
      dark: ["#fbbf24", "#fb923c"],
    },
  },
} satisfies ChartConfig;

export function LandingGradientAreaChart() {
  return (
    <EChartsAreaChart
      data={monthly}
      config={gradientAreaConfig}
      className="h-full w-full p-3"
      stackType="stacked"
    >
      <EChartsAreaChart.Grid />
      <EChartsAreaChart.XAxis dataKey="month" />
      <EChartsAreaChart.Tooltip />
      <EChartsAreaChart.Area dataKey="primary" variant="gradient">
        <EChartsAreaChart.ActiveDot variant="default" />
      </EChartsAreaChart.Area>
      <EChartsAreaChart.Area dataKey="secondary" variant="gradient">
        <EChartsAreaChart.ActiveDot variant="default" />
      </EChartsAreaChart.Area>
    </EChartsAreaChart>
  );
}

const hatchedBarConfig = {
  primary: {
    label: "Deploys",
    colors: { light: ["#0d9488"], dark: ["#2dd4bf"] },
  },
  secondary: {
    label: "Rollbacks",
    colors: { light: ["#d97706"], dark: ["#fbbf24"] },
  },
} satisfies ChartConfig;

export function LandingHatchedBarChart() {
  return (
    <EChartsBarChart data={monthly} config={hatchedBarConfig} className="h-full w-full p-3">
      <EChartsBarChart.Grid />
      <EChartsBarChart.XAxis dataKey="month" />
      <EChartsBarChart.Tooltip />
      <EChartsBarChart.Bar dataKey="primary" variant="hatched" />
      <EChartsBarChart.Bar dataKey="secondary" variant="hatched" />
    </EChartsBarChart>
  );
}

const duotoneBarConfig = {
  primary: {
    label: "Streams",
    colors: { light: ["#c026d3"], dark: ["#e879f9"] },
  },
  secondary: {
    label: "Downloads",
    colors: { light: ["#0284c7"], dark: ["#38bdf8"] },
  },
} satisfies ChartConfig;

export function LandingDuotoneBarChart() {
  return (
    <EChartsBarChart data={monthly} config={duotoneBarConfig} className="h-full w-full p-3">
      <EChartsBarChart.Grid />
      <EChartsBarChart.XAxis dataKey="month" />
      <EChartsBarChart.Tooltip />
      <EChartsBarChart.Bar dataKey="primary" variant="duotone" />
      <EChartsBarChart.Bar dataKey="secondary" variant="duotone" />
    </EChartsBarChart>
  );
}

const gradientBarConfig = {
  primary: {
    label: "Revenue",
    colors: {
      light: ["#f43f5e", "#ec4899", "#a855f7", "#6366f1", "#3b82f6"],
      dark: ["#fb7185", "#f472b6", "#c084fc", "#818cf8", "#60a5fa"],
    },
  },
  secondary: {
    label: "Profit",
    colors: {
      light: ["#059669", "#14b8a6", "#06b6d4"],
      dark: ["#34d399", "#2dd4bf", "#22d3ee"],
    },
  },
} satisfies ChartConfig;

export function LandingGradientBarChart() {
  return (
    <EChartsBarChart data={monthly} config={gradientBarConfig} className="h-full w-full p-3">
      <EChartsBarChart.Grid />
      <EChartsBarChart.XAxis dataKey="month" />
      <EChartsBarChart.Tooltip />
      <EChartsBarChart.Bar dataKey="primary" />
      <EChartsBarChart.Bar dataKey="secondary" />
    </EChartsBarChart>
  );
}

const glowingLineConfig = {
  primary: {
    label: "Requests",
    colors: {
      light: ["#65a30d", "#16a34a"],
      dark: ["#a3e635", "#4ade80"],
    },
  },
  secondary: {
    label: "Cache hits",
    colors: {
      light: ["#c026d3", "#db2777"],
      dark: ["#e879f9", "#f472b6"],
    },
  },
} satisfies ChartConfig;

export function LandingGlowingLineChart() {
  return (
    <EChartsLineChart data={monthly} config={glowingLineConfig} className="h-full w-full p-3">
      <EChartsLineChart.Grid />
      <EChartsLineChart.XAxis dataKey="month" />
      <EChartsLineChart.Tooltip />
      <EChartsLineChart.Line dataKey="primary" strokeVariant="solid" glowing>
        <EChartsLineChart.ActiveDot variant="ping" />
      </EChartsLineChart.Line>
      <EChartsLineChart.Line dataKey="secondary" strokeVariant="solid" glowing>
        <EChartsLineChart.ActiveDot variant="ping" />
      </EChartsLineChart.Line>
    </EChartsLineChart>
  );
}

const dashedLineConfig = {
  primary: {
    label: "This year",
    colors: { light: ["#0891b2"], dark: ["#22d3ee"] },
  },
  secondary: {
    label: "Last year",
    colors: { light: ["#e11d48"], dark: ["#fb7185"] },
  },
} satisfies ChartConfig;

export function LandingDashedLineChart() {
  return (
    <EChartsLineChart
      data={monthly}
      config={dashedLineConfig}
      className="h-full w-full p-3"
      curveType="monotone"
    >
      <EChartsLineChart.Grid />
      <EChartsLineChart.XAxis dataKey="month" />
      <EChartsLineChart.Tooltip />
      <EChartsLineChart.Line dataKey="primary" strokeVariant="solid" strokeWidth={2}>
        <EChartsLineChart.Dot variant="colored-border" />
        <EChartsLineChart.ActiveDot variant="default" />
      </EChartsLineChart.Line>
      <EChartsLineChart.Line dataKey="secondary" strokeVariant="dashed" strokeWidth={2}>
        <EChartsLineChart.ActiveDot variant="default" />
      </EChartsLineChart.Line>
    </EChartsLineChart>
  );
}

const donutData = [
  { channel: "search", value: 320 },
  { channel: "social", value: 240 },
  { channel: "direct", value: 195 },
  { channel: "referral", value: 140 },
  { channel: "email", value: 110 },
];

const donutConfig = {
  search: { label: "Search", colors: { light: ["#e11d48"], dark: ["#fb7185"] } },
  social: { label: "Social", colors: { light: ["#f97316"], dark: ["#fb923c"] } },
  direct: { label: "Direct", colors: { light: ["#eab308"], dark: ["#facc15"] } },
  referral: { label: "Referral", colors: { light: ["#16a34a"], dark: ["#4ade80"] } },
  email: { label: "Email", colors: { light: ["#0284c7"], dark: ["#38bdf8"] } },
} satisfies ChartConfig;

export function LandingDonutPieChart() {
  return (
    <EChartsPieChart
      data={donutData}
      dataKey="value"
      nameKey="channel"
      config={donutConfig}
      className="h-full w-full p-3"
    >
      <EChartsPieChart.Legend />
      <EChartsPieChart.Tooltip />
      <EChartsPieChart.Pie innerRadius={60} />
    </EChartsPieChart>
  );
}

const semiRadialData = [
  { tier: "starter", value: 420 },
  { tier: "growth", value: 340 },
  { tier: "scale", value: 260 },
  { tier: "pro", value: 180 },
  { tier: "max", value: 120 },
];

const semiRadialConfig = {
  starter: { label: "Starter", colors: { light: ["#f43f5e"], dark: ["#fb7185"] } },
  growth: { label: "Growth", colors: { light: ["#ea580c"], dark: ["#fb923c"] } },
  scale: { label: "Scale", colors: { light: ["#ca8a04"], dark: ["#facc15"] } },
  pro: { label: "Pro", colors: { light: ["#16a34a"], dark: ["#4ade80"] } },
  max: { label: "Max", colors: { light: ["#0ea5e9"], dark: ["#38bdf8"] } },
} satisfies ChartConfig;

export function LandingSemiRadialChart() {
  return (
    <EChartsRadialChart
      data={semiRadialData}
      nameKey="tier"
      config={semiRadialConfig}
      variant="semi"
      className="h-full w-full p-3"
    >
      <EChartsRadialChart.Legend />
      <EChartsRadialChart.Tooltip />
      <EChartsRadialChart.RadialBar dataKey="value" />
    </EChartsRadialChart>
  );
}

const strippedBarConfig = {
  primary: {
    label: "Builds",
    colors: { light: ["#7c3aed"], dark: ["#a78bfa"] },
  },
  secondary: {
    label: "Releases",
    colors: { light: ["#65a30d"], dark: ["#a3e635"] },
  },
} satisfies ChartConfig;

export function LandingStrippedBarChart() {
  return (
    <EChartsBarChart data={monthly} config={strippedBarConfig} className="h-full w-full p-3">
      <EChartsBarChart.Grid />
      <EChartsBarChart.XAxis dataKey="month" />
      <EChartsBarChart.Tooltip />
      <EChartsBarChart.Bar dataKey="primary" variant="stripped" />
      <EChartsBarChart.Bar dataKey="secondary" variant="stripped" />
    </EChartsBarChart>
  );
}

const stepLineConfig = {
  primary: {
    label: "Active users",
    colors: { light: ["#0284c7"], dark: ["#38bdf8"] },
  },
  secondary: {
    label: "New users",
    colors: { light: ["#ea580c"], dark: ["#fb923c"] },
  },
} satisfies ChartConfig;

export function LandingStepLineChart() {
  return (
    <EChartsLineChart
      data={monthly}
      config={stepLineConfig}
      className="h-full w-full p-3"
      curveType="step"
    >
      <EChartsLineChart.Grid />
      <EChartsLineChart.XAxis dataKey="month" />
      <EChartsLineChart.Tooltip />
      <EChartsLineChart.Line dataKey="primary" strokeVariant="solid" strokeWidth={2} />
      <EChartsLineChart.Line dataKey="secondary" strokeVariant="solid" strokeWidth={2} />
    </EChartsLineChart>
  );
}

const dottedAreaConfig = {
  primary: {
    label: "Reads",
    colors: { light: ["#e11d48"], dark: ["#fb7185"] },
  },
  secondary: {
    label: "Writes",
    colors: { light: ["#0891b2"], dark: ["#22d3ee"] },
  },
} satisfies ChartConfig;

export function LandingDottedAreaChart() {
  return (
    <EChartsAreaChart data={monthly} config={dottedAreaConfig} className="h-full w-full p-3">
      <EChartsAreaChart.Grid />
      <EChartsAreaChart.XAxis dataKey="month" />
      <EChartsAreaChart.Tooltip />
      <EChartsAreaChart.Area dataKey="primary" variant="dotted">
        <EChartsAreaChart.ActiveDot variant="default" />
      </EChartsAreaChart.Area>
      <EChartsAreaChart.Area dataKey="secondary" variant="dotted">
        <EChartsAreaChart.ActiveDot variant="default" />
      </EChartsAreaChart.Area>
    </EChartsAreaChart>
  );
}

const circleRadarConfig = {
  core: {
    label: "Q3",
    colors: {
      light: ["#d97706", "#dc2626"],
      dark: ["#fbbf24", "#f87171"],
    },
  },
  edge: {
    label: "Q4",
    colors: {
      light: ["#059669", "#0891b2"],
      dark: ["#34d399", "#22d3ee"],
    },
  },
} satisfies ChartConfig;

export function LandingCircleRadarChart() {
  return (
    <EChartsRadarChart data={radarData} config={circleRadarConfig} className="h-full w-full p-3">
      <EChartsRadarChart.PolarGrid gridType="circle" />
      <EChartsRadarChart.PolarAngleAxis dataKey="axis" />
      <EChartsRadarChart.Tooltip />
      <EChartsRadarChart.Radar dataKey="core" variant="filled">
        <EChartsRadarChart.Dot variant="colored-border" />
        <EChartsRadarChart.ActiveDot variant="default" />
      </EChartsRadarChart.Radar>
      <EChartsRadarChart.Radar dataKey="edge" variant="filled">
        <EChartsRadarChart.Dot variant="colored-border" />
        <EChartsRadarChart.ActiveDot variant="default" />
      </EChartsRadarChart.Radar>
    </EChartsRadarChart>
  );
}

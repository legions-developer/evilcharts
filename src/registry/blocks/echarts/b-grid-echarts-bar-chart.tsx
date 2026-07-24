"use client";

import { EChartsBarChart, type ChartConfig } from "@/registry/charts/echarts-bar-chart";

const chartData = [
  { hour: "00:00", sessions: 42 },
  { hour: "01:00", sessions: 28 },
  { hour: "02:00", sessions: 19 },
  { hour: "03:00", sessions: 14 },
  { hour: "04:00", sessions: 12 },
  { hour: "05:00", sessions: 18 },
  { hour: "06:00", sessions: 34 },
  { hour: "07:00", sessions: 66 },
  { hour: "08:00", sessions: 98 },
  { hour: "09:00", sessions: 124 },
  { hour: "10:00", sessions: 147 },
  { hour: "11:00", sessions: 163 },
  { hour: "12:00", sessions: 158 },
  { hour: "13:00", sessions: 171 },
  { hour: "14:00", sessions: 186 },
  { hour: "15:00", sessions: 174 },
  { hour: "16:00", sessions: 152 },
  { hour: "17:00", sessions: 138 },
  { hour: "18:00", sessions: 119 },
  { hour: "19:00", sessions: 96 },
  { hour: "20:00", sessions: 84 },
  { hour: "21:00", sessions: 71 },
  { hour: "22:00", sessions: 58 },
  { hour: "23:00", sessions: 47 },
];

const chartConfig = {
  sessions: {
    label: "Sessions",
    colors: {
      light: ["#18181b"],
      dark: ["#FFFFFF"],
    },
  },
} satisfies ChartConfig;

const TOTAL = chartData.reduce((sum, { sessions }) => sum + sessions, 0);
const PEAK = chartData.reduce(
  (max, row) => (row.sessions > max.sessions ? row : max),
  chartData[0],
);

export function EChartsGridBarChart() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row">
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs">{"[Σ] Total"}</span>
            <span className="text-primary font-mono text-3xl tracking-tighter">
              {TOTAL.toLocaleString()}
            </span>
          </div>
          <hr className="mx-4 h-full border-l border-dashed" />
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground font-mono text-xs">{"[⬆] Peak"}</span>
            <span className="text-primary font-mono text-3xl tracking-tighter">{PEAK.hour}</span>
          </div>
        </div>
        <div className="flex flex-col justify-end gap-1">
          <span className="text-muted-foreground font-mono text-[10px]">
            {"// CELL: "}
            <span className="text-primary">1:1</span>
          </span>
          <span className="text-muted-foreground font-mono text-[10px]">
            {"// TYPE: "}
            <span className="text-primary">GRID</span>
          </span>
        </div>
      </div>

      <hr className="my-4 border-t border-dashed" />

      <div className="min-h-0 w-full flex-1">
        <EChartsBarChart
          data={chartData}
          config={chartConfig}
          xDataKey="hour"
          className="h-full w-full"
          barCategoryGap={14}
        >
          <EChartsBarChart.XAxis dataKey="hour" />
          <EChartsBarChart.Tooltip />
          <EChartsBarChart.Bar dataKey="sessions" variant="blocks" />
        </EChartsBarChart>
      </div>
    </div>
  );
}

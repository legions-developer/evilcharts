"use client";

import {
  EChartsHeatmapChart,
  type ChartConfig,
  type HeatmapDatum,
  type HeatmapSelection,
} from "@/registry/charts/echarts-heatmap-chart";
import { useState } from "react";

// A quarter of on-call alerts, seeded — mostly quiet, with a few incident spikes.
function buildAlerts(seed: number): HeatmapDatum[] {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  const start = Date.UTC(2025, 9, 1);
  const data: HeatmapDatum[] = [];
  for (let i = 0; i < 92; i++) {
    const roll = random();
    if (roll < 0.42) continue;
    const value =
      roll > 0.97 ? 8 + Math.ceil(random() * 9) : roll > 0.86 ? 3 + Math.ceil(random() * 4) : 1;
    data.push({ date: new Date(start + i * 86_400_000).toISOString().slice(0, 10), value });
  }
  return data;
}

const chartData = buildAlerts(1337);

// Pinned severity levels: 1–2 alerts is noise, 3–7 an incident, 8+ a major one.
const INCIDENT_AT = 3;
const MAJOR_AT = 8;

const chartConfig = {
  alerts: {
    label: "Alerts",
    colors: {
      light: ["#fecaca", "#ef4444", "#7f1d1d"],
      dark: ["#7f1d1d", "#ef4444", "#fca5a5"],
    },
  },
} satisfies ChartConfig;

const TOTAL = chartData.reduce((sum, day) => sum + day.value, 0);
const INCIDENT_DAYS = chartData.filter((day) => day.value >= INCIDENT_AT).length;
const WORST = chartData.reduce((best, day) => (day.value > best.value ? day : best), chartData[0]);

function severityOf(value: number) {
  if (value >= MAJOR_AT)
    return { label: "Major", className: "bg-red-500/15 text-red-600 dark:text-red-400" };
  if (value >= INCIDENT_AT)
    return {
      label: "Incident",
      className: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
    };
  if (value > 0) return { label: "Noise", className: "bg-muted text-muted-foreground" };
  return { label: "Quiet", className: "bg-muted text-muted-foreground" };
}

function formatDate(date: string) {
  return new Date(Date.parse(`${date}T00:00:00Z`)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function EChartsIncidentsHeatmapChart() {
  const [selection, setSelection] = useState<HeatmapSelection | null>({
    date: WORST.date,
    value: WORST.value,
  });
  const severity = severityOf(selection?.value ?? 0);

  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-[11px]">On-call · Q4 2025</span>
          <span className="text-primary text-sm font-medium">
            {selection ? formatDate(selection.date) : "Select a day"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-primary text-xl leading-none font-semibold tracking-tight tabular-nums">
            {selection?.value ?? 0}
          </span>
          <span className="text-muted-foreground text-[11px]">alerts</span>
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${severity.className}`}
          >
            {severity.label}
          </span>
        </div>
      </div>

      <EChartsHeatmapChart
        className="mt-3 min-h-0 w-full flex-1"
        data={chartData}
        config={chartConfig}
        range={["2025-10-01", "2025-12-31"]}
        thresholds={[INCIDENT_AT, MAJOR_AT]}
        defaultSelectedDate={WORST.date}
        onSelectionChange={setSelection}
      >
        <EChartsHeatmapChart.Cell dataKey="alerts" radius={4} gap={4} isClickable />
        <EChartsHeatmapChart.MonthLabel />
        <EChartsHeatmapChart.DayLabel />
        <EChartsHeatmapChart.Tooltip variant="frosted-glass" />
        <EChartsHeatmapChart.Legend lessLabel="Quiet" moreLabel="Major" />
      </EChartsHeatmapChart>

      <div className="text-muted-foreground mt-2 flex items-center gap-3 text-[11px]">
        <span>
          <span className="text-primary font-medium tabular-nums">{TOTAL}</span> alerts
        </span>
        <span className="bg-border h-3 w-px" />
        <span>
          <span className="text-primary font-medium tabular-nums">{INCIDENT_DAYS}</span> incident
          days
        </span>
        <span className="bg-border h-3 w-px" />
        <span>Click a day for details</span>
      </div>
    </div>
  );
}

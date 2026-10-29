"use client";

import {
  EChartsHeatmapChart,
  type ChartConfig,
  type HeatmapDatum,
  type HeatmapSelection,
} from "@/registry/charts/echarts-heatmap-chart";
import { useState } from "react";

const YEAR_START = Date.UTC(2025, 0, 1);
const YEAR_END = Date.UTC(2025, 11, 31);
const DAY_MS = 86_400_000;

// The weekly plan, Sunday first: what each day is for and roughly how long it runs.
const PLAN = [
  { activity: "Walk", minutes: 30, odds: 0.15 },
  { activity: "Strength", minutes: 50, odds: 0.85 },
  { activity: "Run", minutes: 35, odds: 0.8 },
  { activity: "Yoga", minutes: 25, odds: 0.6 },
  { activity: "Strength", minutes: 50, odds: 0.8 },
  { activity: "Run", minutes: 35, odds: 0.65 },
  { activity: "Long run", minutes: 75, odds: 0.75 },
];

function activityOf(date: string) {
  return PLAN[new Date(Date.parse(`${date}T00:00:00Z`)).getUTCDay()].activity;
}

// A year of workouts in minutes, seeded: a keen January, a two-week summer
// break, and a strong finish so the current streak is still running.
function buildWorkouts(seed: number): HeatmapDatum[] {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  const data: HeatmapDatum[] = [];
  for (let ms = YEAR_START; ms <= YEAR_END; ms += DAY_MS) {
    const day = new Date(ms);
    const plan = PLAN[day.getUTCDay()];
    const isBreak = ms >= Date.UTC(2025, 7, 4) && ms <= Date.UTC(2025, 7, 17);
    const isKeen = ms < Date.UTC(2025, 1, 1) || ms >= Date.UTC(2025, 11, 1);
    const odds = isKeen ? Math.min(1, plan.odds + 0.25) : plan.odds;
    if (isBreak || random() >= odds) continue;
    const minutes = plan.minutes * (0.7 + random() * 0.6);
    data.push({ date: day.toISOString().slice(0, 10), value: Math.round(minutes / 5) * 5 });
  }
  return data;
}

const chartData = buildWorkouts(9);

const chartConfig = {
  minutes: {
    label: "Minutes",
    colors: {
      light: ["#ddd6fe", "#a78bfa", "#7c3aed", "#4c1d95"],
      dark: ["#3b0764", "#7c3aed", "#a78bfa", "#ede9fe"],
    },
  },
} satisfies ChartConfig;

// Pinned levels in minutes: a short session, a normal one, a long one, and a long run.
const THRESHOLDS = [30, 45, 65];

const active = new Set(chartData.map((day) => day.date));
const SESSIONS = chartData.length;
const STREAKS = (() => {
  let longest = 0;
  let run = 0;
  for (let ms = YEAR_START; ms <= YEAR_END; ms += DAY_MS) {
    run = active.has(new Date(ms).toISOString().slice(0, 10)) ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  return { current: run, longest };
})();
const HOURS = Math.round(chartData.reduce((sum, day) => sum + day.value, 0) / 60);
// Sessions per activity, busiest first — the bars under the calendar.
const BY_ACTIVITY = (() => {
  const counts = new Map<string, number>();
  for (const day of chartData) {
    const activity = activityOf(day.date);
    counts.set(activity, (counts.get(activity) ?? 0) + 1);
  }
  return [...counts]
    .map(([name, sessions]) => ({ name, sessions }))
    .sort((a, b) => b.sessions - a.sessions);
})();
const TOP_SESSIONS = BY_ACTIVITY[0].sessions;

function formatDate(date: string) {
  return new Date(Date.parse(`${date}T00:00:00Z`)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function EChartsWorkoutsHeatmapChart() {
  const [selection, setSelection] = useState<HeatmapSelection | null>(null);
  const selectedActivity = selection && selection.value > 0 ? activityOf(selection.date) : null;

  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-[11px]">
            {selection ? formatDate(selection.date) : "Workouts · 2025"}
          </span>
          <span className="text-primary text-sm font-medium">
            {selection ? (selectedActivity ?? "Rest day") : "Click a day for details"}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-primary text-xl leading-none font-semibold tracking-tight tabular-nums">
            {selection ? selection.value : HOURS}
          </span>
          <span className="text-muted-foreground text-[11px]">{selection ? "min" : "hours"}</span>
        </div>
      </div>

      <EChartsHeatmapChart
        className="mt-3 min-h-0 w-full flex-1"
        data={chartData}
        config={chartConfig}
        range={2025}
        thresholds={THRESHOLDS}
        onSelectionChange={setSelection}
      >
        <EChartsHeatmapChart.Cell dataKey="minutes" radius={2} gap={2} isClickable />
        <EChartsHeatmapChart.MonthLabel />
        <EChartsHeatmapChart.DayLabel />
        <EChartsHeatmapChart.Tooltip variant="frosted-glass" />
        <EChartsHeatmapChart.Legend lessLabel="Short" moreLabel="Long" />
      </EChartsHeatmapChart>

      <div className="mt-3 hidden grid-cols-[1fr_auto] gap-6 border-t pt-3 sm:grid">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground mb-1 text-[11px]">Sessions by activity</span>
          {BY_ACTIVITY.map((activity) => (
            <div key={activity.name} className="flex items-center gap-2 text-[11px]">
              <span
                className={
                  activity.name === selectedActivity
                    ? "text-primary w-14 font-medium"
                    : "text-muted-foreground w-14"
                }
              >
                {activity.name}
              </span>
              <div className="h-1.5 flex-1">
                <div
                  className={
                    activity.name === selectedActivity
                      ? "h-full rounded-full bg-violet-500"
                      : "h-full rounded-full bg-violet-500/35"
                  }
                  style={{ width: `${(activity.sessions / TOP_SESSIONS) * 100}%` }}
                />
              </div>
              <span className="text-primary w-6 text-right tabular-nums">{activity.sessions}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-between gap-2">
          {[
            { label: "Sessions", value: SESSIONS },
            { label: "Current streak", value: `${STREAKS.current}d` },
            { label: "Longest streak", value: `${STREAKS.longest}d` },
          ].map((stat) => (
            <div key={stat.label} className="flex items-baseline justify-between gap-4">
              <span className="text-muted-foreground text-[11px]">{stat.label}</span>
              <span className="text-primary text-sm font-semibold tabular-nums">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

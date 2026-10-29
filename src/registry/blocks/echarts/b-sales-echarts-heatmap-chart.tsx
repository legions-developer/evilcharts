"use client";

import {
  EChartsHeatmapChart,
  type ChartConfig,
  type HeatmapDatum,
} from "@/registry/charts/echarts-heatmap-chart";

const YEAR_START = Date.UTC(2025, 0, 1);
const YEAR_END = Date.UTC(2025, 11, 31);
const DAY_MS = 86_400_000;
const AVERAGE_ORDER = 42; // dollars per order, turns the order count into revenue

// How busy each month runs relative to a normal one: a summer lull, then the holiday rush.
const SEASON = [0.85, 0.8, 0.9, 0.95, 1, 0.95, 0.85, 0.6, 1, 1.05, 1.15, 1.5];
// Days that break the pattern on purpose, so the calendar has something to find.
const EVENTS: Record<string, { name: string; orders: number }> = {
  "2025-02-14": { name: "Valentine's Day", orders: 95 },
  "2025-11-28": { name: "Black Friday", orders: 320 },
  "2025-12-01": { name: "Cyber Monday", orders: 210 },
};
const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// A year of daily orders for an online shop, seeded — weekends sell about twice as much.
function buildOrders(seed: number): HeatmapDatum[] {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  const data: HeatmapDatum[] = [];
  for (let ms = YEAR_START; ms <= YEAR_END; ms += DAY_MS) {
    const day = new Date(ms);
    const date = day.toISOString().slice(0, 10);
    const weekday = day.getUTCDay();
    const isWeekend = weekday === 0 || weekday === 6;
    // The week between Christmas and New Year is quiet once shipping cuts off.
    const season = ms >= Date.UTC(2025, 11, 24) ? 0.45 : SEASON[day.getUTCMonth()];
    const base = 22 + random() * 14;
    data.push({
      date,
      value: EVENTS[date]?.orders ?? Math.round(base * season * (isWeekend ? 1.9 : 1)),
    });
  }
  return data;
}

const chartData = buildOrders(4242);

// Pinned levels so a normal weekday, a weekend, the holiday rush, and the sale
// days each get their own shade — a quantile ramp would flatten the peaks.
const THRESHOLDS = [40, 75, 150];

const chartConfig = {
  orders: {
    label: "Orders",
    colors: {
      light: ["#fde68a", "#fbbf24", "#d97706", "#92400e"],
      dark: ["#451a03", "#b45309", "#f59e0b", "#fef3c7"],
    },
  },
} satisfies ChartConfig;

const TOTAL = chartData.reduce((sum, day) => sum + day.value, 0);
const BEST = chartData.reduce((best, day) => (day.value > best.value ? day : best), chartData[0]);
// Average orders per weekday, Monday first, leaving the sale days out so they
// don't skew the week they land in.
const BY_WEEKDAY = (() => {
  const sums = Array.from({ length: 7 }, () => ({ orders: 0, days: 0 }));
  for (const day of chartData) {
    if (day.date in EVENTS) continue;
    const slot = sums[(new Date(Date.parse(`${day.date}T00:00:00Z`)).getUTCDay() + 6) % 7];
    slot.orders += day.value;
    slot.days += 1;
  }
  return sums.map((slot, index) => ({
    name: WEEKDAY_NAMES[index],
    average: slot.orders / slot.days,
    isWeekend: index >= 5,
  }));
})();
const PEAK_AVERAGE = Math.max(...BY_WEEKDAY.map((day) => day.average));
const average = (days: typeof BY_WEEKDAY) =>
  days.reduce((sum, day) => sum + day.average, 0) / days.length;
const WEEKEND_LIFT =
  average(BY_WEEKDAY.filter((day) => day.isWeekend)) /
    average(BY_WEEKDAY.filter((day) => !day.isWeekend)) -
  1;
const PEAK_DAYS = Object.entries(EVENTS).sort(([, a], [, b]) => b.orders - a.orders);

function formatDate(date: string) {
  return new Date(Date.parse(`${date}T00:00:00Z`)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function EChartsSalesHeatmapChart() {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-[11px]">Revenue · 2025</span>
          <span className="text-primary text-xl leading-none font-semibold tracking-tight tabular-nums">
            ${((TOTAL * AVERAGE_ORDER) / 1000).toFixed(0)}k
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-[11px]">Best day</span>
          <span className="text-primary text-xl leading-none font-semibold tracking-tight">
            {formatDate(BEST.date)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-[11px]">Weekend lift</span>
          <span className="text-primary text-xl leading-none font-semibold tracking-tight tabular-nums">
            +{Math.round(WEEKEND_LIFT * 100)}%
          </span>
        </div>
      </div>

      <EChartsHeatmapChart
        className="mt-4 min-h-0 w-full flex-1"
        data={chartData}
        config={chartConfig}
        range={2025}
        weekStart="monday"
        thresholds={THRESHOLDS}
      >
        <EChartsHeatmapChart.Cell dataKey="orders" radius={2} gap={2} />
        <EChartsHeatmapChart.MonthLabel />
        <EChartsHeatmapChart.DayLabel labels={["Sun", "Mon", "", "Wed", "", "Fri", ""]} />
        <EChartsHeatmapChart.Tooltip />
        <EChartsHeatmapChart.Legend align="left" lessLabel="Quiet" moreLabel="Sale days" />
      </EChartsHeatmapChart>

      <div className="mt-3 hidden grid-cols-2 gap-6 border-t pt-3 sm:grid">
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-[11px]">Avg orders by weekday</span>
          <div className="flex h-12 items-end gap-1.5">
            {BY_WEEKDAY.map((day) => (
              <div key={day.name} className="flex h-full flex-1 flex-col justify-end gap-1">
                <div
                  className={
                    day.isWeekend ? "rounded-sm bg-amber-500" : "rounded-sm bg-amber-500/30"
                  }
                  style={{ height: `${(day.average / PEAK_AVERAGE) * 100}%` }}
                />
                <span className="text-muted-foreground text-center text-[10px] leading-none">
                  {day.name}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-[11px]">Peak days</span>
          <ul className="flex flex-col gap-1.5">
            {PEAK_DAYS.map(([date, event]) => (
              <li key={date} className="flex items-baseline gap-2 text-[11px]">
                <span className="text-primary font-medium">{event.name}</span>
                <span className="text-muted-foreground">{formatDate(date)}</span>
                <span className="text-primary ml-auto font-medium tabular-nums">
                  {event.orders}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

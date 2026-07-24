"use client";

import { EChartsRadialChart, type ChartConfig } from "@/registry/charts/echarts-radial-chart";
import { cn } from "@/lib/utils";

function BikeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <circle cx="15.5" cy="4.5" r="1" />
      <path d="M12 17.5V14L9 11l4-3 2 3h2.5" />
    </svg>
  );
}

function MountainIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2.5 19h19L14 5.5l-3.5 6.5L8.5 9.5 2.5 19Z" />
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13 2 5 13h6l-1 9 8-11h-6l1-9Z" />
    </svg>
  );
}

function GaugeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3.5 17.5a8.5 8.5 0 1 1 17 0" />
      <path d="M12 17.5 15.5 10.5" />
      <circle cx="12" cy="17.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SprintIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 14.5 12 8.5l6 6" />
      <path d="M6 19.5 12 13.5l6 6" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 14.2A8.4 8.4 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" />
    </svg>
  );
}

const RIDE = { distance: 18.4, goal: 25, unit: "km" };

const METRICS = [
  {
    name: "elevation",
    value: 312,
    goal: 450,
    unit: "m",
    icon: MountainIcon,
    tint: "text-[#0284c7] dark:text-[#38bdf8]",
  },
  {
    name: "energy",
    value: 684,
    goal: 1200,
    unit: "kJ",
    icon: BoltIcon,
    tint: "text-[#d97706] dark:text-[#fbbf24]",
  },
  {
    name: "cadence",
    value: 82,
    goal: 95,
    unit: "rpm",
    icon: GaugeIcon,
    tint: "text-[#e11d48] dark:text-[#fb7185]",
  },
];

const SPLITS = [
  {
    name: "sprints",
    label: "Sprints",
    value: "7",
    unit: "efforts",
    icon: SprintIcon,
    tint: "text-[#7c3aed] dark:text-[#a78bfa]",
  },
  {
    name: "recovery",
    label: "Recovery",
    value: "46",
    unit: "min",
    icon: MoonIcon,
    tint: "text-[#0284c7] dark:text-[#38bdf8]",
  },
];

const chartConfig = {
  elevation: {
    label: "Elevation",
    colors: { light: ["#0ea5e9", "#0284c7"], dark: ["#38bdf8", "#0ea5e9"] },
  },
  energy: {
    label: "Energy",
    colors: { light: ["#f59e0b", "#d97706"], dark: ["#fbbf24", "#f59e0b"] },
  },
  cadence: {
    label: "Cadence",
    colors: { light: ["#f43f5e", "#e11d48"], dark: ["#fb7185", "#f43f5e"] },
  },
} satisfies ChartConfig;

const share = (value: number, goal: number) => Math.round((value / goal) * 100);

export function EChartsRideRadialChart() {
  return (
    <div className="flex h-full w-full flex-col gap-4 p-4 sm:flex-row sm:gap-5">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <BikeIcon className="size-6 text-[#7c3aed] sm:size-7 dark:text-[#a78bfa]" />

          <div className="flex items-baseline gap-1.5">
            <span className="text-primary text-3xl leading-none font-semibold tracking-tight tabular-nums sm:text-4xl">
              {RIDE.distance}
            </span>
            <span className="text-muted-foreground text-sm font-medium">{RIDE.unit} ridden</span>
          </div>

          <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-[#7c3aed] dark:bg-[#a78bfa]"
              style={{ width: `${share(RIDE.distance, RIDE.goal)}%` }}
            />
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-3 gap-2 border-t pt-3">
          {METRICS.map(({ name, value, goal, unit, icon: Icon, tint }) => (
            <div key={name} className="flex min-h-0 flex-col items-center justify-center gap-2">
              <div className="relative aspect-square w-full max-w-[104px]">
                <EChartsRadialChart
                  data={[{ name, value: share(value, goal) }]}
                  config={chartConfig}
                  nameKey="name"
                  max={100}
                  innerRadius="70%"
                  outerRadius="100%"
                  className="h-full w-full"
                >
                  <EChartsRadialChart.RadialBar dataKey="value" barSize={9} cornerRadius={6} />
                </EChartsRadialChart>

                <span
                  className={cn(
                    "pointer-events-none absolute inset-0 flex items-center justify-center",
                    tint,
                  )}
                >
                  <Icon className="size-5 sm:size-6" />
                </span>
              </div>

              <div className="flex shrink-0 items-baseline gap-1">
                <span className="text-primary text-sm font-semibold tabular-nums sm:text-base">
                  {value}
                </span>
                <span className="text-muted-foreground text-[11px]">{unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 gap-3 border-t pt-3 sm:w-[34%] sm:max-w-60 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5">
        {SPLITS.map(({ name, label, value, unit, icon: Icon, tint }, index) => (
          <div
            key={name}
            className={cn(
              "flex flex-1 flex-col justify-between gap-3",
              index > 0 && "border-l pl-3",
            )}
          >
            <Icon className={cn("size-5 shrink-0 sm:size-6", tint)} />

            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
                {label}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-primary text-xl leading-none font-semibold tabular-nums sm:text-2xl">
                  {value}
                </span>
                <span className="text-muted-foreground text-[11px]">{unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { EvilBarChart, Bar, XAxis, Grid, Tooltip, Legend } from "@/registry/charts/bar-chart";
import { type ChartConfig } from "@/registry/ui/chart";

const chartConfig = {
  desktop: {
    label: "Desktop",
    colors: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
  },
  mobile: {
    label: "Mobile",
    colors: {
      light: ["#be123c"],
      dark: ["#f43f5e"],
    },
  },
} satisfies ChartConfig;

export function EvilExampleBarChart() {
  return (
    <EvilBarChart
      data={[]} // if isLoading is true, pass empty array → i.e isLoading ? [] : data
      config={chartConfig}
      className="h-full w-full p-4"
      isLoading={true} // [!code highlight]
    >
      <Grid />
      <XAxis dataKey="month" tickFormatter={(value) => value.substring(0, 3)} />
      <Legend />
      <Tooltip />
      <Bar dataKey="desktop" variant="default" />
      <Bar dataKey="mobile" variant="default" />
    </EvilBarChart>
  );
}

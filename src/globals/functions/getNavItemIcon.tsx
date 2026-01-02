import { BarChartIcon, ChartStackedAreaIcon, ChartStackedLineIcon } from "@/assets/icons";

// Custom icons for each item in the sidebar of MDX files
export function getNavItemIcon(tag?: string) {
  switch (tag) {
    case "root:area-charts":
      return <ChartStackedAreaIcon />;
    case "root:line-charts":
      return <ChartStackedLineIcon />;
    case "root:bar-charts":
      return <BarChartIcon />;
    default:
      return null;
  }
}

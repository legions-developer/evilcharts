import {
  BarChartIcon,
  ChartStackedAreaIcon,
  ChartStackedLineIcon,
  ComposedChartIcon,
  PieChartIcon,
} from "@/assets/icons";

// Custom icons for each item in the sidebar of MDX files
export function getNavItemIcon(tag?: string) {
  switch (tag) {
    case "root:area-charts":
      return <ChartStackedAreaIcon />;
    case "root:line-charts":
      return <ChartStackedLineIcon />;
    case "root:bar-charts":
      return <BarChartIcon />;
    case "root:composed-charts":
      return <ComposedChartIcon />;
    case "root:pie-charts":
      return <PieChartIcon />;
    default:
      return null;
  }
}

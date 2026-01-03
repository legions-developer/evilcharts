import {
  BarChartIcon,
  ChartStackedAreaIcon,
  ChartStackedLineIcon,
  ComposedChartIcon,
  PieChartIcon,
  RadialChartIcon,
  RadarChartIcon,
  SankeyChartIcon,
} from "@/assets/icons";

// Custom icons for each item in the sidebar of MDX files
export function getNavItemIcon(tag?: string) {
  switch (tag) {
    case "root:area-chart":
      return <ChartStackedAreaIcon />;
    case "root:line-chart":
      return <ChartStackedLineIcon />;
    case "root:bar-chart":
      return <BarChartIcon />;
    case "root:composed-chart":
      return <ComposedChartIcon />;
    case "root:pie-chart":
      return <PieChartIcon />;
    case "root:radial-chart":
      return <RadialChartIcon />;
    case "root:radar-chart":
      return <RadarChartIcon />;
    case "root:sankey-chart":
      return <SankeyChartIcon />;
    default:
      return null;
  }
}

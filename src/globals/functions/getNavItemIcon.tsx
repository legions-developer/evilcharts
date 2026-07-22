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

// Custom icons for each item in the sidebar of MDX files.
// Folder ids arrive as `root:<path>` where path is relative to the content root —
// `root:recharts/area-chart`, `root:echarts/area-chart`, … Matching on the last
// path segment keeps one case per chart type across every provider.
export function getNavItemIcon(tag?: string) {
  const chart = tag?.replace(/^root:/, "").split("/").pop();

  switch (chart) {
    case "area-chart":
      return <ChartStackedAreaIcon />;
    case "line-chart":
      return <ChartStackedLineIcon />;
    case "bar-chart":
      return <BarChartIcon />;
    case "composed-chart":
      return <ComposedChartIcon />;
    case "pie-chart":
      return <PieChartIcon />;
    case "radial-chart":
      return <RadialChartIcon />;
    case "radar-chart":
      return <RadarChartIcon />;
    case "sankey-chart":
      return <SankeyChartIcon />;
    default:
      return null;
  }
}

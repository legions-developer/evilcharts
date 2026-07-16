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
//
// Keyed by chart name rather than by full page-tree id. Chart folders sit under a
// provider segment, so their ids read "root:recharts/area-chart" — matching on the
// last segment keeps one icon per chart type across every provider, and means a new
// provider needs no entries here.
const CHART_ICONS: Record<string, React.ReactNode> = {
  "area-chart": <ChartStackedAreaIcon />,
  "line-chart": <ChartStackedLineIcon />,
  "bar-chart": <BarChartIcon />,
  "composed-chart": <ComposedChartIcon />,
  "pie-chart": <PieChartIcon />,
  "radial-chart": <RadialChartIcon />,
  "radar-chart": <RadarChartIcon />,
  "sankey-chart": <SankeyChartIcon />,
};

export function getNavItemIcon(tag?: string) {
  if (!tag) return null;

  // "root:recharts/area-chart" → "area-chart"
  const chartName = tag.split("/").pop();

  return (chartName && CHART_ICONS[chartName]) ?? null;
}

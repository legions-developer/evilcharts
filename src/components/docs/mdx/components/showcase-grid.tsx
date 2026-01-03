"use client";

import { ComposedPreview } from "@/components/docs/svg-previews/composed-preview";
import { SankeyPreview } from "@/components/docs/svg-previews/sankey-preview";
import { RadialPreview } from "@/components/docs/svg-previews/radial-preview";
import { RadarPreview } from "@/components/docs/svg-previews/radar-preview";
import { LinePreview } from "@/components/docs/svg-previews/line-preview";
import { AreaPreview } from "@/components/docs/svg-previews/area-preview";
import { PiePreview } from "@/components/docs/svg-previews/pie-preview";
import { BarPreview } from "@/components/docs/svg-previews/bar-preview";
import { Grid } from "@/components/docs/svg-previews/background-grid";
import Link from "next/link";

interface Chart {
  name: string;
  description: string;
  Component: React.ComponentType;
  url: string;
}

const CHARTS: Chart[] = [
  {
    name: "Area Chart",
    description: "Highlight trends with filled area ranges.",
    Component: AreaPreview,
    url: "/docs/area-chart",
  },
  {
    name: "Line Chart",
    description: "Track change over time with lines.",
    Component: LinePreview,
    url: "/docs/line-chart",
  },
  {
    name: "Bar Chart",
    description: "Compare categories quickly with bold bars.",
    Component: BarPreview,
    url: "/docs/bar-chart",
  },
  {
    name: "Composed Chart",
    description: "Mix lines, bars, areas in one.",
    Component: ComposedPreview,
    url: "/docs/composed-chart",
  },
  {
    name: "Radar Chart",
    description: "Compare multi-metric profiles on radial axes.",
    Component: RadarPreview,
    url: "/docs/radar-chart",
  },
  {
    name: "Pie Chart",
    description: "Show parts of a whole, clearly.",
    Component: PiePreview,
    url: "/docs/pie-chart",
  },
  {
    name: "Radial Chart",
    description: "Visualize totals in a circular layout.",
    Component: RadialPreview,
    url: "/docs/radial-chart",
  },
  {
    name: "Sankey Chart",
    description: "Show flows between stages with weighted links.",
    Component: SankeyPreview,
    url: "/docs/sankey-chart",
  },
];

interface ShowcaseItemProps {
  Component: React.ComponentType;
  description: string;
  url: string;
  name: string;
}

const ShowcaseItem = ({ name, description, url, Component }: ShowcaseItemProps) => {
  return (
    <Link href={url}>
      <div className="dark:bg-primary-foreground group group cursor-pointer rounded-md bg-[#F5F5F5] p-1">
        <div className="bg-background group-hover:border-primary/20 relative h-40 rounded-[5px] border duration-200">
          <Grid />
          <Component />
        </div>
        <div className="flex flex-col gap-1 px-2 py-2">
          <p className="group-hover:text-primary text-xs font-medium">{name}</p>
          <p className="text-muted-foreground text-[11px]">{description}</p>
        </div>
      </div>
    </Link>
  );
};

const ShowcaseGrid = () => {
  return (
    <div className="mt-6 grid grid-flow-row grid-cols-1 gap-8 sm:grid-cols-2">
      {CHARTS.map(({ name, description, url, Component }) => (
        <ShowcaseItem
          key={name}
          name={name}
          description={description}
          url={url}
          Component={Component}
        />
      ))}
    </div>
  );
};

export { ShowcaseGrid };

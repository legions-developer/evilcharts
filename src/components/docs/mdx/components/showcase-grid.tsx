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
import { DEFAULT_PROVIDER, providerFromPathname } from "@/globals/constants/providers";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface Chart {
  name: string;
  description: string;
  Component: React.ComponentType;
  /** Chart folder name; the provider segment is prepended at render time. */
  slug: string;
}

const CHARTS: Chart[] = [
  {
    name: "Area Chart",
    description: "Highlight trends with filled area ranges.",
    Component: AreaPreview,
    slug: "area-chart",
  },
  {
    name: "Line Chart",
    description: "Track change over time with lines.",
    Component: LinePreview,
    slug: "line-chart",
  },
  {
    name: "Bar Chart",
    description: "Compare categories quickly with bold bars.",
    Component: BarPreview,
    slug: "bar-chart",
  },
  {
    name: "Composed Chart",
    description: "Mix lines, bars, areas in one.",
    Component: ComposedPreview,
    slug: "composed-chart",
  },
  {
    name: "Radar Chart",
    description: "Compare multi-metric profiles on radial axes.",
    Component: RadarPreview,
    slug: "radar-chart",
  },
  {
    name: "Pie Chart",
    description: "Show parts of a whole, clearly.",
    Component: PiePreview,
    slug: "pie-chart",
  },
  {
    name: "Radial Chart",
    description: "Visualize totals in a circular layout.",
    Component: RadialPreview,
    slug: "radial-chart",
  },
  {
    name: "Sankey Chart",
    description: "Show flows between stages with weighted links.",
    Component: SankeyPreview,
    slug: "sankey-chart",
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
        <div className="flex flex-col gap-1 p-2">
          <p className="group-hover:text-primary text-xs font-medium">{name}</p>
          <p className="text-muted-foreground text-[11px]">{description}</p>
        </div>
      </div>
    </Link>
  );
};

const ShowcaseGrid = () => {
  const pathname = usePathname();

  // This grid renders inside a provider's Components page, so link within that
  // provider. Deriving it from the URL means a new provider needs no changes here
  // and no prop threading through MDX.
  const provider = providerFromPathname(pathname) ?? DEFAULT_PROVIDER;

  return (
    <div className="mt-6 grid grid-flow-row grid-cols-1 gap-8 sm:grid-cols-2">
      {CHARTS.map(({ name, description, slug, Component }) => (
        <ShowcaseItem
          key={name}
          name={name}
          description={description}
          url={`/docs/${provider}/${slug}`}
          Component={Component}
        />
      ))}
    </div>
  );
};

export { ShowcaseGrid };

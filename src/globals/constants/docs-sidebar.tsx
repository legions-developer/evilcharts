import { HouseIcon, ShapesIcon, SquareAddonIcon } from "@/assets/icons";

export const getStartedOptions: {
  name: string;
  url: string;
  icon: React.ReactNode;
}[] = [
  {
    name: "Get Started",
    url: "/docs",
    icon: <HouseIcon />,
  },
  {
    name: "Installation",
    url: "/docs/installation",
    icon: <SquareAddonIcon />,
  },
  {
    name: "Components",
    url: "/docs/components",
    icon: <ShapesIcon />,
  },
];

export const EXCLUDED_PAGES: string[] = [
  "/docs/installation",
  "/docs/components",
  "/docs/changelog",
];

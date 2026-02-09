import { HouseIcon, ShapesIcon, SquareAddonIcon } from "@/assets/icons";

interface SidebarOption {
  name: string;
  url: string;
  icon: React.ReactNode;
}

export const getStartedOptions: SidebarOption[] = [
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

export const ChartComponentOptions: SidebarOption[] = [
  {
    name: "Background",
    url: "/docs/ui/background",
    icon: <HouseIcon />,
  },
  {
    name: "Tooltip",
    url: "/docs/ui/tooltip",
    icon: <HouseIcon />,
  },
  {
    name: "Legend",
    url: "/docs/ui/legend",
    icon: <HouseIcon />,
  },
];

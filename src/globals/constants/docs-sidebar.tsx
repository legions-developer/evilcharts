import { HistoryIcon, HouseIcon, ShapesIcon } from "@/assets/icons";

export const getStartedOptions: {
  name: string;
  url: string;
  icon: React.ReactNode;
}[] = [
  {
    name: "Get Started",
    url: "#",
    icon: <HouseIcon />,
  },
  {
    name: "Components",
    url: "#",
    icon: <ShapesIcon />,
  },
  {
    name: "Changelog",
    url: "#",
    icon: <HistoryIcon />,
  },
];

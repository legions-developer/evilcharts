import { SVGProps as ReactOfficialSVGProps } from "react";

export type SVGProps = React.SVGProps<SVGSVGElement>;

export type IconProps = ReactOfficialSVGProps<SVGSVGElement> & {
  secondaryfill?: string;
  strokewidth?: number;
  title?: string;
};

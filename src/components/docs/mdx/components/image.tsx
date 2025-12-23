import Image from "next/image";
import React from "react";

import { cn } from "@/lib/utils";

export const Img = ({ className, alt, ...props }: React.ComponentProps<"img">) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img className={cn("rounded-md", className)} alt={alt} {...props} />
);

export const MDXImage = ({ src, className, width, height, alt, ...props }: React.ComponentProps<"img">) => (
  <Image
    className={cn("mt-6 rounded-md border", className)}
    src={(src as string) || ""}
    width={Number(width)}
    height={Number(height)}
    alt={alt || ""}
    {...props}
  />
);

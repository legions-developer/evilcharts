import React from "react";

import { cn } from "@/lib/utils";

export const P = ({ className, ...props }: React.ComponentProps<"p">) => (
  <p className={cn("leading-relaxed not-first:mt-6", className)} {...props} />
);

export const Strong = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <strong className={cn("font-medium", className)} {...props} />
);

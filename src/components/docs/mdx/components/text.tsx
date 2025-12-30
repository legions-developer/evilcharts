import React from "react";

import { cn } from "@/lib/utils";

export const P = ({ className, ...props }: React.ComponentProps<"p">) => (
  <p className={cn("leading-relaxed not-first:mt-4.5", className)} {...props} />
);

export const Description = ({ className, ...props }: React.ComponentProps<"p">) => (
  <p className={cn("text-muted-foreground", className)} {...props} />
);

export const Strong = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
  <strong className={cn("font-medium", className)} {...props} />
);

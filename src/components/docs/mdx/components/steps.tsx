import React from "react";

import { cn } from "@/lib/utils";

export const Step = ({ className, ...props }: React.ComponentProps<"h3">) => (
  <h3 className={cn("font-heading mt-8 scroll-m-32 text-xl font-medium tracking-tight", className)} {...props} />
);

export const Steps = ({ ...props }) => (
  <div className="[&>h3]:step steps mb-12 [counter-reset:step] *:[h3]:first:mt-0!" {...props} />
);

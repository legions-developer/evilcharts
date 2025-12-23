import React from "react";

import { cn } from "@/lib/utils";

export const Blockquote = ({ className, ...props }: React.ComponentProps<"blockquote">) => (
  <blockquote className={cn("mt-6 border-l-2 pl-6 italic", className)} {...props} />
);

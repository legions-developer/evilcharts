import React from "react";

import { cn } from "@/lib/utils";

export const Ul = ({ className, ...props }: React.ComponentProps<"ul">) => (
  <ul className={cn("my-6 ml-6 list-disc", className)} {...props} />
);

export const Ol = ({ className, ...props }: React.ComponentProps<"ol">) => (
  <ol className={cn("my-6 ml-6 list-decimal", className)} {...props} />
);

export const Li = ({ className, ...props }: React.ComponentProps<"li">) => (
  <li className={cn("mt-2", className)} {...props} />
);

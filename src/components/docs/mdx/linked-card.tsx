import Link from "next/link";
import React from "react";

import { cn } from "@/lib/utils";

export const LinkedCard = ({ className, ...props }: React.ComponentProps<typeof Link>) => (
  <Link
    className={cn(
      "bg-surface text-surface-foreground hover:bg-surface/80 flex w-full flex-col items-center rounded-xl p-6 transition-colors sm:p-10",
      className,
    )}
    {...props}
  />
);

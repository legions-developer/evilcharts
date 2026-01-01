"use client";

import * as React from "react";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsiblePanel,
} from "@/components/ui/base-collapsible";
import { cn } from "@/lib/utils";

export function CodeCollapsibleWrapper({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Collapsible>) {
  const [isOpened, setIsOpened] = React.useState(false);

  return (
    <Collapsible
      className={cn("group/collapsible relative", className)}
      onOpenChange={setIsOpened}
      open={isOpened}
      {...props}
    >
      <CollapsiblePanel
        className="relative h-full overflow-hidden data-closed:max-h-64 [&>figure]:mt-0 [&>figure]:md:mx-0!"
        hidden={false}
        keepMounted
      >
        {children}
      </CollapsiblePanel>
      <CollapsibleTrigger className="to-background text-muted-foreground hover:[&>div]:border-primary/50 hover:text-foreground absolute inset-x-0 -bottom-1 flex h-16 cursor-pointer items-end justify-end bg-linear-to-b from-transparent via-50% text-sm font-medium transition-colors group-data-open/collapsible:hidden">
        <div className="bg-background mr-4 mb-4 rounded-md border px-2 py-0.5 font-normal shadow-[0px_0px_8px_20px_var(--color-background)]/50 duration-200">
          {isOpened ? "Collapse" : "Expand"}
        </div>
      </CollapsibleTrigger>
      {isOpened && (
        <CollapsibleTrigger className="text-muted-foreground hover:border-primary/50 hover:text-foreground bg-background absolute right-4 bottom-4 cursor-pointer rounded-md border px-2 py-0.5 text-sm font-normal shadow-sm transition-colors">
          Collapse
        </CollapsibleTrigger>
      )}
    </Collapsible>
  );
}

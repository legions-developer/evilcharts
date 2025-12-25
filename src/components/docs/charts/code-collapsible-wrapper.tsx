"use client";

import * as React from "react";

import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@/components/ui/base-collapsible";
import { cn } from "@/lib/utils";

export function CodeCollapsibleWrapper({ className, children, ...props }: React.ComponentProps<typeof Collapsible>) {
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
      <CollapsibleTrigger className="via-background/90 to-background/90 text-muted-foreground hover:text-foreground absolute inset-x-0 -bottom-2 flex h-16 cursor-pointer items-center justify-center rounded-b-lg bg-linear-to-b from-transparent via-50% text-sm font-medium transition-colors group-data-open/collapsible:hidden">
        <div className="bg-background rounded-md border px-2 py-0.5">{isOpened ? "Collapse" : "Expand"}</div>
      </CollapsibleTrigger>
    </Collapsible>
  );
}

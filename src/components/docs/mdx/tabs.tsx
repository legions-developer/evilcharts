import * as TabsPrimitive from "@radix-ui/react-tabs";
import React from "react";

import {
  Tabs as TabsRoot,
  TabsList as TabsListRoot,
  TabsTrigger as TabsTriggerRoot,
  TabsContent as TabsContentRoot,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const MDXTabs = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) => {
  return <TabsRoot className={cn("relative mt-6 w-full", className)} {...props} />;
};

export const MDXTabsList = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsListRoot className={cn("justify-start gap-4 rounded-none bg-transparent px-0", className)} {...props} />
);

export const MDXTabsTrigger = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) => (
  <TabsTriggerRoot
    className={cn(
      "text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-primary dark:data-[state=active]:border-primary hover:text-primary rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-3 text-base data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent",
      className,
    )}
    {...props}
  />
);

export const MDXTabsContent = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) => (
  <TabsContentRoot
    className={cn(
      "relative [&_h3.font-heading]:text-base [&_h3.font-heading]:font-medium *:[figure]:first:mt-0 [&>.steps]:mt-6",
      className,
    )}
    {...props}
  />
);

export const MDXTab = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div className={cn(className)} {...props} />
);

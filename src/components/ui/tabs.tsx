"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "@/lib/utils";

type TabsVariant = "default" | "underline";

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      className={cn("flex flex-col gap-2 data-[orientation=vertical]:flex-row", className)}
      data-slot="tabs"
      {...props}
    />
  );
}

function TabsList({
  variant = "default",
  indicatorClassName,
  className,
  children,
  ...props
}: TabsPrimitive.List.Props & {
  variant?: TabsVariant;
  indicatorClassName?: string;
}) {
  return (
    <TabsPrimitive.List
      className={cn(
        "text-muted-foreground relative z-0 flex w-fit items-center justify-center gap-x-0.5",
        "data-[orientation=vertical]:flex-col",
        variant === "default"
          ? "bg-muted text-muted-foreground/72 rounded-lg p-0.5"
          : "*:data-[slot=tabs-trigger]:hover:bg-accent/50 data-[orientation=horizontal]:py-1 data-[orientation=vertical]:px-1",
        className,
      )}
      data-slot="tabs-list"
      {...props}
    >
      {children}
      <TabsPrimitive.Indicator
        className={cn(
          "absolute bottom-0 left-0 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) -translate-y-(--active-tab-bottom) transition-[width,translate] duration-200 ease-in-out",
          variant === "underline"
            ? "bg-primary! z-10 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:translate-y-px data-[orientation=vertical]:w-0.5 data-[orientation=vertical]:-translate-x-px"
            : "bg-background dark:bg-accent -z-1 rounded-md shadow-sm",
          indicatorClassName,
        )}
        data-slot="tab-indicator"
      />
    </TabsPrimitive.List>
  );
}

function TabsTab({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        "focus-visible:ring-ring select-none flex shrink-0 grow cursor-pointer items-center justify-center rounded-md text-xs font-medium whitespace-nowrap transition-[color,background-color,box-shadow] outline-none focus-visible:ring-2 data-disabled:pointer-events-none data-disabled:opacity-64 [&_svg]:pointer-events-none [&_svg]:-mx-0.5 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4",
        "hover:text-primary data-active:text-foreground",
        "h-6 gap-1.5 px-[calc(--spacing(2.5)-1px)]",
        "data-[orientation=vertical]:w-full data-[orientation=vertical]:justify-start",
        className,
      )}
      data-slot="tabs-trigger"
      {...props}
    />
  );
}

function TabsPanel({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      className={cn("flex-1 outline-none", className)}
      data-slot="tabs-content"
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTab, TabsTab as TabsTrigger, TabsPanel, TabsPanel as TabsContent };

import React from "react";

import { cn } from "@/lib/utils";

export const Table = ({ className, ...props }: React.ComponentProps<"table">) => (
  <div className="no-scrollbar my-6 w-full overflow-y-auto rounded-lg border">
    <table
      className={cn(
        "relative w-full overflow-hidden border-none text-sm [&_tbody_tr:last-child]:border-b-0",
        className,
      )}
      {...props}
    />
  </div>
);

export const Tr = ({ className, ...props }: React.ComponentProps<"tr">) => (
  <tr className={cn("m-0 border-b", className)} {...props} />
);

export const Th = ({ className, ...props }: React.ComponentProps<"th">) => (
  <th
    className={cn("px-4 py-2 text-left font-bold [[align=center]]:text-center [[align=right]]:text-right", className)}
    {...props}
  />
);

export const Td = ({ className, ...props }: React.ComponentProps<"td">) => (
  <td
    className={cn(
      "px-4 py-2 text-left whitespace-nowrap [[align=center]]:text-center [[align=right]]:text-right",
      className,
    )}
    {...props}
  />
);

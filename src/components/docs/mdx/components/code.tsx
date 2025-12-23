import React from "react";

import { cn } from "@/lib/utils";

export const Pre = ({ className, children, ...props }: React.ComponentProps<"pre">) => {
  console.log("pre:", children);
  return (
    <pre
      className={cn(
        "no-scrollbar min-w-0 overflow-x-auto p-4 text-[13px] leading-relaxed outline-none has-data-highlighted-line:px-0 has-data-line-numbers:px-0 has-data-[slot=tabs]:p-0",
        "[&>code>span.highlighted]:inline-flex",
        className,
      )}
      {...props}
    >
      {children}
    </pre>
  );
};

export const Figure = ({ className, ...props }: React.ComponentProps<"figure">) => {
  return <figure className={cn(className)} {...props} />;
};

export const Figcaption = ({ className, children, ...props }: React.ComponentProps<"figcaption">) => {
  return (
    <figcaption
      className={cn(
        "text-code-foreground [&_svg]:text-code-foreground flex items-center gap-2 [&_svg]:size-4 [&_svg]:opacity-70",
        className,
      )}
      {...props}
    >
      {children}
    </figcaption>
  );
};

export const Code = ({ className, ...props }: React.ComponentProps<"code">) => {
  // Inline Code.
  if (typeof props.children === "string") {
    return (
      <code
        className={cn(
          "bg-muted relative rounded-md px-[0.3rem] py-[0.2rem] font-mono text-[0.8rem] wrap-break-word outline-none",
          className,
        )}
        {...props}
      />
    );
  }

  // Default codeblock.
  return <code {...props} />;
};

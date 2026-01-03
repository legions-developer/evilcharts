import Link from "next/link";
import React from "react";

import { LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const A = ({ className, ...props }: React.ComponentProps<"a">) => (
  <a className={cn("font-medium underline underline-offset-4", className)} {...props} />
);

export const MDXLink = ({
  children,
  className,
  href,
  _blank,
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
  _blank?: boolean;
}) => {
  return (
    <Link
      href={href}
      target={_blank ? "_blank" : "_self"}
      className={cn(className, "hover:text-primary group")}
    >
      <span className="relative">
        <span className="bg-primary/50 group-hover:bg-primary absolute -bottom-[0.5px] h-px w-full rounded transition-all duration-100 group-hover:w-full"></span>
        {children}
      </span>
      <LinkIcon className="group-hover:text-primary text-muted-foreground mb-0.5 ml-0.5 inline size-2.5 duration-100" />
    </Link>
  );
};

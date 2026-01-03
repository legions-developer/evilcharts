import { cn } from "@/lib/utils";
import React from "react";

interface ApiReferenceProps {
  children: React.ReactNode;
  className?: string;
}

export function ApiReferenceWrapper({ children, className }: ApiReferenceProps) {
  return <div className={cn("mt-6 flex flex-col gap-4", className)}>{children}</div>;
}

export function ApiReference({ children, className }: ApiReferenceProps) {
  return <div className={cn("flex flex-col", className)}>{children}</div>;
}

interface ApiHeaderProps {
  propName: string;
  isRequired?: boolean;
  propType: string;
}

export function ApiHeader({ propName, isRequired }: ApiHeaderProps) {
  return (
    <div className="flex flex-row items-center justify-between">
      <div className="dark:bg-muted/30 bg-muted flex w-full flex-row items-center justify-between gap-2 rounded-md px-3 py-2">
        <span className="text-primary font-mono text-sm">{propName}</span>
        {isRequired && (
          <span className="rounded-md bg-rose-500/5 px-2 py-0.5 text-[10px] text-rose-500">
            Required
          </span>
        )}
      </div>
    </div>
  );
}

interface ApiContentProps {
  children: React.ReactNode;
}

export function ApiContent({ children }: ApiContentProps) {
  return (
    <div className="text-muted-foreground p-3 text-[13px] [&>p]:not-first:mt-3">{children}</div>
  );
}

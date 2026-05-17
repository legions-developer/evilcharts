"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  stepNumber?: number;
}

interface StepContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function Steps({ className, children, ...props }: StepsProps) {
  const stepsArray = React.Children.toArray(children);

  return (
    <div className={cn("relative mt-4", className)} {...props}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement<StepProps>(child)) return null;

        const isLastStep = index === stepsArray.length - 1;

        return (
          <div key={index} className="relative">
            <div
              className={cn(
                "bg-border absolute top-[26px] left-[12px] h-full w-px",
                isLastStep && "from-border via-border/50 bg-gradient-to-b to-transparent",
              )}
              aria-hidden="true"
            />
            {React.cloneElement(child, {
              ...child.props,
              stepNumber: index + 1,
              className: cn(child.props.className, "relative"),
            })}
          </div>
        );
      })}
    </div>
  );
}

const StepTitle = ({ className, children }: { className?: string; children: string }) => {
  return (
    <h3 className={cn(className, "text-primary pt-0.5 text-[15px]! font-medium not-first:mt-2")}>
      {children}
    </h3>
  );
};

const StepDescription = ({ className, children }: { className?: string; children: string }) => {
  return (
    <div
      className={cn(
        className,
        "text-muted-foreground text-sm font-normal not-first:mt-4 [&>p]:leading-relaxed",
      )}
    >
      {children}
    </div>
  );
};

function Step({ stepNumber, className, children, ...props }: StepProps & { stepNumber?: number }) {
  return (
    <div className={cn("mt-6 pl-9", className)} {...props}>
      {/* Step number circle */}
      <div className="bg-border text-primary jetbrains absolute top-0.5 left-0 flex size-6 items-center justify-center rounded-md text-xs">
        {stepNumber}
      </div>
      <div>{children}</div>
    </div>
  );
}

function StepContent({ children, ...props }: StepContentProps) {
  return (
    <div className={cn("flex flex-col gap-4 py-4", props.className)} {...props}>
      {children}
    </div>
  );
}

export { Steps, Step, StepTitle, StepContent, StepDescription };

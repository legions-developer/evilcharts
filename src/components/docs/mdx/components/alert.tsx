import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { AlertIcon, CheckboxCheckedIcon, InfoIcon, WarningIcon } from "@/assets/icons";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full mt-4 rounded-md p-1 text-sm flex flex-col has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "text-primary dark:bg-primary-foreground bg-[#F5F5F5]",
        warning: "text-amber-500 dark:bg-primary-foreground bg-amber-500/10",
        info: "text-blue-500 dark:bg-primary-foreground bg-blue-500/10",
        error: "text-red-500 dark:bg-primary-foreground bg-red-500/10",
        success: "text-green-500 dark:bg-primary-foreground bg-green-500/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const descriptionVariants = cva(
  "text-muted-foreground! bg-background flex w-full flex-col gap-1.5 rounded-[5px] border p-3 text-[13px] [&_p]:leading-6 [&_ul]:list-inside [&_ul]:list-disc [&_ul]:text-[13px]",
  {
    variants: {
      variant: {
        default: "border-muted-foreground/20 dark:border-border",
        warning: "border-amber-500/20 dark:border-border",
        info: "border-blue-500/20 dark:border-border",
        error: "border-red-500/20 dark:border-border",
        success: "border-green-500/20 dark:border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  children,
  title,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    title?: string;
  }) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <div className="flex items-center gap-2 px-1.5 py-1 select-none">
        <span>{getAlertIcon(variant)}</span>
        <span className="text-[13px]">{title ? title : getAlertTitle(variant)}</span>
      </div>
      {children}
    </div>
  );
}

function AlertContent({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof descriptionVariants>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(descriptionVariants({ variant }), className)}
      {...props}
    />
  );
}

function getAlertIcon(variant: VariantProps<typeof alertVariants>["variant"]) {
  switch (variant) {
    case "default":
      return <AlertIcon />;
    case "warning":
      return <WarningIcon />;
    case "info":
      return <InfoIcon />;
    case "error":
      return <WarningIcon />;
    case "success":
      return <CheckboxCheckedIcon />;
    default:
      return <AlertIcon />;
  }
}

function getAlertTitle(variant: VariantProps<typeof alertVariants>["variant"]) {
  switch (variant) {
    case "default":
      return "Note";
    case "warning":
      return "Warning";
    case "info":
      return "Note";
    case "error":
      return "Error";
    case "success":
      return "Success";
    default:
      return "Note";
  }
}

export { Alert, AlertContent };

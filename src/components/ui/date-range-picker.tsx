"use client";

import { Calendar03Icon, DateTimeIcon, Infinity01Icon } from "@hugeicons/core-free-icons";
import type { DateRange } from "react-day-picker";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CaretDown } from "@carbon/icons-react";
import { cn } from "@/lib/utils";

export type RangeMode = "lifetime" | "custom";

export interface DateRangeValue {
  mode: RangeMode;
  from?: Date;
  to?: Date;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

/** Human label for the current range — drives the split-button's main face. */
function rangeLabel(value: DateRangeValue): string {
  if (value.mode === "lifetime") return "Lifetime";
  if (value.from && value.to) {
    return `${format(value.from, "d MMM yyyy")} – ${format(value.to, "d MMM yyyy")}`;
  }
  if (value.from) return format(value.from, "d MMM yyyy");
  return "Pick a date range";
}

/**
 * Split-button date range control, styled to match the docs "Copy Page" button.
 * The caret dropdown switches mode; in custom mode the main button opens a
 * range Calendar, in lifetime mode it's a static label.
 */
export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const range: DateRange | undefined =
    value.from || value.to ? { from: value.from, to: value.to } : undefined;
  const isCustom = value.mode === "custom";
  const placeholder = isCustom && !value.from;

  const face = (
    <>
      <HugeiconsIcon icon={Calendar03Icon} className="text-muted-foreground size-3.5" />
      <span className={cn(placeholder && "text-muted-foreground")}>{rangeLabel(value)}</span>
    </>
  );

  const faceClass =
    "bg-background text-muted-foreground flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[13px]";

  return (
    <div className="dark:bg-primary-foreground relative flex w-fit rounded-lg bg-[#F5F5F5] p-[2px] select-none">
      {isCustom ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="bg-background hover:bg-background text-muted-foreground hover:text-primary hover:border-primary/20 border px-2.5! duration-0"
            >
              {face}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            <Calendar
              mode="range"
              selected={range}
              onSelect={(next) => onChange({ ...value, from: next?.from, to: next?.to })}
              numberOfMonths={2}
              autoFocus
              disabled={{ after: new Date() }}
            />
          </PopoverContent>
        </Popover>
      ) : (
        <div className={faceClass}>{face}</div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            aria-label="Change date range mode"
            className="text-muted-foreground hover:text-primary bg-transparent px-1! hover:bg-transparent focus-visible:ring-0!"
          >
            <CaretDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background rounded-lg">
          <DropdownMenuItem
            className="hover:bg-muted/50! text-muted-foreground/80 hover:text-primary! cursor-pointer text-[13px]"
            onClick={() => onChange({ mode: "lifetime" })}
          >
            <HugeiconsIcon icon={Infinity01Icon} className="size-3.5" />
            Lifetime
          </DropdownMenuItem>
          <DropdownMenuItem
            className="hover:bg-muted/50! text-muted-foreground/80 hover:text-primary! cursor-pointer text-[13px]"
            onClick={() => onChange({ ...value, mode: "custom" })}
          >
            <HugeiconsIcon icon={DateTimeIcon} className="size-3.5" />
            Custom range
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

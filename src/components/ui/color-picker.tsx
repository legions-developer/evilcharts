"use client";

import { useEffect, useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#facc15",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#a855f7",
  "#3b82f6",
  "#14b8a6",
  "#22c55e",
];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}

/** Popover color picker: native OS picker + hex input + preset swatches. */
export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commitHex = (raw: string) => {
    const trimmed = raw.trim();
    const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    if (HEX_RE.test(hex)) {
      onChange(hex.toLowerCase());
    } else {
      setDraft(value); // revert invalid input
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Pick a color"
          className={cn(
            "focus-visible:border-ring/80 focus-visible:ring-ring/30 size-9 shrink-0 rounded-sm border shadow-xs transition-shadow outline-none",
            className,
          )}
          // Guard the swatch against a malformed `value` reaching the DOM.
          style={{ backgroundColor: HEX_RE.test(value) ? value : undefined }}
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 space-y-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commitHex(draft)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitHex(draft);
          }}
          placeholder="#facc15"
          maxLength={7}
          className="font-mono"
        />
        <div className="grid grid-cols-8 gap-1.5">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={`Use ${preset}`}
              onClick={() => onChange(preset)}
              className={cn(
                "size-5 rounded-md border transition-transform hover:scale-110",
                value.toLowerCase() === preset && "ring-ring ring-2 ring-offset-1",
              )}
              style={{ backgroundColor: preset }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

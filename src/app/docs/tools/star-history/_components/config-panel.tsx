"use client";

import { Calendar03Icon, Clock01Icon, Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AxisType, FillPattern, ThemeName } from "@/lib/star-history/types";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { MAX_AXIS_LABEL_OFFSET } from "@/lib/star-history/query-schema";

import type { StarHistoryConfig } from "../_lib/state";
import { RepoInputList } from "./repo-input-list";

interface ConfigPanelProps {
  config: StarHistoryConfig;
  onChange: (config: StarHistoryConfig) => void;
}

/** Repositories + appearance config. */
export function ConfigPanel({ config, onChange }: ConfigPanelProps) {
  const update = (patch: Partial<StarHistoryConfig>) => onChange({ ...config, ...patch });

  return (
    <div className="flex flex-col gap-8">
      <Section title="Repositories">
        <RepoInputList repos={config.repos} onChange={(repos) => update({ repos })} />
      </Section>

      <Section title="Config">
        {/* Hand-rolled card: each row pads itself so `divide-y` lines run edge
            to edge — a real Card would leave the separators inset. */}
        <div className="bg-muted/20 divide-y rounded-lg border">
          <Row label="Theme" description="Light or dark color scheme for the chart.">
            <Select
              value={config.theme}
              onValueChange={(theme) => update({ theme: theme as ThemeName })}
            >
              <SelectTrigger size="sm" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="light" className="h-8">
                  <HugeiconsIcon icon={Sun01Icon} className="size-3.5" />
                  Light
                </SelectItem>
                <SelectItem value="dark" className="h-8">
                  <HugeiconsIcon icon={Moon02Icon} className="size-3.5" />
                  Dark
                </SelectItem>
              </SelectContent>
            </Select>
          </Row>

          <Row label="X axis" description="Plot stars by calendar date or repo age.">
            <Select
              value={config.axis}
              onValueChange={(axis) => update({ axis: axis as AxisType })}
            >
              <SelectTrigger size="sm" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="date" className="h-8">
                  <HugeiconsIcon icon={Calendar03Icon} className="size-3.5" />
                  Date
                </SelectItem>
                <SelectItem value="timeline" className="h-8">
                  <HugeiconsIcon icon={Clock01Icon} className="size-3.5" />
                  Timeline
                </SelectItem>
              </SelectContent>
            </Select>
          </Row>

          <Row
            label="Axis labels"
            description="Show axis titles beside the date and star ticks."
            htmlFor="sh-axis-labels"
          >
            <Switch
              id="sh-axis-labels"
              checked={config.axisLabels}
              onCheckedChange={(axisLabels) => update({ axisLabels })}
            />
          </Row>

          {config.axisLabels && (
            <Row
              label="Label offset"
              description="Push the axis titles further from the chart."
            >
              <div className="flex w-40 items-center gap-3">
                <Slider
                  value={[config.axisLabelOffset]}
                  min={0}
                  max={MAX_AXIS_LABEL_OFFSET}
                  step={1}
                  onValueChange={([axisLabelOffset]) => update({ axisLabelOffset })}
                />
                <span className="text-muted-foreground w-8 text-right text-xs tabular-nums">
                  {config.axisLabelOffset}
                </span>
              </div>
            </Row>
          )}

          <Row label="Stroke width" description="Thickness of the chart line in pixels.">
            <Select
              value={String(config.strokeWidth)}
              onValueChange={(value) => update({ strokeWidth: Number(value) })}
            >
              <SelectTrigger size="sm" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {[1, 2, 3, 4].map((w) => (
                  <SelectItem key={w} value={String(w)} className="h-8">
                    {w}px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>

          <Row label="Fill opacity" description="Opacity of the area fill under the line.">
            <Select
              value={String(config.fillOpacity)}
              onValueChange={(value) => update({ fillOpacity: Number(value) })}
            >
              <SelectTrigger size="sm" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {[0, 25, 50, 75, 100].map((o) => (
                  <SelectItem key={o} value={String(o)} className="h-8">
                    {o}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>

          <Row label="Fill pattern" description="Style of the area fill under the line.">
            <Select
              value={config.fillPattern}
              onValueChange={(value) => update({ fillPattern: value as FillPattern })}
            >
              <SelectTrigger size="sm" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="gradient" className="h-8">
                  Gradient
                </SelectItem>
                <SelectItem value="solid" className="h-8">
                  Solid
                </SelectItem>
                <SelectItem value="hatched" className="h-8">
                  Hatched
                </SelectItem>
                <SelectItem value="lines" className="h-8">
                  Lines
                </SelectItem>
                <SelectItem value="dotted" className="h-8">
                  Dotted
                </SelectItem>
              </SelectContent>
            </Select>
          </Row>

          <Row
            label="Enable animations"
            description="Draw the chart on with a reveal animation."
            htmlFor="sh-animate"
          >
            <Switch
              id="sh-animate"
              checked={config.animate}
              onCheckedChange={(animate) => update({ animate })}
            />
          </Row>

          <Row
            label="Transparent background"
            description="Drop the background fill from the exported SVG."
            htmlFor="sh-transparent"
          >
            <Switch
              id="sh-transparent"
              checked={config.transparent}
              onCheckedChange={(transparent) => update({ transparent })}
            />
          </Row>
        </div>
      </Section>
    </div>
  );
}

/** A titled config section — big heading over its controls. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

interface RowProps {
  label: string;
  description: string;
  /** Links the label to a control by id, for inputs that support it. */
  htmlFor?: string;
  children: ReactNode;
}

/** One config row: label + description on the left, control on the right. */
function Row({ label, description, htmlFor, children }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="space-y-0.5">
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </Label>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

"use client";

import {
  Calendar03Icon,
  ChartColumnIcon,
  ChartLineData01Icon,
  ChartRingIcon,
  Clock01Icon,
  DashboardSpeed01Icon,
  Moon02Icon,
  PieChartIcon,
  Sun01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";

import {
  BACKGROUND_PATTERNS,
  LOOP_INTERVALS,
  MAX_AXIS_LABEL_OFFSET,
  MAX_DOT_SIZE,
  MAX_FILL_OPACITY,
  MAX_PIE_INNER_RADIUS,
  MAX_RING_WIDTH,
  MIN_DOT_SIZE,
  MIN_RING_WIDTH,
  STROKE_VARIANTS,
} from "@/lib/star-history/query-schema";
import type {
  AxisType,
  BackgroundPattern,
  ChartType,
  FillPattern,
  StrokeVariant,
  ThemeName,
} from "@/lib/star-history/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

import type { StarHistoryConfig } from "../_lib/state";
import { RepoInputList } from "./repo-input-list";

interface ConfigPanelProps {
  config: StarHistoryConfig;
  onChange: (config: StarHistoryConfig) => void;
}

/** Chart-type options, each with a matching hugeicon for the select. */
const CHART_TYPE_OPTIONS: { value: ChartType; label: string; icon: typeof PieChartIcon }[] = [
  { value: "line", label: "Line", icon: ChartLineData01Icon },
  { value: "bar", label: "Bar", icon: ChartColumnIcon },
  { value: "radial", label: "Radial", icon: ChartRingIcon },
  { value: "radial-half", label: "Radial (half)", icon: DashboardSpeed01Icon },
  { value: "pie", label: "Pie", icon: PieChartIcon },
];

/** Repositories + appearance config. */
export function ConfigPanel({ config, onChange }: ConfigPanelProps) {
  const update = (patch: Partial<StarHistoryConfig>) => onChange({ ...config, ...patch });

  // Line plots cumulative history; bar/radial/pie compare totals. The axis and
  // stroke controls only apply to a subset, so several rows are conditional.
  const isLine = config.chartType === "line";
  const isRadial = config.chartType === "radial" || config.chartType === "radial-half";
  const isPie = config.chartType === "pie";
  const showStrokeSection = config.chartType === "line" || config.chartType === "bar";

  return (
    <div className="flex flex-col gap-8">
      <Section title="Repositories">
        <RepoInputList repos={config.repos} onChange={(repos) => update({ repos })} />
      </Section>

      <Section title="Config">
        <Card>
          <Row label="Chart type" description="Line history, or a bar/radial/pie total.">
            <Select
              value={config.chartType}
              onValueChange={(chartType) => update({ chartType: chartType as ChartType })}
            >
              <SelectTrigger size="sm" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {CHART_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="h-8">
                    <HugeiconsIcon icon={opt.icon} className="size-3.5" />
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>

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

          {isRadial && (
            <Row label="Ring width" description="Band thickness of each radial ring.">
              <div className="flex w-40 items-center gap-3">
                <Slider
                  value={[config.radialRingWidth]}
                  min={MIN_RING_WIDTH}
                  max={MAX_RING_WIDTH}
                  step={1}
                  onValueChange={([radialRingWidth]) => update({ radialRingWidth })}
                />
                <span className="text-muted-foreground w-8 text-right text-xs tabular-nums">
                  {config.radialRingWidth}
                </span>
              </div>
            </Row>
          )}

          {isPie && (
            <Row label="Donut hole" description="Inner radius — 0% is a full pie.">
              <div className="flex w-40 items-center gap-3">
                <Slider
                  value={[config.pieInnerRadius]}
                  min={0}
                  max={MAX_PIE_INNER_RADIUS}
                  step={5}
                  onValueChange={([pieInnerRadius]) => update({ pieInnerRadius })}
                />
                <span className="text-muted-foreground w-9 text-right text-xs tabular-nums">
                  {config.pieInnerRadius}%
                </span>
              </div>
            </Row>
          )}

          {/* Axis controls only apply to the time-based line chart. */}
          {isLine && (
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
          )}

          {isLine && (
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
          )}

          {isLine && config.axisLabels && (
            <Row label="Label offset" description="Push the axis titles further from the chart.">
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

          <Row
            label="Background pattern"
            description="Decorative texture behind the chart — replaces grid lines."
          >
            <Select
              value={config.backgroundPattern}
              onValueChange={(value) => update({ backgroundPattern: value as BackgroundPattern })}
            >
              <SelectTrigger size="sm" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {BACKGROUND_PATTERNS.map((p) => (
                  <SelectItem key={p} value={p} className="h-8">
                    {labelize(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>

          {config.backgroundPattern !== "none" && (
            <Row
              label="Background pattern opacity"
              description="Opacity of the decorative pattern behind the chart."
            >
              <div className="flex w-40 items-center gap-3">
                <Slider
                  value={[config.backgroundPatternOpacity]}
                  min={0}
                  max={MAX_FILL_OPACITY}
                  step={1}
                  onValueChange={([backgroundPatternOpacity]) =>
                    update({ backgroundPatternOpacity })
                  }
                />
                <span className="text-muted-foreground w-9 text-right text-xs tabular-nums">
                  {config.backgroundPatternOpacity}%
                </span>
              </div>
            </Row>
          )}

        </Card>
      </Section>

      {/* Stroke only applies to the line and bar outlines — radial/pie use a
          fixed hairline separator, so the whole section is hidden for them. */}
      {showStrokeSection && (
        <Section title="Stroke">
          <Card>
            <Row
              label="Stroke width"
              description={
                isLine
                  ? "Thickness of the chart line in pixels."
                  : "Thickness of the bar outline in pixels."
              }
            >
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

            {isLine && (
              <Row label="Stroke style" description="Solid, dashed or animated dashed line.">
                <Select
                  value={config.strokeVariant}
                  onValueChange={(value) => update({ strokeVariant: value as StrokeVariant })}
                >
                  <SelectTrigger size="sm" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {STROKE_VARIANTS.map((v) => (
                      <SelectItem key={v} value={v} className="h-8">
                        {labelize(v)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
            )}
          </Card>
        </Section>
      )}

      {isLine && (
        <Section title="Dots">
          <Card>
            <Row
              label="Dot size"
              description="Radius of the per-point dots — set to 0 to hide them."
            >
              <div className="flex w-40 items-center gap-3">
                <Slider
                  value={[config.dotSize]}
                  min={MIN_DOT_SIZE}
                  max={MAX_DOT_SIZE}
                  step={1}
                  onValueChange={([dotSize]) => update({ dotSize })}
                />
                <span className="text-muted-foreground w-8 text-right text-xs tabular-nums">
                  {config.dotSize}
                </span>
              </div>
            </Row>
          </Card>
        </Section>
      )}

      <Section title="Fill">
        <Card>
          <Row label="Fill opacity" description="Opacity of the area fill under the line.">
            <div className="flex w-40 items-center gap-3">
              <Slider
                value={[config.fillOpacity]}
                min={0}
                max={MAX_FILL_OPACITY}
                step={1}
                onValueChange={([fillOpacity]) => update({ fillOpacity })}
              />
              <span className="text-muted-foreground w-9 text-right text-xs tabular-nums">
                {config.fillOpacity}%
              </span>
            </div>
          </Row>

          {isLine && (
            <Row
              label="Fill fade"
              description="Dissolve the lower part of the fill — at 50%, only the top half stays visible."
            >
              <div className="flex w-40 items-center gap-3">
                <Slider
                  value={[config.fillFade]}
                  min={0}
                  max={MAX_FILL_OPACITY}
                  step={1}
                  onValueChange={([fillFade]) => update({ fillFade })}
                />
                <span className="text-muted-foreground w-9 text-right text-xs tabular-nums">
                  {config.fillFade}%
                </span>
              </div>
            </Row>
          )}

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
        </Card>
      </Section>

      <Section title="Animation">
        <Card>
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

          {config.animate && (
            <Row
              label="Auto replay"
              description="Re-run the draw-on animation on a loop so the chart keeps animating."
            >
              <Select
                value={String(config.loopInterval)}
                onValueChange={(value) => update({ loopInterval: Number(value) })}
              >
                <SelectTrigger size="sm" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {LOOP_INTERVALS.map((seconds) => (
                    <SelectItem key={seconds} value={String(seconds)} className="h-8">
                      {seconds === 0 ? "Off" : `Every ${seconds}s`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
          )}
        </Card>
      </Section>
    </div>
  );
}

/**
 * Hand-rolled card: each Row pads itself so `divide-y` lines run edge to edge —
 * a real Card would leave the separators inset.
 */
function Card({ children }: { children: ReactNode }) {
  return <div className="bg-muted dark:bg-muted/20 divide-y rounded-lg">{children}</div>;
}

/** "cross-hatch" → "Cross hatch" — turns a kebab-case option into a label. */
function labelize(value: string): string {
  const spaced = value.replace(/-/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
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

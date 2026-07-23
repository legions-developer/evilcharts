# ECharts Provider — Context for Agents

Everything you need to know about how the ECharts provider and `EChartsAreaChart`
were built, the decisions behind them, and the traps already sprung so you don't
spring them twice. Read this before touching `src/registry/charts/echarts/*` or
building the next ECharts chart.

Built 2026-07-23 on branch `introducing-echarts`
(commits `5869767` provider split → `72b513d` chart → `ef80460` examples/docs → `16c7075` animation switch).

---

## 1. What this is

EvilCharts ships two rendering engines. The original charts are **Recharts**
(SVG through React). The **ECharts** provider (Apache ECharts, canvas) exists for
chart types SVG can't reach and for scale (tens of thousands of points).

- **Install-time choice, not runtime**: a consumer installs `@evilcharts/area-chart`
  OR `@evilcharts/echarts-area-chart` — never both. Nothing couples the engines.
- Docs mirror the split: `/docs/recharts/*` and `/docs/echarts/*`. The intro
  (`/docs`) and `/docs/chart-config` are shared — `chartConfig` is the one
  contract identical across engines.
- `src/globals/constants/providers.ts` is the provider registry.
  `PROVIDER_META.echarts.available` is the **master publish switch**: while
  `false`, llms.txt / llms-full.txt / MCP hide the provider and the sidebar
  switcher shows a "Soon" badge. Pages stay directly navigable. Flip it to publish.

## 2. Non-negotiable conventions (user directives)

1. **Naming: NO "Evil" prefix for ECharts components.** It's `EChartsAreaChart`,
   and the next ones are `EChartsBarChart`, `EChartsLineChart`, …
2. **Compound-as-config API** — the JSX must read identically to the Recharts
   twin: `<Area/>`, `<XAxis/>`, `<YAxis/>`, `<Grid/>`, `<Tooltip/>`, `<Legend/>`,
   `<Dot/>`, `<ActiveDot/>` children. The children render `null`; the root walks
   them with `Children.forEach` comparing `child.type === Area` etc. and compiles
   one ECharts option. Presence semantics: omit a child → that part doesn't render.
3. **Self-contained single file.** Only npm deps `echarts` (modular
   `echarts/core` + `echarts.use([...])`) and `motion` (DOM touches only). No
   `@/registry/ui/*` imports, no `@evilcharts/*` registryDependencies — installing
   an echarts chart must never drag in recharts. The file defines and exports its
   own `ChartConfig` type (identical shape to `src/registry/ui/chart.tsx`).
4. **Same authored `chartConfig`** as recharts. Colors resolve from CSS variables
   at runtime (see §4) — never ask the consumer for literal colors.

## 3. File map

| Path | Role |
|---|---|
| `src/registry/charts/echarts/area-chart.tsx` | The whole chart. ~2000 lines, one file, on purpose. **Reference implementation for every future echarts chart.** |
| `src/registry/registry-chart.ts` | `echarts-area-chart` entry: `dependencies: ["echarts", "motion"]`, no registryDependencies, target `components/evilcharts/charts/echarts/area-chart.tsx` |
| `src/registry/examples/ex-*-echarts-area-chart.tsx` | 20 examples, near-verbatim copies of the recharts twins (import swap + `EChartsExampleAreaChart` export) |
| `src/content/docs/echarts/` | Provider index + `area-chart/static.mdx` (per-part API reference) |
| `src/globals/constants/providers.ts` | Provider ids, metadata, `available` flags, `providerFromPathname` |
| `src/components/docs/sidebar/provider-switcher.tsx` | Base UI switcher (uses `render` prop, `data-popup-open`, `w-(--anchor-width)`; `DropdownMenuLabel` must sit inside `DropdownMenuGroup` or Base UI throws at runtime) |
| `src/lib/agent-docs.ts` | Provider-aware llms.txt/MCP page derivation, gated by `available` |
| `next.config.ts` | Legacy-URL redirects (`/docs/<chart>` → `/docs/recharts/<chart>/static`), `.md` rewrites at 3 segment depths |

Adding a chart = component file + `registry-chart.ts` entry + example files +
`registry-example.ts` entries + `src/content/docs/echarts/<chart>/{static.mdx,meta.json}`
+ add the folder to `src/content/docs/echarts/meta.json` `pages` + `bun run registry:fresh`.
The sidebar, redirects, and agent surfaces pick new pages up automatically.

## 4. Color system (the cross-engine contract)

- The component injects a `<style>` tag emitting `--color-{key}-{n}` vars scoped
  to `[data-chart={id}]` for light and `.dark` — a verbatim replica of
  `ChartStyle` in `src/registry/ui/chart.tsx`, including `distributeColors`
  (extra slots go to the LAST colors).
- Canvas can't read CSS vars, so the sync effect resolves them right before each
  option push: `getComputedStyle` on the container, then normalize ANY css color
  (incl. oklch) through a shared 1×1 canvas read-back (`normalizeColor`).
- Theme tokens (`border`, `foreground`, `background`, `muted-foreground`) are
  read by mounting a hidden probe span with the matching Tailwind class.
- **`withAlpha` MULTIPLIES the token's own alpha, never replaces it.** The dark
  theme's `--border` is white @ 7.5% alpha; replacing alpha once made gridlines
  5× too bright. Multiplying matches Tailwind's `border/50` semantics.
- **Theme knobs live in a constants block at the top of the file**
  (`GRID_LINE_OPACITY`, `LOADING_*`, `BRUSH_*`). Tune there, not inline. Note
  `GRID_LINE_OPACITY = 1`: canvas spreads 1px dashes across device pixels at
  2× DPR, so full token alpha lands at the same *perceived* brightness as
  recharts' SVG `border/50`. This was measured, not guessed.
- Tooltip and legend are HTML inside `[data-chart]`, so they use CSS vars and
  Tailwind classes directly — no resolution needed there.

## 5. React architecture (post "You Might Not Need an Effect" refactor)

- **Resolved colors are a ref (`resolvedRef`), not state.** They're consumed only
  by the option builder and rAF loops, never by render. As state they caused a
  double render per mount and an effect chain.
- **One sync effect** resolves colors → builds the option (`buildOption`
  useCallback) → pushes with `setOption(…, { notMerge: true })`. It also assigns
  `repushRef.current`, the update-style re-entry used by paths that bypass React:
  the theme `MutationObserver` (`.dark` class flips) and the `ResizeObserver`.
- **ResizeObserver guard**: observers fire once immediately after `observe()`.
  The callback bails when mount size already equals `chart.getWidth()/getHeight()` —
  without this, the initial no-op fire repushed one frame into the entrance and
  killed the reveal clip.
- **StrictMode resilience**: `hasRevealedRef` (the play-entrance-once guard) is
  reset in the init effect's **cleanup**, tying its lifetime to the chart
  instance. Dev StrictMode mounts→unmounts→remounts; without the reset the
  throwaway instance consumed the reveal and the surviving one rendered static.
- **Never push options during continuous interactions.** Two bugs came from
  this: (a) per-frame dash-offset `setOption`s during the entrance recomputed
  the reveal clip until it crawled — the dash rAF now waits until
  `revealEndsAtRef`; (b) graphic updates via `setOption` per `datazoom` event
  re-rendered the dataZoom component and reset its drag anchor, making handles
  progressively lag the pointer — the brush overlays are raw zrender now (§7).
- The intro draw-in is ECharts-native (`animation: true` on the FIRST real push
  only; all later pushes send `animation: false` because `notMerge` would replay
  the entrance on every selection/theme/zoom change). `animation={false}` prop
  is the user-facing master off-switch; `animationType="none"` and OS
  reduce-motion (via `useReducedMotion` from motion/react) also disable it.
  A loading cycle re-arms the reveal (recharts parity: its `<Area>`s remount).
  `animationType`'s direction values are recharts-parity aliases — canvas always
  draws left-to-right; keep them for copy-paste compatibility.

## 6. ECharts gotchas (each cost real debugging time)

- **`grid.containLabel` is deprecated in v6** — v6 contains axis labels
  automatically. The mini-brush grid opts out with `outerBoundsMode: "none"`.
- **An axis with `show: false` hides its splitLines too.** Recharts'
  `<CartesianGrid>` draws without a visible YAxis, so the y-axis stays
  `show: true` whenever `<Grid/>` is present and only its `axisLabel` is gated
  on `<YAxis/>` presence.
- **Area polygons don't emit mouse events by default.** Set
  `triggerLineEvent: true` (per clickable series) so clicking the fill works.
- **Polygon click params omit `seriesId`** (symbol clicks include it). The click
  handler falls back to `seriesIndex → seriesKeys[index]` — valid because main
  series always precede the `__mini-*`/`__loading-*` series, which are `silent`.
- **Gradient `itemStyle` on symbols scopes to the symbol's own bounding box** —
  every dot shows the whole rainbow. Multi-color series instead give each datum
  a concrete color via `sampleGradient(slots, i/(n-1))` in per-datum `itemStyle`
  (+ per-datum `emphasis.itemStyle` for hover dots).
- **2D gradients don't exist in canvas.** "Horizontal multi-stop × vertical
  fade" fills are baked on an offscreen canvas (paint horizontal gradient,
  `destination-in` a vertical alpha ramp) at renderer size, used as a
  `no-repeat` pattern, and rebuilt on resize via `repushRef`.
- **Texture tiles: never bake diagonals into square tiles** — strokes clip at
  tile corners and read as periodic gaps. Draw straight stripes (trivially
  seamless) and rotate via the pattern object (`rotation`, `scaleX/Y` — the
  same zrender pattern-transform mechanism ECharts decals use). Tiles render at
  `devicePixelRatio` and scale back down for crispness.
- **`step` curve**: recharts `step` is d3 `curveStep` = transition at the
  MIDPOINT → ECharts `step: "middle"`, not `"end"`.
- **Dot sizes are per-variant** (`DOT_SIZES`: default 7, border 12, colored-border 8)
  mirroring recharts r3/r6/r3+ring. Flattening them makes the hover ring look
  BIGGER than a haloed resting dot — backwards.
- **notMerge resets dataZoom** — the slider option always carries
  `start/end` from `brushRangeRef` so repushes (theme, selection) don't snap
  the zoom back to 0–100.

## 7. The brush (evil-brush parity on canvas)

- The visible mini chart is a REAL second grid (`gridIndex: 1`) with mirrored
  `__mini-{key}` series (silent, no symbols, full data, stacked when stacked,
  selection-dimmed at the same ratios as the main plot).
- The native dataZoom slider sits on top fully transparent: it provides drag
  interaction only. `xAxisIndex: [0]` on BOTH zoom entries (slider + inside) so
  the mini chart never filters itself.
- Everything visible — selection frame (rounded, rides the handles), side dims,
  6×16 grip-dot handle pills (hover → foreground), range label pills — is
  **raw zrender elements** (`echarts.graphic.Rect/Circle/Text` added to
  `chart.getZr()`), updated imperatively by `syncBrushOverlay` from
  `syncBrushOverlayNow()`. Call sites: every option push, every `datazoom`
  event, zr `mousemove/globalout` (hover tracking). They are NOT the graphic
  component (no `GraphicComponent` registered) and NOT in the option — that's
  what keeps handle drags 1:1 with the pointer.
- Labels straddle the frame's bottom border (half in, half out — absolute, no
  reserved layout space), grow INWARD from their handle with a 6px inset, and
  show only while hovering the brush. Formatter = `brushFormatLabel`.

## 8. Hover highlight

`enableHoverHighlight` (root prop, default false) uses ECharts-native
`emphasis.focus: "series"` + `blur` styles (dim ratios match click-selection:
fill 0.2 / stroke 0.3 / dot 0.3, blur scopes to the coordinate system so the
mini brush is unaffected). The hovered key mirrors into:
- the HTML **legend** via React state (`hoveredDataKey`), and
- the **tooltip** via `hoveredKeyRef` read inside the formatter —
**never via setOption**: pushing an option mid-hover resets ECharts' blur state.
Registered through `chart.on("mouseover"/"mouseout")` with the same
seriesIndex fallback as clicks; `__`-prefixed internal series are ignored.

## 9. Loading state

- **ONE gray wave regardless of declared areas** (`__loading`) — Recharts
  parity: its skeleton is a single `LoadingArea`. Data is a smooth random walk
  (16–58 band), not raw noise. Lazy-created (`loadingData()`) — an impure
  `useRef` initializer would re-roll `Math.random()` every render.
- Shimmer: a wide, soft sin²-eased bell (`LOADING_SHIMMER_BAND` ±0.3, low peak)
  leaned diagonally, swept fully off-screen on both sides by a rAF loop
  (2s linear); data regenerates only while the band is off-screen. The loop
  reads theme tokens per frame, so theme flips retint mid-loading.
- While loading: y-axis labels hidden, x labels hidden, legend hidden, tooltip
  off. The centered "Loading" pill scales in with motion.

## 10. Verification workflow

- `bunx tsc --noEmit` and `bunx eslint <file>` after every change;
  `bun run registry:fresh` whenever the chart/example/registry files change
  (the served `public/r/*.json` embed the component source); `bun run build`
  as the final gate.
- Visual checks with the `agent-browser` CLI against `bun run dev` on
  localhost:3000 (`/docs/echarts/area-chart/static`). Simulate drags with
  `agent-browser mouse move/down/up`; hover with `mouse move`. The Next.js
  "1 Issue" badge during long HMR sessions is usually a phantom — verify on a
  fresh page load before debugging.
- When something renders wrong and the cause isn't obvious, expose the instance
  temporarily (`container.__debugChart = chart`) and inspect
  `chart.getOption()` / attach spy listeners in the browser — measuring beat
  guessing every time it was used (gridline color, polygon click params).

## 11. Open state

- `PROVIDER_META.echarts.available` is still `false` — flipping it publishes
  the provider to llms.txt/MCP and removes the "Soon" badge.
- Known accepted approximations vs recharts: brush is a native-dataZoom-driven
  reconstruction (not pixel-identical evil-brush), `hatched` angle ≈ 20° flat
  two-tone (recharts has soft gradient stripe edges), entrance always draws
  left-to-right regardless of `animationType` direction.

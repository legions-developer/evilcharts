# tooltip

2026-07-23, transformation engine (legacy new-york style), migrated clean: `@radix-ui/react-tooltip` -> `@base-ui/react/tooltip`, zero tsc errors in this file, leftover scan clean.

## Changed

`src/components/ui/tooltip.tsx` (only file touched):

- **Import** (line 3): `import * as TooltipPrimitive from "@radix-ui/react-tooltip"` -> `import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"`. Removed the now-unused `import * as React` (types are sourced from `TooltipPrimitive.*.Props` namespaces, matching the local accordion/tabs idiom).
- **Prop types**: every `React.ComponentProps<typeof TooltipPrimitive.X>` -> `TooltipPrimitive.X.Props` (Provider/Root/Trigger/Popup/Positioner).
- **TooltipProvider** (lines 7-9): `delayDuration = 0` -> `delay = 0` (the documented Provider rename). Dropped `data-slot="tooltip-provider"`: Base UI `TooltipProvider.Props` is a closed interface `{ children, delay, closeDelay, timeout }` — it renders no DOM element, so `data-slot` both fails excess-property checking and had no DOM node to land on. This is a **public API change** — see Behavior changes.
- **Tooltip / Root** (lines 11-19): dropped `data-slot="tooltip"` for the same reason (Base UI `Tooltip.Root` "Doesn't render its own HTML element"; `TooltipRootProps` has no `data-*`/index signature). Still wrapped in `<TooltipProvider>` exactly as before.
- **TooltipTrigger** (lines 21-23): unchanged shape; `data-slot="tooltip-trigger"` kept (Trigger extends `BaseUIComponentProps<'button'>`, so `data-*` is accepted, same as the migrated accordion trigger).
- **TooltipContent** (lines 25-56): the structural change.
  - Anatomy `Portal > Content` -> `Portal > Positioner > Popup`, `Arrow` kept as a child of `Popup` (per wrapper-shapes.md).
  - Positioner FORWARD rule applied: the type now Picks `side | sideOffset | align | alignOffset` from `TooltipPrimitive.Positioner.Props`; each is destructured and forwarded onto `<TooltipPrimitive.Positioner>` explicitly (line 35-40). This is load-bearing — `sidebar.tsx:511-512` passes `side="right" align="center"`; without forwarding they would fall through `...props` onto the Popup and positioning would silently break. `...props` (e.g. `hidden`, `children` overflow) still lands on the Popup.
  - Positioner gets `className="isolate z-50"` and **no** `data-slot` (wrapper-shapes.md convention). Popup keeps `z-50` and `data-slot="tooltip-content"`.
  - `sideOffset` default kept at the project's `0` (NOT the golden `4`) to preserve the existing visual design byte-for-byte.
  - CSS var: `origin-(--radix-tooltip-content-transform-origin)` -> `origin-(--transform-origin)` (Base UI sets this on the Positioner; the Popup inherits it).
  - Animation idiom rewritten per class-mapping.md (keyframe `animate-in/out` family does not fire in Base UI's controlled-mount model and `data-[state=...]` no longer exists): `animate-in fade-in-0 zoom-in-95 ... data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95` + per-side `slide-in-from-*` -> transition form: `transition-[opacity,translate,scale] duration-150` with `data-starting-style:opacity-0 data-starting-style:scale-95`, `data-ending-style:opacity-0 data-ending-style:scale-95`, and per-side enter translate preserved via the still-parameterized `data-[side=...]` hook (`data-[side=bottom]:data-starting-style:-translate-y-2`, `top:translate-y-2`, `left:translate-x-2`, `right:-translate-x-2`). All non-animation design classes (`bg-foreground text-background z-50 w-fit rounded-md px-3 py-1.5 text-xs text-balance`) are byte-identical.
  - Arrow classes kept byte-identical (`bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]`). See Behavior changes for the svg->div implication.

Leftover scan: `grep -n "radix-ui\|@radix-ui\|asChild" src/components/ui/tooltip.tsx` -> CLEAN (no matches). `bunx tsc --noEmit` -> no errors in this file. Export line unchanged: `export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };`.

## Left alone

- `src/components/ui/sidebar.tsx` — consumer of this wrapper; migrated in a later phase (uses `TooltipTrigger asChild` and `TooltipProvider delayDuration={0}`, both of which the sidebar phase must update). Not touched.
- `src/registry/ui/tooltip.tsx` (`ChartTooltip` / `ChartTooltipContent`) — a Recharts wrapper, not a Radix primitive. Out of scope; untouched.

## Behavior changes

- **`TooltipProvider` prop renamed `delayDuration` -> `delay`** (idiomatic Base UI, documented mapping). `sidebar.tsx:116` still calls `<TooltipProvider delayDuration={0}>`, which will error until the sidebar phase changes it to `delay={0}`. Semantics preserved: default `0` keeps the project's instant-open behavior.
- **`data-slot` removed from Provider and Root.** Both render no DOM element in Base UI (they did in Radix too — the attribute was already a no-op with no DOM node), so nothing in the rendered DOM changes, but any hypothetical `[data-slot="tooltip"]` / `[data-slot="tooltip-provider"]` selector (there are none in-repo) would have nothing to match. `data-slot="tooltip-content"` and `tooltip-trigger` are retained on their real elements.
- **Arrow is now a `<div>`, not an `<svg>`.** `fill-foreground` is retained for byte-identity but is now inert (no SVG to fill); `bg-foreground` supplies the color. The rotated-square look (`size-2.5 rotate-45 rounded-[2px]`) is unaffected.
- **Arrow position is now driven by the Positioner per `data-side`.** The project's manual `translate-y-[calc(-50%_-_2px)]` was tuned for Radix's arrow placement (default `side="top"`). Base UI auto-positions the arrow div at the active side, so for non-top sides (notably `side="right"` used by the sidebar tooltip) the nudge may not land pixel-perfect. Not patched — flagged for manual QA.
- **Collision defaults differ.** Radix `collisionPadding`/`arrowPadding` default `0`; Base UI Positioner defaults them to `5`. The wrapper sets neither, so near-viewport-edge tooltips may shift slightly more than before. Left at Base UI defaults per the idiomatic-target rule.
- **`onOpenChange` signature widened** (Base UI passes `(open, eventDetails)`), and Radix per-interaction dismiss callbacks (`onEscapeKeyDown`, `onPointerDownOutside`) have no 1:1 prop — they route through `onOpenChange`'s `eventDetails.reason` + `eventDetails.cancel()`. The wrapper only passes these through, so no consumer in-repo is affected today.
- **Delay-grouping default `timeout` changed** 300 -> 400ms (Radix `skipDelayDuration` -> Base `timeout`); not surfaced by the wrapper.

## Verify by hand

1. `bun dev` is already on :3000. Collapse the sidebar (icon rail) and hover a `SidebarMenuButton` — the tooltip should appear to the **right** of the rail with its arrow pointing left at the button. Confirm the arrow is centered vertically on the trigger and the diamond tip touches the popup edge (this is the `side="right"` + manual `translate-y` interaction to watch).
2. Hover on/off a trigger: confirm the fade+zoom(95%)+slide-in enter and the fade+zoom-out exit both animate (~150ms) and the popup fully unmounts after closing.
3. With `delay={0}` (default via `Tooltip` -> `TooltipProvider`), the tooltip should open instantly on hover; hovering between adjacent tooltips should keep them instant within the group timeout.
4. Keyboard-focus a trigger (Tab) — tooltip should open; press `Escape` — it should close.
5. Near a viewport edge, confirm the tooltip flips/shifts to stay visible and the arrow stays attached.

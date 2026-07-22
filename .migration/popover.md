# popover

2026-07-23, transformation engine (legacy new-york style), migrated cleanly to @base-ui/react/popover with Portal>Positioner>Popup anatomy; Anchor kept as an inert div passthrough and flagged.

## Changed

`src/components/ui/popover.tsx` — the only file touched.

- **Import** (line 3): `import * as PopoverPrimitive from "@radix-ui/react-popover"` → `import { Popover as PopoverPrimitive } from "@base-ui/react/popover"`. Kept `import * as React from "react"` (still used by `PopoverAnchor`'s `React.ComponentProps<"div">`).
- **Popover / PopoverTrigger** (lines 8, 12): prop types `React.ComponentProps<typeof PopoverPrimitive.Root|Trigger>` → `PopoverPrimitive.Root.Props` / `PopoverPrimitive.Trigger.Props`. `data-slot` values unchanged.
- **PopoverContent** (lines 16-39): restructured `Portal > Content` → `Portal > Positioner > Popup`.
  - `align` + `sideOffset` are now destructured and FORWARDED to `PopoverPrimitive.Positioner` (the positioning node), per the positioner FORWARD rule. Defaults kept (`align="center"`, `sideOffset={4}`).
  - Prop type → `PopoverPrimitive.Popup.Props & Pick<PopoverPrimitive.Positioner.Props, "align" | "sideOffset">`.
  - `data-slot="popover-content"` stays on the Popup (the styled box). Positioner gets NO `data-slot` (per wrapper-shapes convention) and gets `className="isolate z-50"`. Popup keeps its own `z-50` (byte-identical to source, matches the tooltip idiom of z-50 on both).
  - CSS var: `origin-(--radix-popover-content-transform-origin)` → `origin-(--transform-origin)` (inherited from the Positioner onto the Popup).
  - Animation restated from tw-animate keyframes to Base UI transition model (per class-mapping "Animation idiom" + local accordion/collapsible idiom):
    - removed: `data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2`
    - added: `transition-[opacity,scale,translate] data-starting-style:opacity-0 data-ending-style:opacity-0 data-starting-style:scale-95 data-ending-style:scale-95 data-[side=bottom]:data-starting-style:-translate-y-2 data-[side=left]:data-starting-style:translate-x-2 data-[side=right]:data-starting-style:-translate-x-2 data-[side=top]:data-starting-style:translate-y-2`
    - Note: transition property is `opacity,scale,translate` (NOT `transform`). Verified by compiling with the project's own Tailwind v4.1.18: `scale-*` and `translate-*` emit the standalone `scale`/`translate` CSS properties, so `transition-[...,transform]` would not animate them. Per-side slide is starting-style-only (mirrors the source, which slid in on enter but did not slide out on exit).
  - All non-animation classes kept byte-identical: `bg-popover text-popover-foreground z-50 w-72 rounded-md border p-4 shadow-md outline-hidden`.
- **PopoverAnchor** (lines 36-38): no Base UI Anchor part exists (the concept becomes the Positioner `anchor` prop). Kept the export as an INERT passthrough that renders `<div data-slot="popover-anchor" {...props} />` (Radix Anchor also rendered a `<div>`, so DOM shape is preserved). Type changed `React.ComponentProps<typeof PopoverPrimitive.Anchor>` → `React.ComponentProps<"div">`. See Behavior changes.

Leftover scan: `grep -n "radix-ui\|@radix-ui\|asChild" src/components/ui/popover.tsx` → no matches (clean). `bunx tsc --noEmit` → zero errors in popover.tsx. Export list unchanged: `Popover, PopoverTrigger, PopoverContent, PopoverAnchor`.

### Consumer sweep (docs-copy-button.tsx)

- Pre-existing vestigial usage flagged: docs-copy-button.tsx wraps its buttons in `<Popover>` but renders only `<PopoverAnchor />` with no PopoverTrigger/PopoverContent. It was inert under Radix and remains inert under Base UI (PopoverAnchor is now a plain passthrough div). Left as-is; a human may want to delete the wrapper.

## Left alone

- `src/components/ui/dropdown-menu.tsx` and `src/components/docs/layout/docs-copy-button.tsx` import from popover — consumers, migrated in a later phase, not touched.

## Behavior changes

- **PopoverAnchor is now inert.** In Radix, `<PopoverAnchor>` designated an alternate positioning anchor for the content. Base UI has no Anchor part; alternate anchoring is done via `<Popover.Positioner anchor={...}>`. The wrapper still renders a `<div>` (so any children/layout still show), but it NO LONGER re-anchors the popover — the popover always positions against the Trigger. Any consumer relying on `PopoverAnchor` to move the popover must be reworked to pass `anchor` through to the Positioner. Flagged, not patched (the current wrapper does not expose an `anchor` prop; no consumer in this repo uses `PopoverAnchor`).
- **`onOpenChange` signature widened.** Radix `(open) => void` → Base UI `(open, eventDetails) => void`. Pass-through at the wrapper, so no code change here, but consumers reading a second arg / new reasons (`trigger-hover`, `trigger-focus`, `outside-press`, `escape-key`, ...) get different data.
- **`modal` default differs conceptually** (both default to non-modal for popover; Base UI widens to `boolean | 'trap-focus'`). No change needed; noted for completeness.
- **Collision-avoidance defaults differ** (Base UI `collisionPadding` 0→5, `arrowPadding` 0→5) — not exposed by this wrapper, so only relevant if a consumer later passes these through to the Positioner.
- **Exit animation is in-place** (fade + scale, no slide), matching the Radix source exactly — the Radix `slide-in-from-*` classes were enter-only, so nothing was lost.

## Verify by hand

1. Open any page using this Popover (or a quick harness): click the trigger — popup should fade + scale-in (95%→100%) and slide ~8px from the trigger side; it should appear on the correct side and stay attached when scrolling.
2. Close it (click trigger again / press Escape / click outside) — popup should fade + scale back out in place (no slide-out), then unmount.
3. Resize / scroll the viewport near an edge — popup should flip/shift to stay visible (collision avoidance) and its transform-origin should track the anchor (scale animation grows from the trigger corner, not the popup center).
4. Confirm width is `w-72`, padding `p-4`, border + `shadow-md`, `bg-popover` colors in both light and dark themes — unchanged from before.
5. If any usage wraps content in `<PopoverAnchor>`, confirm it still renders visually but note it no longer controls positioning (expected per flag).

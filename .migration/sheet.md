# sheet

2026-07-23, transformation engine (legacy new-york style), migrated cleanly — dialog primitive swap only, all 8 exports and every side variant preserved, animations restated as Base UI transitions.

## Changed

`src/components/ui/sheet.tsx` (the only file touched):

- **Import** (line 3): `import * as SheetPrimitive from "@radix-ui/react-dialog"` → `import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"`. `import * as React` kept — `SheetHeader`/`SheetFooter` still use `React.ComponentProps<"div">`.
- **Prop types**: every `React.ComponentProps<typeof SheetPrimitive.Part>` → `SheetPrimitive.Part.Props` (matches the local accordion.tsx idiom). Root/Trigger/Close/Portal/Title/Description map 1:1; `Overlay` → `Backdrop.Props`; `Content` → `Popup.Props`.
- **Part renames**: `SheetPrimitive.Overlay` → `SheetPrimitive.Backdrop` (line 27); `SheetPrimitive.Content` → `SheetPrimitive.Popup` (line 49, closing at line 71). Sheet is fixed-positioned (not anchored), so per overlays.md / universal-patterns.md it uses Popup with **no Positioner** — same as centered modals. Portal > Backdrop + Popup structure otherwise unchanged.
- **Overlay/Backdrop animation** (line 30): `data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0` (keyframe idiom) → `data-starting-style:opacity-0 data-ending-style:opacity-0 ... transition-opacity` (Base UI transition idiom). `fixed inset-0 z-50 bg-black/50` unchanged.
- **Content/Popup base classes** (line 52): dropped `data-[state=open]:animate-in data-[state=closed]:animate-out` (keyframe triggers no longer needed — the existing `transition ease-in-out` drives the slide). Renamed `data-[state=closed]:duration-300` → `data-closed:duration-300` and `data-[state=open]:duration-500` → `data-open:duration-500` (verified in `popupStateMapping.js`: the popup carries `data-open`+`data-starting-style` during enter and `data-closed`+`data-ending-style` during exit, so the per-state durations still bind to the correct direction). All layout classes (`bg-background fixed z-50 flex flex-col gap-4 shadow-lg`) byte-identical.
- **Per-side slide animations** (lines 53–60): each `data-[state=closed]:slide-out-to-<side> data-[state=open]:slide-in-from-<side>` keyframe pair → explicit translate on `data-starting-style` + `data-ending-style` (open/resting state = translate-0, implicit):
  - right: `data-starting-style:translate-x-full data-ending-style:translate-x-full`
  - left: `data-starting-style:-translate-x-full data-ending-style:-translate-x-full`
  - top: `data-starting-style:-translate-y-full data-ending-style:-translate-y-full`
  - bottom: `data-starting-style:translate-y-full data-ending-style:translate-y-full`
  Tailwind v4's `transition` utility includes `translate` in its property list, so the existing `transition ease-in-out` animates these. All positioning classes (`inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm`, etc.) byte-identical per side.
- **Close button** (line 66): mechanical rename `data-[state=open]:bg-secondary` → `data-open:bg-secondary` per class-mapping.md. (Note: this class was inert in Radix — Close never receives `data-state` — and remains inert in Base UI; kept for byte-faithful mechanical rewrite.) No `asChild` on this Close, so it stays a plain `<SheetPrimitive.Close>`; XIcon + sr-only span unchanged.
- **SheetHeader / SheetFooter / SheetTitle / SheetDescription**: only the Title/Description prop-type swap; class strings unchanged.

Leftover scan is clean: `grep -n "radix-ui\|@radix-ui\|asChild" src/components/ui/sheet.tsx` → no matches. Export line identical to pre-migration (`Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription`). `bunx tsc --noEmit` reports zero errors in sheet.tsx.

## Left alone

- `src/components/ui/sidebar.tsx` — consumes this wrapper; migrated in a later phase per assignment. The external API (all 8 exports, `SheetContent`'s `side` prop) is unchanged, so it keeps compiling against this file.
- `src/components/ui/drawer.tsx` (if present) — vaul-based, not a Radix migration target.

## Behavior changes

- **`onOpenChange` signature widened.** Radix `(open: boolean) => void` → Base UI `(open, eventDetails) => void`. Wrappers pass it straight through, so any consumer that only reads `open` is unaffected; a consumer relying on a specific arity would see a difference. Not exercised by this wrapper.
- **Per-interaction dismiss callbacks gone.** Radix `onEscapeKeyDown` / `onPointerDownOutside` / `onInteractOutside` (if a consumer passed them onto `SheetContent` via `...props`) have no Base UI equivalent on Popup; they're now reasons on Root `onOpenChange` (`'escape-key'` / `'outside-press'` / `'focus-out'`) cancelled via `eventDetails.cancel()`. sidebar.tsx does not currently pass these.
- **Portal renders a wrapper `<div>`.** Base UI `Dialog.Portal` renders a `<div>` into `<body>` (Radix Portal rendered nothing extra). The sheet Popup is `position: fixed`, so layout/visuals are unaffected, but the DOM now has one extra div around the backdrop+popup — relevant only to CSS/selectors that assumed the Radix DOM shape.
- **Backdrop fade timing.** Radix overlay used tw-animate's default keyframe duration (~150ms); the new `transition-opacity` also defaults to 150ms, so this is effectively unchanged. The Popup keeps its explicit 300ms(close)/500ms(open) — backdrop faster than panel, same as before.
- **Enter/exit are now CSS transitions, not keyframe animations.** Interrupting a close mid-flight (reopening while sliding out) reverses smoothly under Base UI's transition model rather than restarting a keyframe — generally an improvement, but a visible difference if QA is frame-comparing.

## Verify by hand

1. `bun dev` (already running on :3000). Open any view that renders a Sheet (or the Sidebar in mobile/off-canvas mode once its own migration lands).
2. Trigger the sheet from each `side`: right (default), left, top, bottom. Confirm the panel slides **in from the correct edge** on open and **back out to the same edge** on close — no fade-only, no wrong-direction slide.
3. Confirm the panel's open slide feels slightly slower than close (500ms vs 300ms) and the dark backdrop fades in/out behind it.
4. Close via: the top-right X button, `Esc`, and clicking the backdrop — all three should dismiss with the exit slide + backdrop fade.
5. Rapidly toggle open/close to confirm the interrupt reverses cleanly (no flash/jump).
6. Check focus: opening moves focus into the panel; closing returns focus to the trigger. Tab should stay trapped inside while open (modal).
7. Confirm the X button shows its hover opacity change and focus ring.

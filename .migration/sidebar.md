# sidebar

2026-07-23, transformation engine (legacy new-york style), migrated: Slot/asChild -> Base UI useRender, consumer call sites updated to the freshly-migrated sheet/tooltip/separator/button/input APIs; two behavior flags recorded.

## Changed

Single file touched: `src/components/ui/sidebar.tsx`.

- **Imports (src/components/ui/sidebar.tsx:2-4):** removed `import { Slot } from "@radix-ui/react-slot"`; added `import { mergeProps } from "@base-ui/react/merge-props"` and `import { useRender } from "@base-ui/react/use-render"`. This is the prescribed replacement for the manual Slot idiom (universal-patterns.md "Slot -> useRender WORKED EXAMPLE").
- **Five manual `const Comp = asChild ? Slot : "<tag>"` polymorphic components converted to `useRender` + `mergeProps`** (non-button polymorphic idiom; SidebarMenuButton is NOT the plain button primitive because it also branches into a Tooltip, so it uses the useRender idiom too):
  - `SidebarGroupLabel` (div) — prop type `React.ComponentProps<"div"> & { asChild? }` -> `useRender.ComponentProps<"div">`.
  - `SidebarGroupAction` (button) -> `useRender.ComponentProps<"button">`.
  - `SidebarMenuButton` (button) -> `useRender.ComponentProps<"button"> & {isActive?, tooltip?} & VariantProps`. `button` element is now the return value of `useRender(...)` (a ReactElement), so `return button` and `render={button}` both stay valid.
  - `SidebarMenuAction` (button) -> `useRender.ComponentProps<"button"> & { showOnHover? }`.
  - `SidebarMenuSubButton` (a) -> `useRender.ComponentProps<"a"> & { size?, isActive? }`.
  - In every case the object literal fed to `mergeProps` carries `data-*` keys and is cast `as React.ComponentProps<"tag">` per the worked-example pitfall note; all tailwind classes are byte-identical to before (only the two `data-[state=open]` fragments below changed).
- **Consumer call sites (the five just-migrated `./` components):**
  - `TooltipProvider delayDuration={0}` -> `delay={0}` (src/components/ui/sidebar.tsx:117) — tooltip.tsx now exposes `delay` (base-ui `TooltipPrimitive.Provider.Props`).
  - `<TooltipTrigger asChild>{button}</TooltipTrigger>` -> `<TooltipTrigger render={button} />` (the asChild -> render swap; `button` is the useRender ReactElement).
  - `SheetContent ... side={side}` — LEFT AS-IS: the migrated sheet.tsx still exposes a `side` prop on `SheetContent`, so no change required. The `[&>button]:hidden` class still hides sheet.tsx's internal `SheetPrimitive.Close` (a direct `<button>` child of the Popup) — unchanged.
  - `TooltipContent side="right" align="center" hidden={...}` — `side`/`align` are still forwarded by tooltip.tsx to the Positioner; `hidden` still type-checks (Popup extends HTML props). No change (see behavior flag on `hidden`).
  - `Separator` via `SidebarSeparator` — never passed `decorative`, so the dropped-prop rule is a no-op; unchanged.
  - `Button` / `Input` call sites (`SidebarTrigger`, `SidebarInput`) use only `variant`/`size`/`className`/native props — all still valid on the migrated primitives; unchanged.
- **Class-hook rewrites per class-mapping.md (`data-[state=open]:` -> `data-open:`):**
  - `sidebarMenuButtonVariants` cva base (src/components/ui/sidebar.tsx:~450): `data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground` -> `data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground`.
  - `SidebarMenuAction` showOnHover clause: `data-[state=open]:opacity-100` -> `data-open:opacity-100`.
  - See the FLAG below — this mechanical rewrite is correct per the table but does NOT match the actual Base UI trigger attribute.

Leftover scan is clean:
`grep -n "radix-ui\|@radix-ui\|asChild" src/components/ui/sidebar.tsx` -> no matches.
Export list is byte-identical to before (23 names + `useSidebar`). `bunx tsc --noEmit` reports zero errors in sidebar.tsx.

### Consumer sweep (nav-main.tsx, render-default-options.tsx)

- nav-main.tsx:188 — `<SidebarMenuButton asChild>` -> `render={<Link .../>}`; icon + capitalized span became direct children of SidebarMenuButton (useRender forwards them into the Link).
- nav-main.tsx:258 — `<SidebarMenuSubButton asChild>` -> `render={<Link href=... onClick=... />}`; `<span>{subItem.name}</span>` moved out to be the child.
- render-default-options.tsx:45-56 — `asChild` + `<Link>` child pattern -> `render={<Link href={item.url} onClick={handleLinkClick} />}` with icon + span remaining as children. Correct per Base UI merge semantics (mergeProps then cloneElement; render element contributes no children key, so outer children survive).
- No class rewrites needed in either file: `group-data-[collapsible=icon]:hidden` is a custom parameterized data attribute self-set by sidebar.tsx, not a radix state hook.
- Leftover scans on both files clean.

## Left alone

- **`data-state={state}` (src/components/ui/sidebar.tsx:197) and every `data-[state=collapsed]` / `[data-state=collapsed]` class hook (lines ~278, ~295):** these are the sidebar's OWN author-set attribute with values `"expanded"|"collapsed"`, unrelated to Radix's open/closed state machine. Rewriting them would break the sidebar's own gap/rail/inset styling. Deliberately NOT touched by the class-mapping rule (that rule targets Radix-emitted `data-state`, not this custom one).
- **`sheet.tsx`, `tooltip.tsx`, `separator.tsx`, `button.tsx`, `input.tsx`:** owned by other agents / already migrated. Only read to learn their current APIs; not edited.
- **`useMobile` hook, `SidebarLeft` icon, `cn`:** unrelated, untouched.

## Behavior changes

- **FLAG — open-state hover styling on menu button / menu action (`data-open:` fragments).** In Radix, a `SidebarMenuButton`/`SidebarMenuAction` composed (via asChild) as a DropdownMenu or Collapsible trigger received `data-state="open"`, which the `data-[state=open]:` hooks matched. Base UI triggers do NOT emit a generic `data-open`: verified in node_modules, `@base-ui/react/menu` trigger emits **`data-popup-open`** and `@base-ui/react/collapsible` trigger emits **`data-panel-open`** (a plain `data-open` only appears on Popup/panel/dialog elements, never on triggers). The class-mapping.md default rule prescribes `data-[state=open]:` -> `data-open:`, which I applied, but that class will match neither Base UI trigger attribute. Net effect: if a consumer renders `SidebarMenuButton`/`SidebarMenuAction` as a Base UI dropdown/collapsible trigger and relied on the open-state hover/opacity styling, it will silently stop applying until the consumer switches those utilities to `data-popup-open:` (menu) or `data-panel-open:` (collapsible). Not patched here — this depends on which primitive the consumer composes, which the wrapper cannot know.
- **FLAG — `TooltipContent hidden={...}` still passes through, but tooltip mounting model differs.** The migrated `Tooltip` wrapper self-nests its own `TooltipProvider` (tooltip.tsx:12-16), so each sidebar tooltip now sits under two providers (the outer `TooltipProvider delay={0}` in `SidebarProvider` plus the wrapper's own). Harmless (delay resolves to 0 either way), but worth knowing the outer provider is now largely redundant. Separately, `hidden` is forwarded to the Base UI `Popup` as a native HTML attribute (display:none) exactly as Radix did; behavior is expected to be equivalent but should be eyeballed (see Verify by hand).
- **Observation (no delta expected):** `SidebarMenuButton` now returns a `useRender` ReactElement rather than a `Slot`/`button`. `data-active={boolean}` and `data-size={...}` are merged via `mergeProps` and render identically (React stringifies the boolean the same way the old JSX did).

## Verify by hand

1. Toggle the sidebar (Cmd/Ctrl+B, the `SidebarTrigger`, and the `SidebarRail`); confirm expand/collapse still animates and the gap/rail cursors still change — this exercises the untouched custom `data-state="expanded|collapsed"` hooks.
2. Collapse the sidebar to icon mode and hover a `SidebarMenuButton` that has a `tooltip` prop; the tooltip should appear on the right and NOT appear when expanded/on mobile (`hidden` gate).
3. On mobile width, open the sidebar Sheet; confirm it slides in from `side` (left/right), the backdrop shows, and the sheet's own close button stays hidden (`[&>button]:hidden`).
4. If any app view composes `SidebarMenuButton`/`SidebarMenuAction` as a dropdown/collapsible trigger (render prop), open it and check the open-state hover/opacity styling — if it looks flat, that is the flagged `data-open` vs `data-popup-open`/`data-panel-open` mismatch, fix at the call site.
5. Pass `render={<a href=... />}` (or `<Link/>`) to `SidebarMenuSubButton`/`SidebarGroupLabel` and confirm the element renders as the custom tag with the sidebar classes merged in (the useRender swap replacing asChild).

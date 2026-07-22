# dropdown-menu

2026-07-23, transformation engine (legacy new-york style), migrated @radix-ui/react-dropdown-menu -> @base-ui/react/menu; all 15 exports preserved, zero tsc errors in this file, leftover scan clean.

## Changed

`src/components/ui/dropdown-menu.tsx` (only file touched):

- **Import** (line 3): `import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"` -> `import { Menu as DropdownMenuPrimitive } from "@base-ui/react/menu"`. Namespace `* as` import becomes a named import; kept the local alias `DropdownMenuPrimitive` so the rest of the JSX reads the same. Kept `React` (still used by `DropdownMenuShortcut`) and the three lucide icons.
- **Types**: every `React.ComponentProps<typeof DropdownMenuPrimitive.X>` -> `DropdownMenuPrimitive.X.Props` (matches the local accordion/tabs/sheet idiom). Part renames applied to the type namespaces too (`GroupLabel`, `SubmenuRoot`, `SubmenuTrigger`, `Popup`).
- **Part renames** (canonical menu mapping): `Label` -> `GroupLabel`, `ItemIndicator` -> `CheckboxItemIndicator` / `RadioItemIndicator` (split by parent), `Sub` -> `SubmenuRoot`, `SubTrigger` -> `SubmenuTrigger`, `Content`/`SubContent` -> `Portal > Positioner > Popup`.
- **DropdownMenu (Root)** line ~9: dropped `data-slot="dropdown-menu"`. Base UI `Menu.Root` renders no DOM element and its prop interface (`MenuRootProps`, generic `<Payload>`) does not extend HTML attributes, so passing `data-slot` is a type error. Kept as a passthrough function wrapper.
- **DropdownMenuSub (SubmenuRoot)** line ~185: same reason, dropped `data-slot="dropdown-menu-sub"` (`MenuSubmenuRoot` renders no element).
- **DropdownMenuContent** lines ~21-53: restructured to `Portal > Positioner > Popup`. `sideOffset` (default 4) plus newly-destructured `side`/`align`/`alignOffset` are FORWARDED to `Positioner` (declare -> destructure -> forward, per the Pick-means-forward rule); `data-slot="dropdown-menu-content"` and the styled class list stay on `Popup`. Positioner gets the menu convention class `isolate z-50 outline-none` and no data-slot. Type is `Popup.Props & Pick<Positioner.Props, "side"|"sideOffset"|"align"|"alignOffset">`.
- **Content/SubContent class transforms** (mechanical, per class-mapping.md):
  - `--radix-dropdown-menu-content-available-height` -> `--available-height`; `--radix-dropdown-menu-content-transform-origin` -> `--transform-origin`.
  - Animation idiom restated from keyframes to transitions: `data-[state=open]:animate-in ... fade-in-0 zoom-in-95` + per-side `slide-in-from-*-2` and the `data-[state=closed]:*` exit set -> `transition ease-in-out` + `data-starting-style:opacity-0 data-ending-style:opacity-0 data-starting-style:scale-95 data-ending-style:scale-95` + per-side enter translate `data-[side=bottom]:data-starting-style:-translate-y-2` / `left:translate-x-2` / `right:-translate-x-2` / `top:translate-y-2`. Kept the `data-[side=...]` parameterization; exit has no slide (matches the radix original). This mirrors the already-migrated `sheet.tsx` idiom (bare `transition` covers translate/scale/opacity in this project's Tailwind v4).
  - Added `outline-none` to each `Popup` (Base UI Popup is a focus target; matches the golden menu convention "Popup keeps z-50 and outline-none").
  - All non-animation utilities (`bg-popover`, `min-w-32`, `overflow-*`, `rounded-md`, `border`, `p-1`, `shadow-md`/`shadow-lg`, `z-50`) kept byte-identical.
- **DropdownMenuSubContent** lines ~187-201: rebuilt as its own `Portal > Positioner > Popup` (kept the source's distinct class list — `shadow-lg`/`overflow-hidden`/no `max-h` — rather than composing `DropdownMenuContent`, so the visual stays byte-identical; this is the "dropdown-menu duplicates the full class list" golden shape). Submenu positioning defaults hardcoded on the Positioner per wrapper-shapes.md: `side="right" align="start" alignOffset={-3} sideOffset={0}`.
- **DropdownMenuCheckboxItem / DropdownMenuRadioItem**: indicator part renamed to `CheckboxItemIndicator` / `RadioItemIndicator`. Kept `checked={checked}` on the checkbox item. Class lists byte-identical.
- **DropdownMenuSubTrigger** lines ~163-183: `SubTrigger` -> `SubmenuTrigger`; the submenu-open marker `data-[state=open]:bg-accent data-[state=open]:text-accent-foreground` -> `data-popup-open:bg-accent data-popup-open:text-accent-foreground` (Base UI SubmenuTrigger exposes `data-popup-open`). Everything else byte-identical.
- **DropdownMenuItem / Label / Separator / Group / Portal / Trigger / RadioGroup / Shortcut**: class strings unchanged. `data-slot`, `data-inset`, `data-variant` retained (these parts render real DOM elements and `BaseUIComponentProps` uses the same `ComponentPropsWithoutRef` base as radix, so the data-* attrs pass through identically). `focus:` classes retained deliberately — see Behavior changes.

Leftover scan: `grep -n "radix-ui\|@radix-ui\|asChild" src/components/ui/dropdown-menu.tsx` returns nothing (clean).
Typecheck: `bunx tsc --noEmit` reports zero errors in this file (the 8 project-wide errors are all in other files — docs components and sidebar.tsx — owned by later phases / parallel agents).

### Consumer sweep (docs-copy-button.tsx, table-of-content.tsx)

- docs-copy-button.tsx:168 — `<DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>` -> `<DropdownMenuTrigger render={trigger} />` (trigger is a self-contained ui/button Button with CaretDown).
- docs-copy-button.tsx:174 — `<DropdownMenuItem ... asChild>{value(url)}</DropdownMenuItem>` -> `render={value(url)}`; the `<a>` keeps its svg + label children; key stays on the mapped component.
- table-of-content.tsx:78-82 — `<DropdownMenuTrigger asChild><Button ...>On This Page</Button>` -> `render={<Button variant="outline" size="sm" className={cn("h-8 md:h-7", className)} />}` with "On This Page" as trigger children.
- table-of-content.tsx:85-95 — `<DropdownMenuItem asChild><a href>...` -> `render={<a href={item.url} />}` with `{item.title}` as item children; onClick/data-depth/className preserved verbatim (data-[depth=*] are custom consumer attributes, untouched per class-mapping.md).
- Leftover scans on both files clean.

## Left alone

- `src/components/ui/context-menu.tsx`, `menubar.tsx`, `navigation-menu.tsx`: not in this assignment (separate menu-family primitives / other agents). Not present or not mine to touch.
- Consumers of `dropdown-menu` (docs sidebar, nav, etc.): migrated in a later phase per the hard rules; left untouched even though some currently show tsc errors.

## Behavior changes

Flagged, not patched:

- **CheckboxItem / RadioItem no longer close the menu on click.** Radix closed the menu on select by default; Base UI `Menu.CheckboxItem` and `Menu.RadioItem` default `closeOnClick={false}`. Not patched (left at Base default). To restore radix behavior, set `closeOnClick` explicitly on those items. (Regular `Menu.Item` keeps `closeOnClick` default `true`, so plain items still close — matching radix.)
- **`onSelect` -> `onClick`.** Radix `onSelect(event)` (with `event.preventDefault()` to keep the menu open) has no equivalent; Base UI uses `onClick` + `closeOnClick`. Any consumer passing `onSelect` will silently no-op after their own migration and must move to `onClick`/`closeOnClick`.
- **Change-callback signatures gained a second arg.** `onOpenChange(open)` -> `onOpenChange(open, eventDetails)`; `onCheckedChange(checked)` -> `(checked, eventDetails)`; `onValueChange(value)` -> `(value, eventDetails)`. Old single-arg handlers still compile; escape/outside-press interception moves from `onEscapeKeyDown`/`onPointerDownOutside`/`onInteractOutside` to `onOpenChange` + `eventDetails.reason` + `eventDetails.cancel()`.
- **Keyboard focus loops by default.** Radix `Content.loop` defaulted `false`; Base UI `Menu.Root.loopFocus` defaults `true`. Arrow-key navigation now wraps around. Not exposed by the wrapper; set `loopFocus={false}` on the Root wrapper to opt out.
- **Typeahead prop renamed.** Radix `textValue` on items -> Base UI `label`. No consumer in this wrapper uses it, but item-level `textValue` props will stop affecting typeahead.
- **`dir` dropped.** RTL now comes from `<DirectionProvider>` / DOM `dir`, not a `dir` prop on the root.
- **GroupLabel wants a Group parent.** Base UI `Menu.GroupLabel` wires `aria-labelledby` to its enclosing `Menu.Group`; radix `Label` could float free. `DropdownMenuLabel` used outside a `DropdownMenuGroup` renders fine but loses that automatic association (minor a11y delta).
- **`data-slot` removed from Root and Sub.** These Base UI parts render no DOM node, so the attribute had no host to land on (it was inert under radix too). Any `[data-slot="dropdown-menu"]` / `[data-slot="dropdown-menu-sub"]` CSS/query selectors will no longer match — none exist in this repo.
- **Highlight is DOM-focus-driven (kept `focus:` classes intentionally).** Base UI menus use `useListNavigation` without virtual focus, so the highlighted item receives real DOM `:focus` (roving `tabIndex`). The existing `focus:bg-accent` / `focus:text-accent-foreground` classes therefore keep working for hover + keyboard highlight; they were NOT rewritten to `data-highlighted:`. Verify the highlight visually (see below) since this depends on Base UI's focus model rather than a data attribute.

## Verify by hand

1. Open a DropdownMenu (trigger click) and confirm the popup fades/zooms/slides in and out, positioned below the trigger with the 4px offset.
2. Arrow-key up/down through items: the highlighted item should get the accent background (confirms `focus:` styling still fires) and navigation should wrap at the ends (loopFocus default).
3. Hover a plain item then click it: menu closes. Toggle a CheckboxItem and a RadioItem: check/circle indicator appears — note the menu stays open (expected Base-default `closeOnClick=false`; confirm this is desired for your UX).
4. Open a submenu via SubmenuTrigger: chevron item gets accent bg while open (`data-popup-open`), submenu opens to the right, top-aligned, nudged 3px up (align=start, alignOffset=-3, sideOffset=0). Hover back and forth between parent items and the submenu.
5. Press Escape and click outside: both close the menu.
6. Render a menu near the viewport edge to confirm collision flipping still repositions the popup (Positioner handles it).
7. Check a destructive item (`variant="destructive"`) and an inset item (`inset`) render with the red text and pl-8 respectively.

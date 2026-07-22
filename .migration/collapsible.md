# collapsible

2026-07-23, transformation engine (legacy new-york style), progressive migration finalized: the finished Base UI version is now live at the canonical path, the staging file is gone, and the wrapper consumer is repointed. Zero tsc errors in owned files, leftover scan clean.

## Changed

- `src/components/ui/collapsible.tsx` — replaced the Radix implementation verbatim with the finished Base UI version that had been staged in `base-collapsible.tsx`.
  - Import: `@radix-ui/react-collapsible` (namespace `* as CollapsiblePrimitive`) → `import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"` (per universal-patterns import rule; adds `cn` from `@/lib/utils`).
  - Part rename: Radix `CollapsiblePrimitive.CollapsibleContent` → Base UI `CollapsiblePrimitive.Panel` (Content→Panel, per class-mapping part table). Local wrapper renamed `CollapsibleContent` → `CollapsiblePanel`.
  - Types: `React.ComponentProps<typeof CollapsiblePrimitive.Root>` → `CollapsiblePrimitive.Root.Props`; same for `.Trigger.Props` / `.Panel.Props`.
  - Trigger gains `cn("cursor-pointer", className)` and now destructures `className` (staged design; Base UI trigger is a real `<button>`, cursor made explicit).
  - Panel gains the Base UI animation idiom: `h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 data-ending-style:h-0 data-starting-style:h-0` (CSS var `--radix-collapsible-content-height` → `--collapsible-panel-height`; `data-[state=...]` keyframe animation → `data-starting-style`/`data-ending-style` transition, per class-mapping animation idiom).
  - `data-slot="collapsible-content"` → `data-slot="collapsible-panel"` on the Panel wrapper.
  - Exports (collapsible.tsx:33): `export { Collapsible, CollapsibleTrigger, CollapsiblePanel, CollapsiblePanel as CollapsibleContent };` — both the new `CollapsiblePanel` name and the back-compat `CollapsibleContent` alias, per assignment. See "Behavior changes" for the export-list note.
- `src/components/ui/base-collapsible.tsx` — DELETED. It was the staging file for the progressive migration; its content is now the canonical `collapsible.tsx`. Confirmed its only importer was the wrapper below (grep of `src/` for `base-collapsible` before deletion returned exactly one hit).
- `src/components/docs/charts/code-collapsible-wrapper.tsx` — import source repointed only: `@/components/ui/base-collapsible` → `@/components/ui/collapsible` (line 7). It already consumed the Base UI API (`CollapsiblePanel`, `data-open`/`data-closed`/`group-data-open` classes, `keepMounted`), so no other change was needed and none was made.

Leftover scan (clean): `grep -n "radix-ui\|@radix-ui\|asChild"` over `collapsible.tsx` and `code-collapsible-wrapper.tsx` returns nothing.

### Consumer sweep (src/components/docs/sidebar/nav-main.tsx)

- nav-main.tsx:205 — `<Collapsible asChild>` -> `render={<SidebarMenuItem />}`; the wrapped item's children (CollapsibleTrigger + CollapsibleContent) hoisted to direct children of Collapsible; `className="group/collapsible"` retained (merges onto the rendered `<li>` exactly as asChild did).
- nav-main.tsx:209 — `<CollapsibleTrigger asChild>` -> `render={<SidebarMenuButton ... isActive={hasActiveChild} />}`; trigger children (icon, span, CaretRight) moved out to be children of CollapsibleTrigger.
- nav-main.tsx:225 — open-state class hook rewritten per class-mapping.md: `group-data-[state=open]/collapsible:rotate-90` -> `group-data-open/collapsible:rotate-90` (matches code-collapsible-wrapper.tsx).
- Leftover scan on nav-main.tsx clean (no radix-ui/@radix-ui/asChild/data-[state hits).

## Left alone

- `src/components/docs/sidebar/nav-main.tsx` — NOT owned by this assignment and left untouched (see "Behavior changes" for the flagged debt). Still imports `Collapsible, CollapsibleContent, CollapsibleTrigger` from `@/components/ui/collapsible`; the `CollapsibleContent` alias is deliberately retained so this file keeps compiling.

## Behavior changes

- Export list grew by one name. Original: `{ Collapsible, CollapsibleTrigger, CollapsibleContent }`. Now: `{ Collapsible, CollapsibleTrigger, CollapsiblePanel, CollapsibleContent (alias of CollapsiblePanel) }`. This is an ADDITIVE change mandated by the assignment (keep both the new part name and the back-compat alias); no previously exported name was removed or repointed, so all existing consumers still resolve. Flagged here because it is technically a delta from the byte-identical export-list rule.
- `onOpenChange` signature (if any consumer wires it): Base UI passes `(open, eventDetails)` vs Radix `(open)`. Neither current consumer uses it, so no runtime effect today.
- Root no longer emits `data-[state]`; state attributes now live on Trigger (`data-panel-open`) and Panel (`data-open`/`data-closed`). Both consumers' class hooks already target the Base UI names (`data-open`, `data-closed`, `group-data-open`), so this is consistent — except the un-owned nav-main debt below.
- Dynamic `defaultOpen`: Radix silently ignored `defaultOpen` changes after mount; Base UI logs a console warning ("changing the default open state of an uncontrolled Collapsible"). Surfaced post-migration in nav-main.tsx, which passed `defaultOpen={hasActiveChild}` (flips on navigation). Fixed 2026-07-23 with a `NavFolderCollapsible` wrapper in nav-main.tsx that freezes the first `defaultOpen` value via `useState`, replicating Radix's mount-only semantics exactly (folders do not auto-open/close on navigation; user toggles persist).

### Un-owned consumer debt (FLAGGED, not fixed — later phase)

- `src/components/docs/sidebar/nav-main.tsx:~210` — `<CollapsibleTrigger asChild>`. Base UI has no `asChild`; must become `render={<...>}`. Left as-is per assignment scope; will break/misbehave until the consumer phase migrates it.
- `src/components/docs/sidebar/nav-main.tsx:~223` — `group-data-[state=open]/collapsible:rotate-90`. Radix state selector; must become `group-data-open/collapsible:rotate-90` (class-mapping: `group-data-[state=open]` → `group-data-open`). Left as-is per assignment scope; the chevron rotate-on-open will not fire until repointed.

## Verify by hand

1. Open a docs chart page that renders `CodeCollapsibleWrapper` (any chart with a long code block). Confirm the code panel is initially clamped (`data-closed:max-h-64`) with the "Expand" pill floating at the bottom over a gradient fade.
2. Click "Expand" → panel animates open smoothly via height transition (no jump/flash), the "Expand" pill hides (`group-data-open/collapsible:hidden`) and the "Collapse" pill appears top-right (`group-data-open/collapsible:block`).
3. Click "Collapse" → panel animates back to the clamped 64-height state, pills swap back.
4. Confirm triggers show a pointer cursor on hover and the border/text hover-color transitions fire.
5. Sidebar sanity (un-owned, expected to be broken until consumer phase): in `nav-main.tsx` the collapsible nav groups' chevron will NOT rotate on open and the trigger may not compose its child correctly — this is the flagged debt, not a regression introduced here.

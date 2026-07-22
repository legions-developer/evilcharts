# separator

2026-07-23, transformation engine (legacy new-york style), clean direct migration — single-part callable primitive, `decorative` dropped (the one behavior delta).

## Changed

- `src/components/ui/separator.tsx`
  - Import (line 3): `import * as SeparatorPrimitive from "@radix-ui/react-separator"` -> `import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"`. Legacy individual-package namespace import becomes a named import per universal-patterns.
  - Element: `<SeparatorPrimitive.Root .../>` -> `<SeparatorPrimitive .../>`. Base UI Separator is a callable single part with no `.Root`.
  - Props type: `React.ComponentProps<typeof SeparatorPrimitive.Root>` -> `SeparatorPrimitive.Props`. This also let the now-unused `import * as React` be removed.
  - `decorative` prop removed from both the destructure and the JSX. Base UI has no `decorative` prop (see Behavior changes). The `decorative = true` default and the `decorative={decorative}` pass-through are both gone.
  - `orientation` prop, `data-slot="separator"`, and the full className string are byte-identical to the original. The `data-[orientation=horizontal]` / `data-[orientation=vertical]` class hooks are preserved because Base UI Separator emits the same `data-orientation` attribute (verified in node_modules/@base-ui/react/separator/Separator.d.ts: State exposes `orientation`, default `'horizontal'`).
- Leftover scan: `grep -n "radix-ui\|@radix-ui\|asChild" src/components/ui/separator.tsx` returns nothing (clean).
- Typecheck: `bunx tsc --noEmit` reports zero errors in separator.tsx.
- Exports unchanged: `export { Separator };` (identical before and after).

## Left alone

None. No sibling separator files; consumers of `Separator` are migrated in a later phase per the assignment rules.

## Behavior changes

- **`decorative` prop dropped (accessibility semantics change).** Radix accepted `decorative` (the wrapper defaulted it to `true`): a decorative Radix separator renders `role="none"` and is purely visual, hidden from the accessibility tree. Base UI's Separator is always semantic and renders `role="separator"`. So every `<Separator />` in this app — which previously defaulted to decorative/`role="none"` — now exposes `role="separator"` to assistive tech. FLAGGED, not patched (target is idiomatic Base UI). If a truly decorative divider is ever needed, the docs' recommendation is a plain `<div aria-hidden="true">` or a CSS border rather than this component. Any caller currently passing `decorative={...}` explicitly will now hit a type error in the later consumer-migration phase and must drop the prop.

## Verify by hand

1. Render a horizontal `<Separator />` (default): confirm it is a 1px-high, full-width `bg-border` line — visually identical to before.
2. Render `<Separator orientation="vertical" />` inside a flex row with a fixed height: confirm it is a 1px-wide, full-height line (the `data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px` hooks fire).
3. Inspect the DOM: element is a `<div data-slot="separator" data-orientation="horizontal|vertical" role="separator">`. Note the new `role="separator"` (was `role="none"` when decorative).
4. Screen-reader spot check: the separator is now announced as a separator boundary; confirm that is acceptable for its usages (it was previously silent/decorative by default).

# button

2026-07-23, transformation engine (legacy new-york style), migrated to the real @base-ui/react/button primitive; clean, zero tsc errors, one behavior delta flagged (default type="button").

## Changed

- `src/components/ui/button.tsx`
  - Import swap (line 2): `import { Slot } from "@radix-ui/react-slot"` + `import * as React from "react"` -> `import { Button as ButtonPrimitive } from "@base-ui/react/button"`. `React` is no longer imported because its only use was `React.ComponentProps<"button">` in the prop type; the automatic JSX runtime (Next 16) needs no React import for JSX.
  - Removed the Slot/asChild polymorphism mechanism: dropped the `asChild = false` destructure, dropped the `asChild?: boolean` intersection member, and deleted `const Comp = asChild ? Slot : "button"`. Per the hard rule, button migrates to the REAL Base UI Button primitive (which supports `render` natively) — NOT a hand-rolled useRender wrapper, and NOT keeping asChild.
  - Prop type (line 41): `React.ComponentProps<"button"> & VariantProps<...> & { asChild?: boolean }` -> `ButtonPrimitive.Props & VariantProps<typeof buttonVariants>`. Verified `Button.Props` exists as a namespace alias in `node_modules/@base-ui/react/button/Button.d.ts` (`export declare namespace Button { type Props = ButtonProps }`, where `ButtonProps = ButtonNativeProps | ButtonNonNativeProps`).
  - Render element (line 43): `<Comp .../>` -> `<ButtonPrimitive .../>`. `data-slot="button"`, `data-variant`, `data-size`, `className`, and `{...props}` are all preserved unchanged.
  - `buttonVariants` (the cva call, all base + variant + size + defaultVariants tailwind classes): untouched, byte-identical.
  - Exports (line 53): `export { Button, buttonVariants };` unchanged — export list is byte-identical before and after.
- Leftover scan: `grep -n "radix-ui\|@radix-ui\|asChild" src/components/ui/button.tsx` returns nothing (exit 1, no matches). Clean.
- Typecheck: `bunx tsc --noEmit` reports zero errors in `src/components/ui/button.tsx`.

### Consumer sweep (table-of-content.tsx, docs-copy-button.tsx)

- Button now composes via Base UI render chains at two dropdown triggers: `DropdownMenuTrigger render={<Button .../>}` in table-of-content.tsx:78 and docs-copy-button.tsx:168. Button accepts merged trigger props natively (real @base-ui/react/button primitive).

## Left alone

- `buttonVariants` cva definition and every tailwind class string: intentionally preserved byte-for-byte per the assignment (visual design must stay identical; only the primitive swap is in scope).
- Consumers of `<Button asChild>` throughout the app: intentionally NOT touched — consumer call sites are fixed in a later migration phase. This file only owns the wrapper's own API.

## Behavior changes

- Default `type="button"` (FLAGGED, not patched). The old wrapper rendered a bare `<button>` element (when `asChild` was false), which inherits the native default `type` — i.e. `type="submit"` when the button sits inside a `<form>`. The Base UI Button primitive injects `type="button"` by default (`node_modules/@base-ui/react/use-button/useButton.js:79` — `const type = isNativeButton ? 'button' : undefined`). Consequence: any `<Button>` placed inside a `<form>` that relied on the implicit native submit behavior will NO LONGER submit the form. Consumers must pass `type="submit"` explicitly. An explicitly passed `type` still wins — `mergeProps` puts `otherExternalProps` last (useButton.js:141), so user-provided `type` overrides the injected default.
- `asChild` removed from the public API (FLAGGED). Polymorphism is now via the Base UI Button `render` prop. `<Button asChild><a/></Button>` becomes `<Button render={<a/>} nativeButton={false} />`. Consumer sites are a later phase; this is an API surface change on the wrapper.
- New pass-through props gained from the Base UI primitive: `render`, `nativeButton` (default `true`), `focusableWhenDisabled` (default `false`). These are additive; no existing behavior changes from their defaults. A native disabled button remains non-focusable (matches prior native behavior) unless `focusableWhenDisabled` is set.

## Verify by hand

1. Render a default `<Button>Click</Button>` — confirm it still looks pixel-identical (height, padding, colors, hover, focus ring) across all variants (default/destructive/outline/secondary/ghost/link) and sizes (default/sm/lg/icon/icon-sm/icon-lg).
2. Keyboard: Tab to a Button, press Enter and Space — confirm it activates (onClick fires once each).
3. Disabled: `<Button disabled>` — confirm `disabled:opacity-50` + `disabled:pointer-events-none` apply and clicks do nothing.
4. FORM SUBMIT CHECK (the flagged delta): put a `<Button>` with no explicit `type` inside a `<form>` and confirm whether it should submit. If it must submit, add `type="submit"`. Base UI now defaults to `type="button"` (no submit).
5. Icon buttons: `<Button size="icon"><SomeSvg/></Button>` — confirm the svg is sized to `size-4` and the `has-[>svg]` padding rules still collapse padding as before.

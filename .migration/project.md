# project

2026-07-23, whole-project migration (transformation engine, legacy new-york style), Radix UI fully removed — 0 wrappers remain on Radix.

## Scope

- Usage audit first: only 13 of 52 files in `src/components/ui` were imported (directly or transitively via sidebar). The other 39 were deleted rather than migrated (reinstall latest base variants later if needed).
- Already Base UI before this run: accordion.tsx, tabs.tsx, base-collapsible.tsx. Plain HTML (nothing to do): kbd.tsx, input.tsx.
- Migrated this run (one commit each): button, separator, tooltip, popover, sheet, dropdown-menu, collapsible (finalized from base-collapsible), sidebar.
- Consumer sweep (one commit): nav-main.tsx, render-default-options.tsx, table-of-content.tsx, docs-copy-button.tsx — all 9 `asChild` sites → `render`, `group-data-[state=open]` → `group-data-open`.

## Dependency swap

- Removed all 26 `@radix-ui/*` packages from package.json (zero imports left in src). Remaining `@radix-ui` entries in bun.lock are transitive deps of fumadocs-ui.
- Also removed 8 libraries orphaned by the unused-component deletion: cmdk, vaul, input-otp, react-day-picker, embla-carousel-react, sonner, react-hook-form, @hookform/resolvers.
- `@base-ui/react` ^1.0.0 (already installed before this run).

## App-code sweep summary

- `grep -rn "radix-ui\|@radix-ui\|asChild" src` — empty.
- `grep -rn "data-\[state\|data-\[side\|data-\[align\|data-\[orientation" src` — every remaining hit is a self-set custom attribute (component-preview-tabs data-[align], table-of-content data-[depth], sidebar's own data-[side/state/variant/collapsible]) or a live Base UI positioner attribute. No stale radix selectors.
- Adversarial verify pass: 0 blockers; 2 warnings (PopoverAnchor is now an inert passthrough div per skill rule — only consumer was already vestigial; tooltip keeps the project's sideOffset=0 rather than the base golden 4).

## Final build result

- `bunx tsc --noEmit`: clean (baseline before migration was also clean).
- `bun run build` (registry build + next build): passes, all routes generated.
- Production server smoke test: zero console errors across desktop interactions (dropdown, collapsible, theme toggle) and a hard load at 390px with the mobile sheet — the harshest hydration path.
- Visual before/after screenshot comparison (agent-browser, dev server): docs index, area-chart page (dark + light), copy-page dropdown open, nav collapsible expanded, mobile viewport, mobile sheet open — pixel-identical apart from focus-ring position inside the freshly opened sheet (Base UI initial-focus lands on the first item; Radix landed elsewhere).

## Flagged for the user (not fixed)

- **components.json still says `style: "new-york"`** — a legacy radix style with no base counterpart. Future `shadcn add <component>` will deliver RADIX variants. Decide whether to switch the style (restyles new adds to a base-* look) or add components manually.
- Base UI Button defaults to `type="button"`; forms relying on implicit submit need explicit `type="submit"` (no such form exists in src today).
- Separator is always semantic in Base UI (`role="separator"`); the radix `decorative` default is gone.
- Known Base UI menu behavior deltas (see dropdown-menu.md), tooltip arrow placement on side="right" (see tooltip.md).

## Verify by hand

- Docs sidebar: expand/collapse a multi-child section (Bar Chart), caret rotates, sub-items indent.
- Copy Page split button: dropdown opens, items navigate and close the menu.
- TOC "On This Page" dropdown at narrow width: opens, navigates, closes.
- Mobile (<940px): sidebar sheet opens/closes with backdrop; Escape closes.
- Collapsed-rail tooltips (if enabled anywhere): arrow centered on trigger.

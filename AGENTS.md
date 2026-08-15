# AGENTS.md

## Purpose

This is the canonical working guide for agents in the EvilCharts repository. Keep it aligned with the codebase when architecture, commands, or release behavior changes. Tool-specific instruction files should point here instead of duplicating project context.

## Product

EvilCharts is two things in one repository:

1. A shadcn-compatible registry of copy-paste chart components built on Recharts and Apache ECharts.
2. The Next.js site at evilcharts.com that presents the registry, renders its examples, publishes documentation, and exposes machine-readable agent surfaces.

The installable registry source is the product. Site code demonstrates and delivers it, but registry components must continue to work after they are copied into a consumer's project.

## Current stack

- Bun and `bun.lock`
- Next.js 16 App Router and React 19
- TypeScript in strict mode; `@/*` maps to `src/*`
- Tailwind CSS v4
- Base UI (`@base-ui/react`) for site primitives; this codebase is not using Radix
- Fumadocs MDX for documentation
- Recharts 3 for SVG charts
- ECharts 6 with modular imports; Canvas is the default renderer and SVG is optional
- Motion (`motion/react`) for animation
- shadcn CLI registry schema/build tooling
- ESLint 9 and Prettier with import and Tailwind class sorting plugins

Do not add another package manager lockfile. Avoid new runtime dependencies unless the task requires one and the tradeoff is clear.

## Commands

```bash
bun install                 # install dependencies
bun run dev                 # local Next.js server
bun run lint                # lint the repository
bunx eslint <files...>      # lint only touched files
bunx tsc --noEmit           # type-check
bun run registry:build      # rebuild registry artifacts without cleaning first
bun run registry:fresh      # remove and rebuild all registry artifacts
bun run build               # registry:fresh followed by next build
```

There is currently no automated test suite. For most changes, use scoped ESLint plus TypeScript. Run `registry:fresh` for registry work and a production build for routing, MDX, metadata, or integration changes when practical.

`CONTRIBUTING.md` and older prose may mention obsolete paths or package-manager commands. The scripts in `package.json` and the current source tree are authoritative.

## Repository map

### Installable registry: `src/registry/`

- `charts/`: 16 flat chart modules, one for each of eight chart types per provider: area, line, bar, composed, radar, pie, radial, and sankey.
- `ui/`: provider-specific shared chart primitives. Recharts currently has chart, tooltip, legend, dot, brush, and background modules. ECharts has chart, tooltip, legend, dot, and brush modules.
- `examples/recharts/` and `examples/echarts/`: small `ex-*` documentation demos.
- `blocks/recharts/` and `blocks/echarts/`: larger installable compositions prefixed `b-` on disk.
- `registry-chart.ts`, `registry-ui.ts`, `registry-example.ts`, and `registry-blocks.ts`: item manifests, dependencies, and consumer target paths.
- `index.ts`: combines all manifest groups into the registry.
- `__index__.tsx`: generated lazy component index used by documentation previews. Never edit it manually.

Registry package names are provider-qualified, for example `@evilcharts/recharts-area-chart` and `@evilcharts/echarts-area-chart`. Consumer targets live under `components/evilcharts/{charts,ui,blocks}`.

Internal registry modules import from `@/registry/...`; the registry and LLM tooling rewrites those paths for consumers. Keep installable source self-contained: do not import docs components, landing-page code, or repository-only assets into it. Reuse `@/lib/utils` only for standard shadcn-style helpers such as `cn`. Prefer inline SVG in installable examples/blocks over site asset imports.

### Registry build pipeline

`src/scripts/build-registry.mts` reads `src/registry/index.ts` and produces:

- `src/registry/__index__.tsx` for live preview lookup
- root `registry.json` for the shadcn manifest
- `public/r/*.json` through `shadcn build`

The first two generated files are tracked. `public/r/` is generated and gitignored. Never hand-edit generated output. Any registry source or manifest change must be followed by `bun run registry:fresh`; include resulting tracked changes when they are relevant.

An MDX `<ComponentPreview name="..." />` resolves through the generated `Index`. The name must exactly match a registered item, and a new preview will not work until the registry is rebuilt.

### Chart architecture

The two providers intentionally share concepts and `ChartConfig`, not rendering internals.

- Recharts modules export compound components such as `EvilAreaChart`. The root owns shared state in React context and visual children such as `Area`, `XAxis`, `Grid`, `Tooltip`, and `Legend` consume it. Recharts renders SVG.
- ECharts modules export roots such as `EChartsAreaChart`. Their child components are declarative configuration slots that return `null`; the root inspects its children and builds a typed ECharts option. ECharts is registered modularly, uses Canvas by default, and supports SVG through the root's `renderer="svg"` prop.
- `ChartConfig` colors are exposed as `--color-<key>-<slot>` CSS variables. Recharts consumes them directly; ECharts resolves browser CSS colors before painting with the selected renderer.
- Cartesian charts support selection, loading states, animation, tooltips/legends, and optional brush behavior. Preserve parity between provider twins where their APIs overlap, while respecting renderer-specific implementations.
- Motion-heavy work must honor `prefers-reduced-motion`/`useReducedMotion`. Avoid option pushes or React state churn inside continuous ECharts pointer, zoom, or animation loops unless there is no imperative alternative.

Use the closest current chart of the same provider as the implementation reference. `src/registry/charts/recharts-area-chart.tsx` remains a good Recharts compound-component reference; ECharts implementations are deliberately more imperative and should be compared with their current provider twins rather than mechanically ported from Recharts.

`.contexts/echarts-provider.md` contains useful historical explanations of canvas colors, brush overlays, option builders, and ECharts pitfalls. It predates the complete eight-chart provider and contains stale paths/status in places, so use it as subsystem history, not as authority over current code.

### Documentation: `src/content/docs/`

Fumadocs content is organized as:

- shared pages: `/docs` and `/docs/chart-config`
- Recharts: `src/content/docs/recharts/**` -> `/docs/recharts/**`
- ECharts: `src/content/docs/echarts/**` -> `/docs/echarts/**`

Each provider has `installation.mdx`, `components.mdx`, chart folders, UI pages, and a provider `meta.json` that controls navigation order. Chart folders contain `static.mdx`, `meta.json`, and optional `blocks.mdx`.

The MDX collection is defined in `source.config.ts`, loaded by `src/lib/source.ts`, and rendered by `src/app/docs/[[...slug]]/page.tsx`. Custom MDX components live in `src/components/docs/mdx`, with preview/source machinery in `src/components/docs/charts`.

`next.config.ts` owns provider redirects, legacy Recharts URLs, and `.md` rewrites. Its chart slug list is explicit. When adding a new chart type or increasing documentation nesting depth, update routing rules as well as content metadata.

### Provider release state

`src/globals/constants/providers.ts` is the provider registry and release gate.

- `PROVIDERS` defines the supported provider IDs.
- `DEFAULT_PROVIDER` controls the docs UI default.
- `PROVIDER_META[id].available` controls whether an engine is publicly advertised as installable by agent-facing indexes and whether the UI shows it as available.

The repository can contain complete, directly navigable ECharts source/docs while `available` is still `false`. Treat that as an intentional release switch; do not flip it as a side effect of unrelated work.

### Site and delivery surfaces

- `src/app/page.tsx` is the actual landing page. It is not a redirect.
- `src/components/landing/` contains the animated camera-pan showcase and landing-only chart cards.
- `src/components/docs/` contains docs chrome, navigation, previews, and MDX components.
- `src/components/ui/` contains generic site UI primitives.
- `src/app/globals.css` contains Tailwind v4 theme tokens and global styles.
- `src/globals/constants/` contains provider and site metadata.

Agent-readable delivery is a first-class surface:

- `/llms.txt` and `/llms-full.txt`
- `/docs/**.md` via rewrites to `src/app/llm/[[...slug]]`
- `/mcp` JSON-RPC endpoint with documentation search/read tools
- `/skill.md` and `/.well-known/{skills,agent-skills}` discovery routes

`src/lib/agent-docs.ts` derives these surfaces from the Fumadocs source and provider availability. `src/lib/llm.ts` converts custom MDX into readable markdown and embeds registry source. When adding a custom MDX component or changing provider publication, verify both the browser docs and markdown/agent output.

Axiom tracking in `src/lib/axiom.ts` is optional and must remain harmless when its environment variables are absent. Never expose or commit `.env*` values.

## Common change workflows

### Add or change a chart

1. Change the provider chart module in `src/registry/charts/` and any provider UI primitive it uses.
2. Keep the provider twin's public API aligned where the feature is meant to be shared.
3. Update the entry in `src/registry/registry-chart.ts`, including direct dependencies, `registryDependencies`, and target path.
4. Add/update examples in the matching provider directory and their entries in `registry-example.ts`.
5. Update the provider MDX API docs and preview names.
6. For a new chart type, update the provider `meta.json` and the explicit chart redirects in `next.config.ts`.
7. Run scoped lint, TypeScript, and `bun run registry:fresh`.

### Add an example or block

1. Add the source under the matching provider directory.
2. Register it in `registry-example.ts` or `registry-blocks.ts`.
3. Reference the exact registry item name from MDX.
4. Keep examples focused on one behavior; keep blocks polished and portable.
5. Rebuild the registry and verify the preview/source tabs.

### Change docs or machine-readable output

1. Update MDX and its nearest `meta.json` when navigation changes.
2. If adding custom MDX syntax, extend `processMdxForLLMs` so markdown endpoints do not leak raw JSX.
3. Check canonical metadata, `.md` alternates, redirects/rewrites, and agent provider gating.
4. Run TypeScript and a production build when practical.

## Code conventions

- Use TypeScript and the `@/*` alias.
- Preserve existing public APIs unless the task explicitly calls for a breaking change.
- Kebab-case filenames. Use `ex-` for example files and `b-` for block files.
- Follow existing provider-qualified naming for new registry items.
- Use `ChartConfig` instead of hard-coded series colors when building general chart APIs.
- Keep browser-only chart modules marked `"use client"`.
- Base UI uses its `render` composition API and data attributes; do not paste Radix-only patterns into it.
- Prefer derived values and imperative refs for renderer-only state over effects that only synchronize React state.
- Clean up observers, ECharts instances, animation frames, timers, and event handlers. Account for React Strict Mode remounts.
- Format with the repository Prettier configuration; it sorts imports and Tailwind classes.
- Use conventional commit subjects (`feat:`, `fix:`, `docs:`, `chore:`, and similar) when asked to commit.

## Before handing off

- Inspect `git diff` and preserve unrelated user changes.
- Confirm generated files were not edited directly.
- Run the smallest meaningful checks, then broader checks in proportion to risk.
- For visual chart work, verify light/dark themes, responsive sizing, loading/empty states, interaction, and reduced motion.
- For registry work, confirm manifest names, dependencies, consumer target paths, generated JSON, and MDX preview lookup all agree.
- Do not commit temporary screenshots, browser artifacts, `.env*`, `.next/`, `.source/`, or `public/r/`.

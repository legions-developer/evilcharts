# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

EvilCharts (evilcharts.com) — a shadcn-compatible registry of animated Recharts chart components, plus the Next.js docs site that serves it. The installable components are the product; the site documents them and serves the registry JSON, markdown-for-LLMs docs, an MCP endpoint, and agent skills.

Deep context documents for specific subsystems live in `.contexts/` — read `.contexts/echarts-provider.md` BEFORE working on anything under `src/registry/charts/echarts/` or the provider/docs-split infrastructure.

## Model usecase

- Always use Fable for main task/research and use opus 4.8 model for subagents/workflows always.
- if message contains any link to urls, and according to message you need context or data from url, then use Firecrawl MCP (only use if its available else proceed with default method)
- agent-browser screenshots are temp files — NEVER commit or push them. Save them to the session scratchpad (not the repo); if one lands in the repo, delete it right after reading it, and always sweep for stray images before any commit/push.

## Commands

Uses **bun** (bun.lock). CONTRIBUTING.md is outdated where it conflicts with this (it references yarn, a root `charts/` directory, and a `gen-cli` script — none exist anymore).

- `bun install` — install dependencies
- `bun run dev` — dev server at localhost:3000 (`/` redirects to `/docs`)
- `bun run build` — rebuilds the registry (`registry:fresh`) then `next build`
- `bun run lint` — ESLint
- `bun run registry:fresh` — clean + rebuild all registry artifacts; run after adding/renaming any registry item
- There is no test suite.

## Architecture

Stack: Next.js 16 App Router, React 19, Tailwind CSS v4, Base UI (`@base-ui/react` — migrated off Radix), Fumadocs for docs, Recharts + motion for charts. Path alias `@/*` → `src/*`.

### Registry (the core)

`src/registry/` is the source of truth for everything installable:

- `charts/` — the 8 chart components (area, bar, line, pie, radar, radial, composed, sankey). Each is a **compound component**: a root `Evil<X>Chart` owns data/config/selection state in React context, and sub-parts (`<Area />`, `<XAxis />`, `<Grid />`, `<Tooltip />`, `<Legend />`, `<Dot />`, …) are composed as children and read that context. **`charts/area-chart.tsx` is the reference implementation** — new charts should follow its structure (context + `use()` hook, per-series SVG defs scoped by `useId`, variants as SVG patterns/gradients, motion.dev reveal masks with `useReducedMotion` opt-out, loading skeleton with shimmer).
- `ui/` — shared primitives the charts depend on: `chart.tsx` (ChartContainer/ChartConfig), `tooltip.tsx`, `legend.tsx`, `dot.tsx`, `evil-brush.tsx` (zoom brush), `background.tsx`.
- `examples/` — `ex-*` demo components, one per docs preview.
- `blocks/` — `b-*` larger showcase blocks.
- `registry-chart.ts` / `registry-ui.ts` / `registry-example.ts` / `registry-blocks.ts` — registry item definitions (name, deps, `registryDependencies` like `@evilcharts/chart`, target install paths under `components/evilcharts/`), aggregated in `index.ts`.

Adding a registry item requires both the component file and an entry in the matching `registry-*.ts` file, then `bun run registry:fresh`.

### Registry build pipeline

`src/scripts/build-registry.mts` (run via `registry:build`) generates three things from `src/registry/index.ts`:

1. `src/registry/__index__.tsx` — a `React.lazy` component map the docs use to render previews
2. `registry.json` — the shadcn registry manifest
3. `public/r/*.json` — the served registry files, via `bunx shadcn build`

All three are generated — never edit them by hand.

### Docs

Fumadocs MDX. Content lives in `src/content/docs/**` (one folder per chart type with `static.mdx` + `meta.json`); the collection is defined in `source.config.ts` (rehype-pretty-code with min-light/vesper themes) and loaded by `src/lib/source.ts`. `src/app/docs/[[...slug]]/page.tsx` renders pages with the custom MDX components in `src/components/docs/mdx`. In MDX, `<ComponentPreview name="ex-..." />` looks the example up in the generated `__index__.tsx` — so a preview only works after the registry has been built and the example registered.

### LLM/agent surfaces (`src/app/`)

- `/llms.txt`, `/llms-full.txt` — route handlers serving doc indexes
- `/docs/**.md` — rewritten (see `next.config.ts`) to `/llm/[[...slug]]`, which serves any doc page as markdown via `src/lib/llm.ts` / `src/lib/agent-docs.ts`
- `/mcp` — a minimal JSON-RPC MCP server exposing `search_docs` and `read_doc`
- `/skill.md` and `/.well-known/{skills,agent-skills}` — agent skill files

Axiom (`src/lib/axiom.ts`) tracks docs markdown fetches and registry installs; it is a no-op unless `AXIOM_TOKEN`/`AXIOM_DATASET` are set.

### shadcn config

`components.json`: style `base-nova`, the `@evilcharts` registry points at `http://localhost:3000/r/{name}.json` for local testing. Generic site UI lives in `src/components/ui`; docs-site chrome in `src/components/docs`.

## Conventions

- Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`, …)
- Kebab-case chart/example file names; examples prefixed `ex-`, blocks `b-`
- Charts use `recharts` for rendering and `motion` for animation — avoid new dependencies without discussion
- Blocks and examples inline any SVG/icon markup directly in the component code — never import icons or assets. These files are installed into consumer projects, so they must be dependency-free beyond the chart itself.
- Chart colors come from `ChartConfig` CSS variables (`var(--color-<key>-<n>)`), supporting multi-stop gradients per series
- Prettier with import sorting and Tailwind class sorting (`prettier-plugin-sort-imports`, `prettier-plugin-tailwindcss`)

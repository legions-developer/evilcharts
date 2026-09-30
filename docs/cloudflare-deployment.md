# Cloudflare deployment

EvilCharts is a Next.js static export hosted with Cloudflare Workers Static Assets.
Next.js, Fumadocs, syntax highlighting, and source-file reads run during the build.
The production Worker handles MCP POST requests, markdown content negotiation, and
optional Axiom tracking. It does not run a Next.js server or an adapter.

## Build and preview

```sh
bun install --frozen-lockfile
bun run build
bun run preview
```

The build rebuilds the registry, exports Next.js into `out/`, and then generates
public `/docs/**.md` files, `_redirects`, and `_headers`. All published agent docs
are indexed in `/agent-docs.json` for the Worker. Provider publication continues
to follow `PROVIDER_META[id].available`.

`bun run dev` runs Next.js for UI and documentation authoring. Use
`bun run preview` to verify production routing, MCP, and content negotiation.
Rebuild before previewing source changes. In another terminal, verify the export:

```sh
bun run verify:static
```

To check a deployment instead, pass its origin:

```sh
bun run verify:static -- https://evilcharts.example.workers.dev
```

## Deploy

Authenticate Wrangler with your Cloudflare account, then deploy:

```sh
bunx wrangler login
bun run deploy
```

The Worker name is `evilcharts` in `wrangler.jsonc`; change it if that name is
already used in your account. Wrangler uploads `out/` and the small Worker in
one deployment. No KV, R2, D1, or other storage provisioning is required.

For automatic deployments, connect this GitHub repository in Cloudflare
Workers Builds. Use:

- Install command: `bun install --frozen-lockfile`
- Build command: `bun run build`
- Deploy command: `bunx wrangler deploy`

Use the Bun version expected by `bun.lock`. The existing pnpm files, if present
in a local checkout, are not part of this build workflow.

`NEXT_PUBLIC_APP_URL` is an optional **build-time** variable for canonical and
agent URLs. It defaults to `https://evilcharts.com`; keep the production URL
while testing on `workers.dev` so preview URLs do not become canonical.

Verify the deployment on `workers.dev`, then attach `evilcharts.com` as a custom
domain in the Worker's settings. Retain the Vercel deployment until the domain
switch and endpoint checks succeed. This repository change does not switch DNS.

## Optional analytics

Set Axiom values as Worker secrets, not as public build variables:

```sh
bunx wrangler secret put AXIOM_TOKEN
bunx wrangler secret put AXIOM_DATASET
```

For local preview, use an ignored `.dev.vars` file. Tracking is disabled unless
both values are present. It records successful registry downloads and negotiated
markdown requests, using Cloudflare's country header. Failures do not block
responses. Registry paths and docs paths invoke the Worker to preserve this
request-level tracking; other assets are served directly by Cloudflare.

Vercel Web Analytics has been removed. Enable Cloudflare Web Analytics through
the dashboard if page-view analytics are wanted; Axiom request events continue
independently.

## Static behavior

- Chart interactions and theme switching continue to run in the browser.
- Documentation, registry JSON, skill discovery, robots, and sitemap update on
  deployment.
- GitHub stars are fetched at build time and remain a snapshot until the next
  build. ISR is no longer used.
- Explicit `.md` links are static assets. Requests to a docs page with
  `Accept: text/markdown` receive the same markdown through the Worker. Responses
  vary by `Accept`; negotiated markdown is not cached under the HTML URL.
- Existing `/llm` URLs remain available through the Worker.
- MCP `search_docs` and `read_doc` use only generated assets and preserve provider
  publication gating. Repository files are never read in production.
- The generated redirect file comes from
  `src/globals/constants/site-redirects.ts`. Update that source when adding a
  chart type or changing legacy routes.

References: [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/),
[Next.js static export](https://nextjs.org/docs/app/guides/static-exports).

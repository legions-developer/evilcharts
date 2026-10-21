# Cloudflare deployment

EvilCharts runs on Cloudflare Workers through OpenNext. The regular Next.js build
and Vercel deployment remain supported during the migration. No production domain
is attached by the checked-in configuration.

## Local verification

Use Bun to install the pinned dependencies. OpenNext 1.20.8 requires Next.js
16.3.8 or newer on the Next 16 release line; update and validate these together.

```sh
bun install --frozen-lockfile
bun run build:cloudflare
bun run preview:cloudflare
```

The preview uses the actual Workers runtime with local R2 and Durable Object
storage. It does not deploy anything or require production credentials. Run the
HTTP checks in a second terminal:

```sh
bun run verify:cloudflare http://localhost:8787
bunx wrangler deploy --dry-run
```

The checks cover every markdown page and registry artifact, source payloads,
content negotiation, redirects, discovery routes, sitemap, robots, and 404s.
Also exercise both providers' previews, code/copy tabs, themes, navigation, and
responsive layouts in the browser. Test a cache miss or expired entry so initial
prerendered output cannot hide a runtime rendering failure.

`bun run dev` still runs Next.js. It first generates portable content and watches
source changes so code previews and copied markdown stay current. For standalone
content generation, use `bun run content:build`.

## Build and runtime behavior

- `build:cloudflare` invokes the existing `build` script through OpenNext. That
  script runs `registry:fresh`, bundles raw documentation and source into the
  ignored `src/generated/content.json`, then builds Next.js. Never skip the
  registry or content steps in CI.
- Runtime rendering reads bundled strings instead of repository files. This
  applies to code previews, Copy Page, `.md` responses, and `llms-full.txt`.
- Runtime source highlighting uses Shiki's JavaScript regex engine with bundled
  grammars and themes. Workers cannot compile the default WebAssembly engine from
  a buffer when an uncached documentation page renders.
- R2 stores Next.js incremental cache entries. A Durable Object queue coordinates
  timed revalidation. Cache interception serves cached responses before Next.js
  so background regeneration belongs to the queue's request. Reassess this setting
  before enabling Partial Prerendering, which interception does not support.
  Keep `WORKER_SELF_REFERENCE.service` equal to the Worker
  `name` if either changes. No tag database is needed while the application uses
  only timed revalidation.
- `/r/*` runs through the Worker before static asset delivery, preserving Axiom
  registry tracking. Other static assets are served directly, and hashed Next.js
  assets receive immutable cache headers from `public/_headers`.
- The Images binding preserves the `next/image` optimization path. Fonts remain
  bundled by `next/font`; the build needs access to Google Fonts.
- Next.js `proxy.ts` support in OpenNext is experimental. Keep the pinned adapter
  and test both registry delivery and `Accept: text/markdown` when upgrading.
- The measured compressed Worker bundle is approximately 4.3 MiB, which requires
  Workers Paid (above the Free plan's 3 MiB limit, below Paid's 10 MiB limit).
  Check the dry-run size after dependency changes.

OpenNext 1.20.8 currently logs nonfatal `Failed to copy` diagnostics for
`hast-util-to-html`, `hast-util-whitespace`, and `property-information`. Its
`workerd` export-condition scanner rejects their string-form `exports` fields.
The production build and Worker runtime checks pass with these packages bundled;
recheck this adapter diagnostic when upgrading.

## Environment variables

| Variable                                 | Where to set it                     | Purpose                                                                                                                |
| ---------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                    | Build environment                   | Canonical public origin; defaults to `https://evilcharts.com`. Keep this production origin during staging comparisons. |
| `NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` | Build environment, optional         | Enables the Cloudflare Web Analytics beacon. This is the public beacon token, not an account API token.                |
| `AXIOM_TOKEN`                            | Worker secret, optional             | Axiom ingest credential.                                                                                               |
| `AXIOM_DATASET`                          | Worker variable or secret, optional | Dataset used with `AXIOM_TOKEN`; both are required to send events.                                                     |

Public variables are compiled into the build; setting only runtime variables
does not change already-generated pages. In Workers Builds, configure these as
**Build variables and secrets** before building. For local runtime testing, put
optional Axiom settings in ignored `.dev.vars`. Do not copy production secrets
into a PR or log them.

Vercel builds (`VERCEL=1`) continue to render Vercel Analytics. Other builds use
the optional Cloudflare beacon. When configuring a beacon token, choose manual
script installation in Cloudflare Web Analytics so automatic injection does not
add a second beacon. Analytics history stays with its original provider.

Axiom sends each event within the request's background-work lifetime. Missing
configuration or ingest failures do not prevent page or registry delivery.
Country data prefers Cloudflare's `cf-ipcountry` header with a Vercel fallback.

## Staging and eventual cutover

The following steps change Cloudflare resources and should be performed when
deployment is authorized, after reviewing this PR:

1. Select the Cloudflare account and enable the services required by the config.
2. Create the configured cache bucket with
   `bunx wrangler r2 bucket create evilcharts-next-cache`.
3. Configure the build variables and optional runtime secrets. For example,
   `bunx wrangler secret put AXIOM_TOKEN` prompts for the token without putting it
   in shell history.
4. Run `bun run deploy:cloudflare` to build and deploy to the Worker's
   `workers.dev` hostname. OpenNext populates the R2 prerender cache during deploy;
   use this command rather than a bare `wrangler deploy`.
5. Run `bun run verify:cloudflare https://<worker-hostname>` against that build.
   Verify a real shadcn install, Cloudflare Images, Axiom ingestion, browser
   analytics, and revalidation with the real bindings. Local simulation cannot
   prove account configuration or remote delivery.
6. Attach `evilcharts.com` only after staging passes. Keep Vercel available for
   rollback. Preserve all URL paths, existing redirects, and provider release
   flags. Avoid broad CDN cache rules that mix HTML, markdown, or RSC responses,
   and verify registry/agent requests are not intercepted by browser challenges.

For separate staging and production Workers, give each its own cache bucket and
matching self-reference binding. Do not reuse one environment's cache or secrets
for another.

References: [OpenNext setup](https://opennext.js.org/cloudflare/get-started),
[caching](https://opennext.js.org/cloudflare/caching),
[static assets](https://opennext.js.org/cloudflare/howtos/assets), and
[Workers limits](https://developers.cloudflare.com/workers/platform/limits/).

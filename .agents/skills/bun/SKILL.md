---
name: bun
description: Use when building, testing, and deploying JavaScript/TypeScript applications. Reach for Bun when you need to run scripts, manage dependencies, bundle code, or test applications with a single unified tool.
metadata:
  mintlify-proj: bun
  version: "1.0"
---

# Bun Skill Reference

## Product Summary

Bun is a unified JavaScript runtime, package manager, bundler, and test runner written in Zig. It replaces Node.js, npm, esbuild, and Jest with a single fast binary. Key files: `bunfig.toml` (configuration), `bun.lock` (lockfile), `package.json` (project metadata). Primary commands: `bun run`, `bun install`, `bun build`, `bun test`. Bun is 4x faster than Node.js on startup and 25x faster than npm for installations. Visit https://bun.com/docs for comprehensive documentation.

## When to Use

Use Bun when:
- **Running scripts**: Execute TypeScript/JavaScript files directly without compilation steps (`bun run file.ts`)
- **Managing dependencies**: Install, add, remove, or update packages faster than npm/yarn/pnpm (`bun install`, `bun add`)
- **Bundling code**: Build JavaScript/TypeScript for browser or server targets with `bun build`
- **Testing**: Run Jest-compatible tests with built-in test runner (`bun test`)
- **Building full-stack apps**: Bundle server and client code together into single executables
- **Monorepo workflows**: Use workspaces and filtering to manage multiple packages
- **Replacing Node.js**: Run any Node.js-compatible code with better performance

Do not use Bun for: type checking (use `tsc` separately), generating type declarations, or projects requiring exact Node.js compatibility for native modules.

## Quick Reference

### Essential Commands

| Task | Command | Notes |
|------|---------|-------|
| Run TypeScript file | `bun run file.ts` | Transpiles on-the-fly; omit `run` for short form |
| Run package script | `bun run dev` | Executes script from `package.json` |
| Install dependencies | `bun install` | Creates `bun.lock` lockfile |
| Add package | `bun add react` | Adds to `dependencies`; use `-d` for dev |
| Remove package | `bun remove react` | Removes from `package.json` and `node_modules` |
| Run tests | `bun test` | Finds `*.test.ts`, `*.spec.ts` files automatically |
| Build bundle | `bun build ./src/index.ts --outdir ./dist` | Bundles with tree-shaking, minification optional |
| Watch mode | `bun --watch run file.ts` | Re-runs on file changes |
| Create project | `bun init` | Scaffolds new project with templates |

### Configuration File: bunfig.toml

Located at project root or `~/.bunfig.toml` (global). Optional but useful for customization.

```toml
[install]
dev = true                    # Install devDependencies
optional = true               # Install optionalDependencies
peer = true                   # Install peerDependencies
linker = "hoisted"           # "hoisted" or "isolated" (pnpm-style)
saveTextLockfile = true      # Use text bun.lock instead of binary

[serve]
port = 3000                  # Default port for Bun.serve()

[test]
root = "."                   # Test root directory
coverage = false             # Enable coverage reporting
timeout = 5000               # Per-test timeout in ms
preload = ["./setup.ts"]     # Scripts to run before tests

[run]
shell = "system"             # "system" or "bun" (Windows defaults to "bun")
bun = true                   # Auto-alias node to bun in scripts
```

### File Types Supported

Bun natively handles: `.js`, `.jsx`, `.ts`, `.tsx`, `.json`, `.jsonc`, `.toml`, `.yaml`, `.html`, `.css`, `.wasm`, `.node`. No configuration needed—just import and use.

### Key Bun APIs

| API | Purpose | Example |
|-----|---------|---------|
| `Bun.serve()` | Start HTTP server | `Bun.serve({ port: 3000, fetch: handler })` |
| `Bun.file()` | Read/write files | `await Bun.file("path.txt").text()` |
| `Bun.write()` | Write to disk | `await Bun.write("out.txt", data)` |
| `Bun.build()` | Bundle code | `await Bun.build({ entrypoints, outdir })` |
| `Bun.Transpiler` | Transpile code | `new Bun.Transpiler({ loader: "tsx" })` |
| `Bun.spawn()` | Run child process | `Bun.spawn(["ls", "-la"])` |

## Decision Guidance

### When to Use Hoisted vs Isolated Linker

| Scenario | Use | Reason |
|----------|-----|--------|
| New monorepo/workspaces | `isolated` | Prevents phantom dependencies, stricter isolation |
| New single-package project | `hoisted` | Traditional npm behavior, simpler |
| Existing project (pre-v1.3.2) | `hoisted` | Backward compatibility |
| Migrating from pnpm | `isolated` | Matches pnpm's approach |

Set in `bunfig.toml`: `linker = "isolated"` or via CLI: `bun install --linker isolated`

### When to Use bun build vs bun run

| Use Case | Tool | Why |
|----------|------|-----|
| Execute TypeScript directly | `bun run` | Fast transpilation, no output files |
| Prepare for production | `bun build` | Minification, tree-shaking, bundling |
| Ship single executable | `bun build --compile` | Creates standalone binary |
| Development server | `bun run` + `Bun.serve()` | Hot reload, fast iteration |

### When to Use --concurrent in Tests

| Scenario | Use `--concurrent` | Reason |
|----------|-------------------|--------|
| Independent async tests | Yes | Parallel execution speeds up suite |
| Tests with shared state | No | Use `test.serial()` for order-dependent tests |
| Database/API tests | Maybe | Only if tests don't interfere |
| Unit tests | Yes | Usually safe and faster |

## Workflow

### 1. Initialize a Project
```bash
bun init my-app
cd my-app
```
Choose template: Blank, React, or Library. Creates `package.json`, `tsconfig.json`, `.gitignore`.

### 2. Install Dependencies
```bash
bun install
```
Reads `package.json`, downloads packages, creates `bun.lock`. Much faster than npm.

### 3. Add Packages
```bash
bun add react
bun add -d @types/react typescript
```
Updates `package.json` and `bun.lock` automatically.

### 4. Write and Run Code
```bash
# Create index.ts
echo "console.log('Hello Bun!')" > index.ts

# Run it
bun run index.ts
```
Bun transpiles TypeScript on-the-fly; no build step needed.

### 5. Create HTTP Server
```typescript
// server.ts
const server = Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response("Hello!");
  },
});
console.log(`Listening on ${server.url}`);
```
```bash
bun run server.ts
```

### 6. Write Tests
```typescript
// math.test.ts
import { test, expect } from "bun:test";

test("2 + 2 = 4", () => {
  expect(2 + 2).toBe(4);
});
```
```bash
bun test
```
Finds and runs all `*.test.ts` files automatically.

### 7. Bundle for Production
```bash
bun build ./src/index.ts --outdir ./dist --minify
```
Outputs optimized bundle to `dist/`. Use `--target browser|node|bun` to control output format.

### 8. Create Standalone Executable
```bash
bun build ./cli.ts --outfile mycli --compile
./mycli
```
Bundles code + Bun runtime into single executable; no dependencies needed.

## Common Gotchas

- **Lifecycle scripts disabled by default**: Bun doesn't run `postinstall` scripts for security. Add trusted packages to `trustedDependencies` in `package.json` to allow them.
- **`bun run` vs `bun <script>`**: If a built-in Bun command exists with the same name, use `bun run <script>` explicitly to run package.json scripts.
- **Watch mode flag placement**: Use `bun --watch run file.ts`, not `bun run file.ts --watch`. Flags after the filename are passed to the script itself.
- **TypeScript errors on Bun global**: Install `@types/bun` and add `"lib": ["ESNext"]` to `tsconfig.json` compilerOptions.
- **Lockfile format**: Bun v1.2+ uses text `bun.lock` by default (not binary `bun.lockb`). Commit to version control.
- **Auto-install disabled in CI**: Set `install.auto = "disable"` in `bunfig.toml` for production to prevent unexpected package downloads.
- **Node.js compatibility**: Bun implements most Node.js APIs but not all. Check docs for `node:` module support before relying on Node-specific code.
- **Bundler always bundles**: Unlike esbuild, `bun build` always bundles by default. Use `Bun.Transpiler` to transpile individual files without bundling.
- **No type checking in bundler**: `bun build` does not type-check. Run `tsc --noEmit` separately for type validation.
- **Peer dependencies installed by default**: Unlike npm, Bun installs peer dependencies automatically. Set `peer = false` in `bunfig.toml` to disable.

## Verification Checklist

Before submitting work with Bun:

- [ ] Run `bun install` to verify dependencies resolve without errors
- [ ] Run `bun run <script>` to test main entry point
- [ ] Run `bun test` and verify all tests pass
- [ ] Run `bun build` and check output files exist in `outdir`
- [ ] Verify `bun.lock` is committed to version control (not `.gitignore`d)
- [ ] Check `bunfig.toml` for any environment-specific settings that should be removed
- [ ] Confirm no `node_modules` folder is committed (should be in `.gitignore`)
- [ ] Test with `--production` flag if building for deployment: `bun install --production`
- [ ] Verify TypeScript files have no type errors: `bun run tsc --noEmit` (if tsc installed)
- [ ] Check that `package.json` `"type": "module"` is set for ESM projects

## Resources

**Comprehensive navigation**: https://bun.com/docs/llms.txt — Page-by-page listing of all Bun documentation.

**Critical pages**:
1. [Bun Runtime](https://bun.com/docs/runtime) — Execute files, scripts, and manage the runtime
2. [Package Manager](https://bun.com/docs/pm/cli/install) — Install, add, remove packages and manage dependencies
3. [Bundler](https://bun.com/docs/bundler) — Bundle JavaScript/TypeScript for production
4. [Test Runner](https://bun.com/docs/test) — Write and run Jest-compatible tests
5. [bunfig.toml](https://bun.com/docs/runtime/bunfig) — Configure Bun's behavior

---

> For additional documentation and navigation, see: https://bun.com/docs/llms.txt
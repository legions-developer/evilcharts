import { promises as fs } from "node:fs";
import path from "node:path";

async function resolvePaths() {
  const cwd = process.cwd();
  const sourceRoot = path.join(cwd, "registry/default");
  const sourceDirs = {
    hooks: path.join(sourceRoot, "hooks"),
    lib: path.join(sourceRoot, "lib"),
    ui: path.join(sourceRoot, "ui"),
  };
  // From apps/ui → ../../packages/ui/src/*
  const targetRoot = path.resolve(cwd, "../../packages/ui/src");
  const targetDirs = {
    hooks: path.join(targetRoot, "hooks"),
    lib: path.join(targetRoot, "lib"),
    ui: path.join(targetRoot, "components"),
  };
  return { sourceDirs, sourceRoot, targetDirs, targetRoot };
}

async function ensureDirExists(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function copyRegistryTrees() {
  const { sourceRoot, sourceDirs, targetDirs } = await resolvePaths();

  // Validate root exists
  try {
    await fs.access(sourceRoot);
  } catch {
    throw new Error(`Source root not found: ${sourceRoot}`);
  }

  // For each subtree (ui, hooks, lib), copy if present
  for (const key of Object.keys(sourceDirs) as (keyof typeof sourceDirs)[]) {
    const from = sourceDirs[key];
    const to = targetDirs[key];
    try {
      await fs.access(from);
    } catch {
      // Skip silently if the subtree doesn't exist
      continue;
    }
    await ensureDirExists(to);
    await fs.cp(from, to, { force: true, recursive: true });
  }
}

async function getAllFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return getAllFiles(fullPath);
      }
      return [fullPath];
    }),
  );
  return files.flat();
}

function rewriteImports(code: string): string {
  let result = code;
  // Rewrite paths according to rules
  // "@/lib/*"        → "@coss/ui/lib/*"
  // "@/hooks/*"      → "@coss/ui/hooks/*"
  // "@/registry/default/ui/*" → "@coss/ui/components/*"
  // "@/registry/default/hooks/*" → "@coss/ui/hooks/*"
  // "@/registry/default/lib/*" → "@coss/ui/lib/*"
  result = result.replace(/(["'])@\/lib\//g, "$1@coss/ui/lib/");
  result = result.replace(/(["'])@\/hooks\//g, "$1@coss/ui/hooks/");
  result = result.replace(
    /(["'])@\/registry\/default\/ui\//g,
    "$1@coss/ui/components/",
  );
  result = result.replace(
    /(["'])@\/registry\/default\/hooks\//g,
    "$1@coss/ui/hooks/",
  );
  result = result.replace(
    /(["'])@\/registry\/default\/lib\//g,
    "$1@coss/ui/lib/",
  );
  return result;
}

async function rewriteImportsInDir(dir: string): Promise<{ updated: number }> {
  const allFiles = await getAllFiles(dir);
  let updated = 0;
  for (const file of allFiles) {
    if (!/(\.tsx|\.ts|\.mts|\.cts)$/.test(file)) continue;
    const original = await fs.readFile(file, "utf8");
    const transformed = rewriteImports(original);
    if (transformed !== original) {
      await fs.writeFile(file, transformed);
      updated++;
    }
  }
  return { updated };
}

try {
  console.log("📦 Propagating registry primitives → packages/ui/src …");
  const { sourceDirs, targetRoot } = await resolvePaths();
  console.log("├─ Sources:");
  console.log(`│  ├─ UI:    ${sourceDirs.ui}`);
  console.log(`│  ├─ Hooks: ${sourceDirs.hooks}`);
  console.log(`│  └─ Lib:   ${sourceDirs.lib}`);
  console.log(`└─ Target root: ${targetRoot}`);

  await copyRegistryTrees();
  const { updated } = await rewriteImportsInDir(targetRoot);

  console.log(
    `✅ UI primitives synced successfully! (${updated} file(s) updated with rewritten imports)`,
  );
} catch (error) {
  console.error(error);
  process.exit(1);
}

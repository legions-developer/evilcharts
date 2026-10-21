import type { RegistryItem } from "shadcn/schema";
import { promises as fs } from "node:fs";
import path from "node:path";

import { getMdxAttribute, mdxComponentPattern } from "@/lib/mdx-tags";
import { registry } from "@/registry/index";

const root = process.cwd();
const docsDirectory = path.join(root, "src/content/docs");
const outputPath = path.join(root, "src/generated/content.json");

async function readDocs(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return readDocs(entryPath);
      return /\.mdx?$/.test(entry.name) ? [entryPath] : [];
    }),
  );
  return files.flat().sort();
}

function sourcePath(filePath: string) {
  const resolved = path.resolve(root, filePath.replace(/^@\//, "src/"));
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Source file must be inside the repository: ${filePath}`);
  }
  return relative.split(path.sep).join("/");
}

async function buildContent() {
  const docs: Record<string, string> = {};
  const sources: Record<string, string> = {};
  const items: Record<string, RegistryItem> = {};
  const sourcePaths = new Set<string>();

  for (const item of registry.items) {
    items[item.name] = {
      ...item,
      files: item.files?.map((file) => {
        const filePath = sourcePath(`src/registry/${file.path}`);
        sourcePaths.add(filePath);
        return { ...file, path: filePath };
      }),
    };
  }

  for (const filePath of await readDocs(docsDirectory)) {
    const raw = await fs.readFile(filePath, "utf8");
    const docPath = path.relative(docsDirectory, filePath).split(path.sep).join("/");
    docs[docPath] = raw;

    // A source snippet can point to a local file without being a registry item.
    // Include those files in the deployment too, instead of reading them at request time.
    for (const [tag] of raw.matchAll(mdxComponentPattern("ComponentSource"))) {
      const src = getMdxAttribute(tag, "src");
      if (src) sourcePaths.add(sourcePath(src));
    }
  }

  for (const filePath of [...sourcePaths].sort()) {
    sources[filePath] = await fs.readFile(path.join(root, filePath), "utf8");
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const output = `${JSON.stringify({ docs, sources, items })}\n`;
  const previous = await fs.readFile(outputPath, "utf8").catch(() => undefined);
  if (output !== previous) {
    // Keep HMR from reading a partially written JSON file while content rebuilds.
    const temporaryPath = `${outputPath}.${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, output);
    await fs.rename(temporaryPath, outputPath);
  }
  console.log(
    `Bundled ${Object.keys(docs).length} docs and ${sourcePaths.size} source files for runtime access.`,
  );
}

await buildContent();

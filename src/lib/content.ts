import type { RegistryItem } from "shadcn/schema";

import generatedContent from "@/generated/content.json";

// Built before Next.js compiles the application. Requests and ISR can read these
// strings on any host, including Workers, without access to the repository files.
const content = generatedContent as {
  docs: Record<string, string>;
  sources: Record<string, string>;
  items: Record<string, RegistryItem>;
};

export function getDocContent(docPath: string) {
  const raw = content.docs[docPath];
  if (raw === undefined) {
    throw new Error(`Documentation is missing from the content build: ${docPath}`);
  }
  return raw;
}

export function getSourceContent(filePath: string) {
  return content.sources[filePath.replace(/^@\//, "src/").replace(/^\.\//, "")];
}

export function getRegistryMetadata(name: string) {
  return content.items[name];
}

import type { RegistryItem } from "shadcn/schema";
import path from "node:path";

import { getRegistryMetadata, getSourceContent } from "@/lib/content";
import { Index } from "@/registry/__index__";

export function getRegistryComponent(name: string) {
  return Index[name]?.component;
}

export async function getRegistryItem(name: string) {
  const item = getRegistryMetadata(name);

  if (!item) {
    return null;
  }

  const processedFiles = (item.files ?? []).map((file) => {
    const content = getSourceContent(file.path);
    if (content === undefined) {
      throw new Error(`Registry source is missing from the content build: ${file.path}`);
    }
    return { ...file, content: fixImport(content) };
  });

  // Fix file paths.
  const finalFiles = fixFilePaths(processedFiles);

  return {
    ...item,
    files: finalFiles,
  };
}

function getFileTarget(file: { path: string; type?: string; target?: string }) {
  let target = file.target;

  if (!target || target === "") {
    const fileName = file.path.split("/").pop();
    if (
      file.type === "registry:block" ||
      file.type === "registry:component" ||
      file.type === "registry:example"
    ) {
      target = `components/${fileName}`;
    }

    if (file.type === "registry:ui") {
      target = `components/ui/${fileName}`;
    }

    if (file.type === "registry:hook") {
      target = `hooks/${fileName}`;
    }

    if (file.type === "registry:lib") {
      target = `lib/${fileName}`;
    }
  }

  return target ?? "";
}

function fixFilePaths(files: NonNullable<RegistryItem["files"]>) {
  if (!files) {
    return [];
  }

  // Resolve all paths relative to the first file's directory.
  const firstFilePath = files[0]?.path;
  if (!firstFilePath) {
    return [];
  }
  const firstFilePathDir = path.dirname(firstFilePath);

  return files.map((file) => {
    return {
      ...file,
      path: path.relative(firstFilePathDir, file.path),
      target: getFileTarget(file),
    };
  });
}

export function fixImport(content: string) {
  const regex = /@\/(.+?)\/((?:.*?\/)?(?:components|ui|hooks|lib|charts))\/([\w-]+)/g;

  const replacement = (match: string, _path: string, type: string, component: string) => {
    if (type.endsWith("components")) {
      return `@/components/${component}`;
    }
    if (type.endsWith("ui")) {
      return `@/components/evilcharts/ui/${component}`;
    }
    if (type.endsWith("hooks")) {
      return `@/hooks/${component}`;
    }
    if (type.endsWith("lib")) {
      return `@/lib/${component}`;
    }
    if (type.endsWith("charts")) {
      return `@/components/evilcharts/charts/${component}`;
    }

    return match;
  };

  return content.replace(regex, replacement);
}

type FileTree = {
  name: string;
  path?: string;
  children?: FileTree[];
};

export function createFileTreeForRegistryItemFiles(
  files: Array<{ path: string; target?: string }>,
) {
  const root: FileTree[] = [];

  for (const file of files) {
    const path = file.target ?? file.path;
    const parts = path.split("/");
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const existingNode = currentLevel.find((node) => node.name === part);

      if (existingNode) {
        if (isFile) {
          // Update existing file node with full path
          existingNode.path = path;
        } else if (existingNode.children) {
          // Move to next level in the tree
          currentLevel = existingNode.children;
        }
      } else if (part) {
        const newNode: FileTree = isFile ? { name: part, path } : { children: [], name: part };

        currentLevel.push(newNode);

        if (!isFile && newNode.children) {
          currentLevel = newNode.children;
        }
      }
    }
  }

  return root;
}

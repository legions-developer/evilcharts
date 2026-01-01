import type { RegistryItem } from "shadcn/schema";
import { Project, ScriptKind } from "ts-morph";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { Index } from "@/registry/__index__";

export function getRegistryComponent(name: string) {
  return Index[name]?.component;
}

export async function getRegistryItem(name: string) {
  const item = Index[name];

  if (!item) {
    return null;
  }

  // Convert all file paths to object.
  // TODO: remove when we migrate to new registry.
  item.files = item.files.map((file: unknown) =>
    typeof file === "string" ? { path: file } : file,
  );

  // Type assertion for now - TODO: implement proper validation
  const typedItem = item as RegistryItem;

  const files = typedItem.files || [];
  const processedFiles = [];

  for (const file of files) {
    const content = await getFileContent(file);
    const relativePath = path.relative(process.cwd(), file.path);

    processedFiles.push({
      ...file,
      content,
      path: relativePath,
    });
  }

  // Fix file paths.
  const finalFiles = fixFilePaths(processedFiles);

  return {
    ...typedItem,
    files: finalFiles,
  };
}

async function getFileContent(file: { path: string; type?: string }) {
  // Resolve TypeScript path aliases (@/) to actual filesystem paths
  const resolvedPath = file.path.replace(/^@\//, path.join(process.cwd(), "src") + "/");
  const raw = await fs.readFile(resolvedPath, "utf-8");

  const project = new Project({
    compilerOptions: {},
  });

  const tempFile = await createTempSourceFile(file.path);
  const sourceFile = project.createSourceFile(tempFile, raw, {
    scriptKind: ScriptKind.TSX,
  });

  // Remove meta variables.
  // removeVariable(sourceFile, "iframeHeight")
  // removeVariable(sourceFile, "containerClassName")
  // removeVariable(sourceFile, "description")

  let code = sourceFile.getFullText();

  // Some registry items uses default export.
  // We want to use named export instead.
  // TODO: do we really need this? - @shadcn.
  // if (file.type !== "registry:page") {
  //   code = code.replaceAll("export default", "export")
  // }

  // Fix imports.
  code = fixImport(code);

  return code;
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

async function createTempSourceFile(filename: string) {
  const dir = await fs.mkdtemp(path.join(tmpdir(), "shadcn-"));
  return path.join(dir, filename);
}

function fixFilePaths(
  files: Array<{
    path: string;
    type?: string;
    target?: string;
    content?: string;
  }>,
) {
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

export type FileTree = {
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

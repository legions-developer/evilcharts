import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import type { ShikiTransformer } from "shiki";
import { codeToHtml } from "shiki";

// Strip [!code ...] annotations from raw code for copying
export function stripCodeAnnotations(code: string): string {
  const result: string[] = [];

  // Single pass over the lines — cleaning and filtering together avoids
  // re-splitting `code` for every line (which made this O(n²)).
  for (const originalLine of code.split("\n")) {
    // Remove // [!code ...] comments
    let cleaned = originalLine.replace(/\s*\/\/\s*\[!code\s+[^\]]+\]\s*$/, "");
    // Remove /* [!code ...] */ and {/* [!code ...] */} comments
    cleaned = cleaned.replace(/\s*\{?\s*\/\*\s*\[!code\s+[^\]]+\]\s*\*\/\s*\}?\s*$/, "");
    // Remove <!-- [!code ...] --> comments
    cleaned = cleaned.replace(/\s*<!--\s*\[!code\s+[^\]]+\]\s*-->\s*$/, "");

    // Drop lines that were only [!code word:...] annotations
    const isWordAnnotationLine = /^\s*(?:\/\/|\/\*|\{\/\*|<!--)\s*\[!code\s+word:/.test(
      originalLine,
    );
    if (isWordAnnotationLine && cleaned.trim() === "") continue;

    result.push(cleaned);
  }

  return result.join("\n");
}

export const transformers = [
  {
    pre(node) {
      if (node.tagName === "pre") {
        const raw = this.source;
        node.properties.__raw__ = stripCodeAnnotations(raw);
      }
    },
    code(node) {
      if (node.tagName === "code") {
        const raw = this.source;
        const cleanedRaw = stripCodeAnnotations(raw);
        node.properties.__raw__ = cleanedRaw;

        if (raw.startsWith("npm install")) {
          node.properties.__npm__ = raw;
          node.properties.__yarn__ = raw.replace("npm install", "yarn add");
          node.properties.__pnpm__ = raw.replace("npm install", "pnpm add");
          node.properties.__bun__ = raw.replace("npm install", "bun add");
        }

        if (raw.startsWith("npx create-")) {
          node.properties.__npm__ = raw;
          node.properties.__yarn__ = raw.replace("npx create-", "yarn create ");
          node.properties.__pnpm__ = raw.replace("npx create-", "pnpm create ");
          node.properties.__bun__ = raw.replace("npx", "bunx --bun");
        }

        // npm create.
        if (raw.startsWith("npm create")) {
          node.properties.__npm__ = raw;
          node.properties.__yarn__ = raw.replace("npm create", "yarn create");
          node.properties.__pnpm__ = raw.replace("npm create", "pnpm create");
          node.properties.__bun__ = raw.replace("npm create", "bun create");
        }

        // npx.
        if (raw.startsWith("npx")) {
          node.properties.__npm__ = raw;
          node.properties.__yarn__ = raw.replace("npx", "yarn dlx");
          node.properties.__pnpm__ = raw.replace("npx", "pnpm dlx");
          node.properties.__bun__ = raw.replace("npx", "bunx --bun");
        }

        // npm run.
        if (raw.startsWith("npm run")) {
          node.properties.__npm__ = raw;
          node.properties.__yarn__ = raw.replace("npm run", "yarn");
          node.properties.__pnpm__ = raw.replace("npm run", "pnpm");
          node.properties.__bun__ = raw.replace("npm run", "bun");
        }
      }
    },
    line(node) {
      node.properties["data-line"] = "";
    },
  },
  transformerNotationHighlight(),
  transformerNotationWordHighlight(),
  transformerNotationFocus(),
  transformerNotationDiff(),
  transformerNotationErrorLevel(),
] as ShikiTransformer[];

export async function highlightCode(
  code: string,
  language = "tsx",
  options?: { showLineNumbers?: boolean },
) {
  const { showLineNumbers = true } = options ?? {};

  const html = await codeToHtml(code, {
    lang: language,
    themes: {
      light: "min-light",
      dark: "vesper",
    },
    defaultColor: false,
    transformers: [
      {
        code(node) {
          if (showLineNumbers) {
            node.properties["data-line-numbers"] = "";
          }
        },
        line(node) {
          node.properties["data-line"] = "";
        },
        pre(node) {
          node.properties.class =
            "no-scrollbar text-[.8125rem] min-w-0 overflow-x-auto py-3.5 outline-none has-data-[highlighted-line]:px-0 has-data-[line-numbers]:px-0 has-data-[slot=tabs]:p-0 !bg-transparent";
        },
      },
      transformerNotationHighlight(),
      transformerNotationWordHighlight(),
      transformerNotationFocus(),
      transformerNotationDiff(),
      transformerNotationErrorLevel(),
    ],
  });

  return html;
}

import { defineConfig, defineDocs, frontmatterSchema } from "fumadocs-mdx/config";
import { transformers } from "@/lib/highlight-code";
import rehypePrettyCode from "rehype-pretty-code";
import z from "zod";

export default defineConfig({
  mdxOptions: {
    rehypePlugins: (plugins) => {
      plugins.shift();
      plugins.push([
        rehypePrettyCode,
        {
          theme: {
            light: "min-light",
            dark: "vesper",
          },
          defaultColor: false,
          transformers,
        },
      ]);

      return plugins;
    },
  },
});

export const docs = defineDocs({
  dir: "src/content/docs",
  docs: {
    schema: frontmatterSchema.extend({
      image: z.string().optional(),
      links: z
        .object({
          api: z.string().optional(),
          doc: z.string().optional(),
          github: z.string().optional(),
        })
        .optional(),
    }),
  },
});

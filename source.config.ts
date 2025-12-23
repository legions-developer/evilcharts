import { defineConfig, defineDocs } from "fumadocs-mdx/config";

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: "min-light",
        dark: "vesper",
      },
    },
  },
});

export const docs = defineDocs({
  dir: "src/content/docs",
});

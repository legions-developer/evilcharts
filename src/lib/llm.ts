import fs from "fs"
import path from "path"
import { Index } from "@/registry/__index__"
import { source } from "@/lib/source"

/**
 * Resolve a `@/...` import path to an absolute filesystem path.
 * e.g. `@/registry/examples/ex-area-chart.tsx` → `/abs/path/src/registry/examples/ex-area-chart.tsx`
 */
function resolveAliasPath(aliasPath: string): string {
  const relative = aliasPath.replace(/^@\//, "")
  return path.join(process.cwd(), "src", relative)
}

function getComponentsList() {
  const components = source.pageTree.children.find(
    (page) => page.$id === "components"
  )

  if (components?.type !== "folder") {
    return ""
  }

  const list = components.children.filter(
    (component) => component.type === "page"
  )

  return list
    .map((component) => `- [${component.name}](${component.url})`)
    .join("\n")
}

export function processMdxForLLMs(content: string) {
  // Replace <ComponentsList /> with a markdown list of components.
  const componentsListRegex = /<ComponentsList\s*\/>/g
  content = content.replace(componentsListRegex, getComponentsList())

  // Replace <ComponentPreview ... name="xxx" ... /> with actual source code.
  const componentPreviewRegex =
    /<ComponentPreview[\s\S]*?name="([^"]+)"[\s\S]*?\/>/g

  return content.replace(componentPreviewRegex, (_match, name) => {
    try {
      const component = Index[name]
      if (!component?.files?.length) {
        return _match
      }

      const filePath = component.files[0]?.path
      if (!filePath) {
        return _match
      }

      const absolutePath = resolveAliasPath(filePath)

      if (!fs.existsSync(absolutePath)) {
        return _match
      }

      let src = fs.readFileSync(absolutePath, "utf8")

      // Rewrite internal registry paths to user-facing paths.
      src = src.replaceAll("@/registry/ui/", "@/components/evilcharts/ui/")
      src = src.replaceAll(
        "@/registry/charts/",
        "@/components/evilcharts/charts/"
      )
      src = src.replaceAll("@/registry/examples/", "@/components/")
      src = src.replaceAll("@/registry/blocks/", "@/components/evilcharts/blocks/")
      src = src.replaceAll("export default", "export")

      return `\`\`\`tsx
${src}
\`\`\``
    } catch (error) {
      console.error(`Error processing ComponentPreview ${name}:`, error)
      return _match
    }
  })
}

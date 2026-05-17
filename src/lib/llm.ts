import fs from "fs"
import path from "path"
import { Index } from "@/registry/__index__"
import { source } from "@/lib/source"

const showcaseItems = [
  {
    name: "Area Chart",
    description: "Highlight trends with filled area ranges.",
    url: "/docs/area-chart",
  },
  {
    name: "Line Chart",
    description: "Track change over time with lines.",
    url: "/docs/line-chart",
  },
  {
    name: "Bar Chart",
    description: "Compare categories quickly with bold bars.",
    url: "/docs/bar-chart",
  },
  {
    name: "Composed Chart",
    description: "Mix lines, bars, areas in one.",
    url: "/docs/composed-chart",
  },
  {
    name: "Radar Chart",
    description: "Compare multi-metric profiles on radial axes.",
    url: "/docs/radar-chart",
  },
  {
    name: "Pie Chart",
    description: "Show parts of a whole, clearly.",
    url: "/docs/pie-chart",
  },
  {
    name: "Radial Chart",
    description: "Visualize totals in a circular layout.",
    url: "/docs/radial-chart",
  },
  {
    name: "Sankey Chart",
    description: "Show flows between stages with weighted links.",
    url: "/docs/sankey-chart",
  },
]

const packageInstallCommands = {
  npm: "npm install",
  yarn: "yarn add",
  bun: "bun add",
  pnpm: "pnpm add",
}

const shadcnCliCommands = {
  npm: "npx shadcn@latest add",
  yarn: "yarn shadcn@latest add",
  bun: "bunx --bun shadcn@latest add",
  pnpm: "pnpm dlx shadcn@latest add",
}

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

function parseCommands(commands: string) {
  return [...commands.matchAll(/["']([^"']+)["']/g)].map((match) => match[1])
}

function getAttribute(tag: string, name: string) {
  return tag.match(new RegExp(`${name}="([^"]+)"`))?.[1]
}

function renderPackageCommands(
  commands: string,
  commandMap: Record<string, string>,
) {
  const packages = parseCommands(commands).join(" ")

  return Object.entries(commandMap)
    .map(([manager, command]) => `### ${manager}\n\n\`\`\`bash\n${command} ${packages}\n\`\`\``)
    .join("\n\n")
}

function stripMdxComponentTags(content: string) {
  return content
    .replace(/<CodeTabs(?:\s[^>]*)?>/g, "")
    .replace(/<\/CodeTabs>/g, "")
    .replace(/<TabsList(?:\s[^>]*)?>[\s\S]*?<\/TabsList>/g, "")
    .replace(/<TabsPanel(?:\s[^>]*)?>/g, "")
    .replace(/<\/TabsPanel>/g, "")
    .replace(/<Alert(?:\s[^>]*)?>/g, "> ")
    .replace(/<\/Alert>/g, "")
    .replace(/<AlertContent(?:\s[^>]*)?>/g, "")
    .replace(/<\/AlertContent>/g, "")
    .replace(/<Steps[^>]*>/g, "")
    .replace(/<\/Steps>/g, "")
    .replace(/<Step(?:\s[^>]*)?>/g, "")
    .replace(/<\/Step>/g, "")
    .replace(/<StepContent(?:\s[^>]*)?>/g, "")
    .replace(/<\/StepContent>/g, "")
    .replace(/<StepTitle(?:\s[^>]*)?>([\s\S]*?)<\/StepTitle>/g, "### $1")
    .replace(/<StepDescription(?:\s[^>]*)?>([\s\S]*?)<\/StepDescription>/g, "$1")
    .replace(/<ApiTable[^>]*>/g, "")
    .replace(/<\/ApiTable>/g, "")
    .replace(
      /<ApiRow\s+([\s\S]*?)>([\s\S]*?)<\/ApiRow>/g,
      (_match, attrs: string, description: string) => {
        const name = attrs.match(/name="([^"]*)"/)?.[1] ?? "";
        const typeMatch = attrs.match(/type=(?:"([^"]*)"|'([^']*)')/);
        const type = typeMatch ? (typeMatch[1] ?? typeMatch[2] ?? "") : "";
        const defaultMatch = attrs.match(/default=(?:"([^"]*)"|'([^']*)')/);
        const defaultValue = defaultMatch ? (defaultMatch[1] ?? defaultMatch[2] ?? "") : "";
        const required = /(?:^|\s)required(?:\s|$)/.test(attrs);
        const meta = [type && `type: \`${type}\``, defaultValue && `default: \`${defaultValue}\``]
          .filter(Boolean)
          .join(" · ");
        return `### \`${name}\`${required ? " (required)" : ""}\n\n${meta}\n\n${description.trim()}`;
      },
    )
    .replace(/<Link\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/Link>/g, "[$2]($1)")
    .replace(/<ShowcaseGrid\s*\/>/g, getShowcaseList())
}

function getShowcaseList() {
  return showcaseItems
    .map((item) => `- [${item.name}](${item.url}) - ${item.description}`)
    .join("\n")
}

function renderRegistrySource(name: string, title?: string) {
  const component = Index[name]
  if (!component?.files?.length) {
    return undefined
  }

  const filePath = component.files[0]?.path
  if (!filePath) {
    return undefined
  }

  const absolutePath = resolveAliasPath(filePath)

  if (!fs.existsSync(absolutePath)) {
    return undefined
  }

  let src = fs.readFileSync(absolutePath, "utf8")

  // Rewrite internal registry paths to user-facing paths.
  src = src.replaceAll("@/registry/ui/", "@/components/evilcharts/ui/")
  src = src.replaceAll(
    "@/registry/charts/",
    "@/components/evilcharts/charts/",
  )
  src = src.replaceAll("@/registry/examples/", "@/components/")
  src = src.replaceAll("@/registry/blocks/", "@/components/evilcharts/blocks/")
  src = src.replaceAll("export default", "export")

  const heading = title ? `### ${title}\n\n` : ""

  return `${heading}\`\`\`tsx
${src}
\`\`\``
}

export function processMdxForLLMs(content: string) {
  content = stripMdxComponentTags(content)

  // Replace <ComponentsList /> with a markdown list of components.
  const componentsListRegex = /<ComponentsList\s*\/>/g
  content = content.replace(componentsListRegex, getComponentsList())

  content = content.replace(
    /<CommandBlock\s+commands=\{\[([\s\S]*?)\]\}\s*\/>/g,
    (_match, commands) => renderPackageCommands(commands, packageInstallCommands),
  )

  content = content.replace(
    /<CliBlock\s+commands=\{\[([\s\S]*?)\]\}\s*\/>/g,
    (_match, commands) => renderPackageCommands(commands, shadcnCliCommands),
  )

  content = content.replace(
    /<ComponentSource[\s\S]*?\/>/g,
    (match) => {
      const name = getAttribute(match, "name")
      const title = getAttribute(match, "title")

      return name ? renderRegistrySource(name, title) ?? match : match
    },
  )

  // Replace <ComponentPreview ... name="xxx" ... /> with actual source code.
  return content.replace(/<ComponentPreview[\s\S]*?\/>/g, (match) => {
    const name = getAttribute(match, "name")
    const title = getAttribute(match, "title")

    if (!name) {
      return match
    }

    try {
      return renderRegistrySource(name, title) ?? match
    } catch (error) {
      console.error(`Error processing ComponentPreview ${name}:`, error)
      return match
    }
  })
}

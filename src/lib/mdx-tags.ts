// A quoted attribute may contain JSX itself, such as title="<Chart.Brush />".
// Only an unquoted /> closes the component tag.
export function mdxComponentPattern(name: "ComponentSource" | "ComponentPreview") {
  return new RegExp(`<${name}\\b(?:[^"'<>]|"[^"]*"|'[^']*')*\\/>`, "g");
}

export function getMdxAttribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`));
  return match?.[1] ?? match?.[2];
}

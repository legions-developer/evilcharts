export interface SnippetProps {
  code: string;
  language: "bash";
}

export interface PackageManagerSnippets {
  npm: SnippetProps;
  yarn: SnippetProps;
  pnpm: SnippetProps;
  bun: SnippetProps;
}

export type PreparedSnippet = SnippetProps & {
  html: string;
};

export type PreparedSnippets = {
  [K in keyof PackageManagerSnippets]: PreparedSnippet;
};

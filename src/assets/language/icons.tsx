import { BashIcon, CssFile01Icon, Folder01Icon, ThirdBracketIcon, Typescript02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function getIconForLanguageExtension(language: string) {
  switch (language) {
    case "json":
      return <HugeiconsIcon icon={ThirdBracketIcon} strokeWidth={2} />;
    case "css":
      return <HugeiconsIcon icon={CssFile01Icon} strokeWidth={2} />;
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
    case "typescript":
      return <HugeiconsIcon icon={Typescript02Icon} strokeWidth={2} />;
    case "bash":
      return <HugeiconsIcon icon={BashIcon} strokeWidth={2} />;
    default:
      return <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} />;
  }
}

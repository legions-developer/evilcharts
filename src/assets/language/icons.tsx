import {
  BashIcon,
  CssFile01Icon,
  Folder01Icon,
  ThirdBracketIcon,
  ThreeDViewIcon,
  Typescript02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function getIconForLanguageExtension(language: string) {
  switch (language) {
    case "json":
      return <HugeiconsIcon icon={ThirdBracketIcon} />;
    case "css":
      return <HugeiconsIcon icon={CssFile01Icon} />;
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
    case "typescript":
      return <HugeiconsIcon icon={Typescript02Icon} />;
    case "bash":
      return <HugeiconsIcon icon={BashIcon} />;
    case "component":
      return <HugeiconsIcon icon={ThreeDViewIcon} />;
    default:
      return <HugeiconsIcon icon={Folder01Icon} />;
  }
}

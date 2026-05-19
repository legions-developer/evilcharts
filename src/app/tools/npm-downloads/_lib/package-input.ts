// Client-side validation for the package input — accepts a plain package name
// ("react", "@scope/pkg") or an npmjs.com URL. Reuses the server-side parser
// so the in-app rules and the API rules can never drift apart.

import { z } from "zod";

import { parsePackage } from "@/lib/npm-downloads/parse-package";

/** Validates a package input and normalizes it to a canonical package name. */
export const packageInputSchema = z
  .string()
  .trim()
  .min(1, "Enter a package")
  .transform((value, ctx) => {
    try {
      return parsePackage(value).name;
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Enter an npm package — a package name or an npmjs.com URL",
      });
      return z.NEVER;
    }
  });

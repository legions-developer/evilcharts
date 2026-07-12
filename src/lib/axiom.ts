import { Axiom } from "@axiomhq/js";

export const axiom = process.env.AXIOM_TOKEN
  ? new Axiom({ token: process.env.AXIOM_TOKEN })
  : null;

export const AXIOM_DATASET = process.env.AXIOM_DATASET ?? "";

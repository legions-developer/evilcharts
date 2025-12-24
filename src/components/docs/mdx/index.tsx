// Some of mdx components are taken from @shadcn official repo

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ComponentPreviewAndCode, ComponentPreview, ComponentCode } from "../charts/component-preview";
import { Code, Figcaption, Figure, Pre } from "./components/code";
import { H1, H2, H3, H4, H5, H6 } from "./components/headings";
import { Description, P, Strong } from "./components/text";
import { Table, Tr, Th, Td } from "./components/table";
import { LinkedCard } from "./components/linked-card";
import { Blockquote } from "./components/blockquote";
import { CliBlock } from "./components/cli-block";
import { Img, MDXImage } from "./components/image";
import { Step, Steps } from "./components/steps";
import { Ul, Ol, Li } from "./components/lists";
import { A, MDXLink } from "./components/link";
import type { MDXComponents } from "mdx/types"; 
import { Kbd } from "./components/kbd";
import { Hr } from "./components/hr";

export const mdxComponents: MDXComponents = {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  a: A,
  p: P,
  strong: Strong,
  ul: Ul,
  ol: Ol,
  li: Li,
  blockquote: Blockquote,
  img: Img,
  hr: Hr,
  table: Table,
  tr: Tr,
  th: Th,
  td: Td,
  pre: Pre,
  code: Code,
  figure: Figure,
  figcaption: Figcaption,
  Step,
  Steps,
  Image: MDXImage,
  Link: MDXLink,
  LinkedCard,
  Kbd,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  CliBlock,
  ComponentPreviewAndCode,
  ComponentPreview,
  ComponentCode,
  Description,
};

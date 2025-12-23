// Some of mdx components are taken from @shadcn official repo

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MDXTabs, MDXTabsList, MDXTabsTrigger, MDXTabsContent, MDXTab } from "./tabs";
import { Code, Pre, Figure, Figcaption } from "./code";
import { H1, H2, H3, H4, H5, H6 } from "./headings";
import { Table, Tr, Th, Td } from "./table";
import { LinkedCard } from "./linked-card";
import { Blockquote } from "./blockquote";
import { Img, MDXImage } from "./image";
import { Step, Steps } from "./steps";
import { Ul, Ol, Li } from "./lists";
import { A, MDXLink } from "./link";
import { P, Strong } from "./text";
import { Kbd } from "./kbd";
import { Hr } from "./hr";

export const mdxComponents = {
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
  figure: Figure,
  figcaption: Figcaption,
  code: Code,
  Step,
  Steps,
  Image: MDXImage,
  Tabs: MDXTabs,
  TabsList: MDXTabsList,
  TabsTrigger: MDXTabsTrigger,
  TabsContent: MDXTabsContent,
  Tab: MDXTab,
  Link: MDXLink,
  LinkedCard,
  Kbd,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
};

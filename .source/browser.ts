// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"area-charts/curved-area.mdx": () => import("../src/content/docs/area-charts/curved-area.mdx?collection=docs"), "area-charts/dotted-area.mdx": () => import("../src/content/docs/area-charts/dotted-area.mdx?collection=docs"), "area-charts/gradient-area.mdx": () => import("../src/content/docs/area-charts/gradient-area.mdx?collection=docs"), "area-charts/stacked-area.mdx": () => import("../src/content/docs/area-charts/stacked-area.mdx?collection=docs"), "line-charts/curved-line.mdx": () => import("../src/content/docs/line-charts/curved-line.mdx?collection=docs"), "line-charts/multi-line.mdx": () => import("../src/content/docs/line-charts/multi-line.mdx?collection=docs"), "line-charts/simple-line.mdx": () => import("../src/content/docs/line-charts/simple-line.mdx?collection=docs"), }),
};
export default browserCollections;
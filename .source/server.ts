// @ts-nocheck
import * as __fd_glob_6 from "../src/content/docs/line-charts/simple-line.mdx?collection=docs"
import * as __fd_glob_5 from "../src/content/docs/line-charts/multi-line.mdx?collection=docs"
import * as __fd_glob_4 from "../src/content/docs/line-charts/curved-line.mdx?collection=docs"
import * as __fd_glob_3 from "../src/content/docs/area-charts/stacked-area.mdx?collection=docs"
import * as __fd_glob_2 from "../src/content/docs/area-charts/gradient-area.mdx?collection=docs"
import * as __fd_glob_1 from "../src/content/docs/area-charts/dotted-area.mdx?collection=docs"
import * as __fd_glob_0 from "../src/content/docs/area-charts/curved-area.mdx?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "src/content/docs", {}, {"area-charts/curved-area.mdx": __fd_glob_0, "area-charts/dotted-area.mdx": __fd_glob_1, "area-charts/gradient-area.mdx": __fd_glob_2, "area-charts/stacked-area.mdx": __fd_glob_3, "line-charts/curved-line.mdx": __fd_glob_4, "line-charts/multi-line.mdx": __fd_glob_5, "line-charts/simple-line.mdx": __fd_glob_6, });
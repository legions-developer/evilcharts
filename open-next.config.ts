import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
  // Serve stale entries before Next.js so the queue owns background regeneration.
  enableCacheInterception: true,
});

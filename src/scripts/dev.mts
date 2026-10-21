import { spawn, type ChildProcess } from "node:child_process";
import { watch } from "node:fs";

let next: ChildProcess | undefined;
let generator: ChildProcess | undefined;
let debounce: ReturnType<typeof setTimeout> | undefined;
let rebuilding: Promise<number> | undefined;
let pending = false;
let stopping = false;

function buildContent() {
  return new Promise<number>((resolve) => {
    generator = spawn(process.execPath, ["run", "src/scripts/build-content.mts"], {
      stdio: "inherit",
    });
    generator.once("error", (error) => {
      console.error("Unable to generate documentation content:", error);
      resolve(1);
    });
    generator.once("exit", (code) => {
      generator = undefined;
      resolve(code ?? 1);
    });
  });
}

async function rebuildContent() {
  pending = true;
  if (rebuilding || stopping) return;

  // Each rebuild uses a fresh process so changes to imported registry manifests
  // are picked up too. Serialize builds and coalesce edits made during a build.
  while (pending && !stopping) {
    pending = false;
    rebuilding = buildContent();
    const code = await rebuilding;
    rebuilding = undefined;
    if (code !== 0 && !stopping) {
      console.error("Content generation failed. Fix the source file to retry on the next edit.");
    }
  }
}

const watcher = watch("src", { recursive: true }, (_event, fileName) => {
  if (!fileName || stopping) return;
  const filePath = fileName.toString().replaceAll("\\", "/");
  if (filePath.startsWith("generated/")) return;

  clearTimeout(debounce);
  debounce = setTimeout(() => void rebuildContent(), 100);
});

function stop(signal: NodeJS.Signals = "SIGTERM") {
  if (stopping) return;
  stopping = true;
  clearTimeout(debounce);
  watcher.close();
  generator?.kill(signal);
  next?.kill(signal);
}

process.once("SIGINT", () => stop("SIGINT"));
process.once("SIGTERM", () => stop("SIGTERM"));
watcher.once("error", (error) => {
  console.error("Unable to watch documentation sources:", error);
  process.exitCode = 1;
  stop();
});

rebuilding = buildContent();
const initialCode = await rebuilding;
rebuilding = undefined;

if (initialCode !== 0) {
  process.exitCode = initialCode;
  stop();
} else if (!stopping) {
  next = spawn(process.execPath, ["run", "next", "dev", ...process.argv.slice(2)], {
    stdio: "inherit",
  });
  next.once("error", (error) => {
    console.error("Unable to start Next.js:", error);
    process.exitCode = 1;
    stop();
  });
  next.once("exit", (code) => {
    process.exitCode = code ?? (stopping ? 0 : 1);
    stop();
  });
  if (pending) void rebuildContent();
}

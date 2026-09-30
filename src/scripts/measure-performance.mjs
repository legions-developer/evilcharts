import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import os from "node:os";

// Lighthouse is an external audit tool, deliberately not a project dependency.
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const separator = arg.indexOf("=");
    if (!arg.startsWith("--") || separator < 0) throw new Error("Use --option=value arguments.");
    return [arg.slice(2, separator), arg.slice(separator + 1)];
  }),
);
const origin = new URL(args.url ?? "https://evilcharts.com").origin;
const label = args.label ?? "vercel";
const repetitions = Number(args.runs ?? 3);
if (!Number.isInteger(repetitions) || repetitions < 1) throw new Error("--runs must be positive.");
const renderOnly = args["render-only"] === "true";
if (!renderOnly && !args.lighthouse)
  throw new Error("Pass --lighthouse=/path/to/lighthouse/cli/index.js.");
const node = args.node ?? process.execPath;
const output = path.resolve(
  args.output ?? `docs/performance/${new Date().toISOString().slice(0, 10)}-${label}-baseline`,
);
const artifacts = path.resolve(args.artifacts ?? `${output}-reports`);
const pages = [
  { id: "home", path: "/", title: "Homepage" },
  { id: "docs", path: "/docs", title: "Docs introduction" },
  { id: "recharts-bar", path: "/docs/recharts/bar-chart/static", title: "Recharts bar chart" },
  { id: "echarts-bar", path: "/docs/echarts/bar-chart/static", title: "ECharts bar chart" },
];
const previous = args.compare ? JSON.parse(await readFile(args.compare, "utf8")) : null;
const metrics = {
  score: "Performance score",
  fcpMs: "First contentful paint (ms)",
  lcpMs: "Largest contentful paint (ms)",
  tbtMs: "Total blocking time (ms)",
  cls: "Cumulative layout shift",
  speedIndexMs: "Speed Index (ms)",
  transferBytes: "Transferred bytes",
  javascriptBytes: "JavaScript transferred bytes",
  requests: "Network requests",
  mainThreadMs: "Main-thread work (ms)",
  javascriptMs: "JavaScript execution (ms)",
  unusedJavascriptBytes: "Estimated unused JavaScript bytes",
};
const median = (values) => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );

async function command(executable, commandArgs, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, commandArgs, { ...options, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0
        ? resolve(stdout)
        : reject(new Error(`${executable} exited ${code}: ${stderr.slice(-2000)}`)),
    );
  });
}

await mkdir(path.dirname(output), { recursive: true });
await mkdir(artifacts, { recursive: true });
const baseline = renderOnly
  ? JSON.parse(await readFile(`${output}.json`, "utf8"))
  : {
      schemaVersion: 1,
      label,
      origin,
      startedAt: new Date().toISOString(),
      methodology: {
        repetitions,
        aggregation: `Median of each metric across ${repetitions} runs; ranges retained. Runs are sequential, each in a fresh Chrome profile with an empty browser cache. CDN cache is not purged.`,
        profiles:
          "Lighthouse default simulated mobile and desktop presets; exact settings saved per run.",
        http: "Five fresh curl processes per endpoint, compressed HTTP responses; connection/TLS setup included. These timings are not browser lab timings.",
        fieldData:
          "No CrUX field data or real-user INP was collected. Total blocking time is a lab metric, not INP.",
        timezone: "Asia/Calcutta",
      },
      environment: {
        platform: os.platform(),
        architecture: os.arch(),
        cpu: os.cpus()[0]?.model,
        logicalCpus: os.cpus().length,
        memoryGiB: Math.round(os.totalmem() / 1024 ** 3),
        auditNodeVersion: (await command(node, ["--version"])).trim(),
        lighthouseVersion: (await command(node, [args.lighthouse, "--version"])).trim(),
        chromePath: args.chrome ?? "auto-discovered by Lighthouse",
      },
      pages,
      runs: [],
      http: [],
      summary: [],
    };
if (!baseline.environment.chromeVersion && args.chrome) {
  baseline.environment.chromeVersion = (await command(args.chrome, ["--version"])).trim();
}

async function save() {
  baseline.summary = pages.flatMap((page) =>
    ["mobile", "desktop"].flatMap((profile) => {
      const runs = baseline.runs.filter((run) => run.page === page.id && run.profile === profile);
      if (!runs.length) return [];
      const values = Object.fromEntries(
        Object.keys(metrics).map((key) => [key, median(runs.map((run) => run.metrics[key]))]),
      );
      const ranges = Object.fromEntries(
        Object.keys(metrics).map((key) => {
          const samples = runs.map((run) => run.metrics[key]).filter(Number.isFinite);
          return [key, samples.length ? [Math.min(...samples), Math.max(...samples)] : null];
        }),
      );
      const before = previous?.summary.find(
        (item) => item.page === page.id && item.profile === profile,
      );
      return [
        {
          page: page.id,
          title: page.title,
          profile,
          samples: runs.length,
          median: values,
          range: ranges,
          ...(before
            ? {
                before: before.median,
                delta: Object.fromEntries(
                  Object.keys(metrics).map((key) => [
                    key,
                    Number.isFinite(values[key]) && Number.isFinite(before.median[key])
                      ? values[key] - before.median[key]
                      : null,
                  ]),
                ),
              }
            : {}),
        },
      ];
    }),
  );
  await writeFile(`${output}.json`, JSON.stringify(baseline, null, 2) + "\n");
  const format = (value, divisor = 1, decimals = 0) =>
    Number.isFinite(value) ? (value / divisor).toFixed(decimals) : "—";
  const rows = baseline.summary
    .map(
      (item) =>
        `<tr><td>${escape(item.title)}</td><td>${item.profile}</td><td>${format(item.median.score)}</td><td>${format(item.median.fcpMs, 1000, 2)}</td><td>${format(item.median.lcpMs, 1000, 2)}</td><td>${format(item.median.tbtMs)}</td><td>${format(item.median.cls, 1, 3)}</td><td>${format(item.median.transferBytes, 1024)}</td><td>${format(item.median.javascriptBytes, 1024)}</td></tr>`,
    )
    .join("");
  const comparisons = baseline.summary
    .filter((item) => item.delta)
    .map(
      (item) =>
        `<tr><td>${escape(item.title)} · ${item.profile}</td><td>${format(item.before.score)} → ${format(item.median.score)}</td><td>${format(item.before.lcpMs, 1000, 2)} → ${format(item.median.lcpMs, 1000, 2)}</td><td>${format(item.before.tbtMs)} → ${format(item.median.tbtMs)}</td></tr>`,
    )
    .join("");
  const httpRows = baseline.http
    .map(
      (item) =>
        `<tr><td>${escape(item.name)}</td><td>${item.method}</td><td>${item.samples[0]?.status ?? "—"}</td><td>${format(item.median.ttfbMs)}</td><td>${format(item.median.totalMs)}</td><td>${escape(item.samples.map((sample) => sample.headers["x-vercel-cache"] ?? sample.headers["cf-cache-status"] ?? "none reported").join(", "))}</td></tr>`,
    )
    .join("");
  const insights = baseline.summary
    .map((item) => {
      const runs = baseline.runs.filter(
        (run) => run.page === item.page && run.profile === item.profile,
      );
      const representative = [...runs].sort(
        (a, b) =>
          Math.abs(a.metrics.score - item.median.score) -
          Math.abs(b.metrics.score - item.median.score),
      )[0];
      return `<details><summary>${escape(item.title)} · ${item.profile}: ${format(item.median.score)} (${format(item.range.score[0])}–${format(item.range.score[1])})</summary><ul>${representative.findings.map((finding) => `<li>${escape(finding.title)}${finding.display ? ` — ${escape(finding.display)}` : ""}</li>`).join("")}</ul></details>`;
    })
    .join("");
  const repeatCommand = [
    `npm install --prefix /tmp/evilcharts-performance-tools --no-audit --no-fund --save-exact lighthouse@${baseline.environment.lighthouseVersion}`,
    "",
    [
      `"${node}" src/scripts/measure-performance.mjs`,
      `--url=${baseline.origin}`,
      "--label=cloudflare",
      `--runs=${baseline.methodology.repetitions}`,
      "--lighthouse=/tmp/evilcharts-performance-tools/node_modules/lighthouse/cli/index.js",
      `--chrome="${baseline.environment.chromePath}"`,
      "--output=docs/performance/YYYY-MM-DD-cloudflare",
      "--artifacts=/tmp/evilcharts-cloudflare-performance",
      `--compare=${path.relative(process.cwd(), output)}.json`,
    ].join(" \\\n  "),
  ].join("\n");
  await writeFile(
    `${output}.html`,
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EvilCharts ${escape(label)} performance baseline</title><style>body{font:15px/1.6 system-ui,sans-serif;color:#202124;background:#fafafa;margin:40px auto;padding:0 24px;max-width:1200px}h1{font-size:30px}table{border-collapse:collapse;width:100%;margin:20px 0;background:white}th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #ddd}th{background:#eee}p{max-width:1000px}code{background:#eee;padding:2px 5px}.scroll{overflow:auto}details{padding:10px 0;border-bottom:1px solid #ddd}small{color:#555}</style><h1>EvilCharts · ${escape(label)} baseline</h1><p>${escape(origin)} · ${new Date(baseline.startedAt).toLocaleString("en-IN", { timeZone: "Asia/Calcutta" })} IST · Lighthouse ${escape(baseline.environment.lighthouseVersion)}</p><p>Median of ${repetitions} sequential audits per page and device. Fresh browser profile for every audit; the CDN cache is not purged. Mobile and desktop use Lighthouse’s standard simulated throttling. Full per-run settings, values, ranges, and content fingerprints are in the adjacent JSON file.</p><div class="scroll"><table><thead><tr><th>Page</th><th>Profile</th><th>Score / 100</th><th>FCP (s)</th><th>LCP (s)</th><th>TBT (ms)</th><th>CLS</th><th>Total KiB</th><th>JS KiB</th></tr></thead><tbody>${rows}</tbody></table></div>${comparisons ? `<h2>Before / after</h2><p>Compared with ${escape(previous.label)}. Match the tool, browser, hardware, settings and content before attributing a change to hosting.</p><table><tr><th>Page</th><th>Score</th><th>LCP (s)</th><th>TBT (ms)</th></tr>${comparisons}</table>` : ""}<h2>Delivery timings</h2><p>Median of five fresh curl processes. DNS, connection and TLS overhead are included in TTFB; this is a different measurement from the simulated browser audit. Cache status and response headers are retained per sample.</p><div class="scroll"><table><tr><th>Endpoint</th><th>Method</th><th>Status</th><th>TTFB (ms)</th><th>Total (ms)</th><th>Cache headers by sample</th></tr>${httpRows}</table></div><h2>Audit findings</h2>${insights}<h2>Comparison conditions</h2><p>Lab measurements, not real-user Core Web Vitals. INP is not measured. LCP and TBT can vary with hardware, CPU load, route content and network conditions. A hosting change primarily affects delivery; chart JavaScript and rendering costs require application changes.</p><p>Repeat with <code>src/scripts/measure-performance.mjs</code> and <code>--compare=${escape(path.relative(process.cwd(), output))}.json</code>, using the same Lighthouse and Chrome versions. Compare medians and the saved ranges, not a single run.</p><h2>Repeat after migration</h2><p>Run from the repository root on the same machine. Replace YYYY-MM-DD with the capture date. Use the recorded Chrome version (${escape(baseline.environment.chromeVersion ?? "see per-run user agent")}) and Node version. The tool stays outside project dependencies. Keep full audit reports outside the repository.</p><pre class="scroll">${escape(repeatCommand)}</pre><p><a href="https://developer.chrome.com/docs/lighthouse/performance/performance-scoring">Lighthouse scoring and variability</a> · <a href="https://web.dev/articles/vitals">Web Vitals definitions</a></p><small>${escape(baseline.environment.cpu)} · ${baseline.environment.platform}/${baseline.environment.architecture} · ${baseline.environment.logicalCpus} logical CPUs · ${baseline.environment.memoryGiB} GiB memory · audit Node ${escape(baseline.environment.auditNodeVersion)}</small></html>`,
  );
}

if (renderOnly) {
  await save();
  console.log(`Rendered ${output}.html from the saved measurements.`);
  process.exit(0);
}

for (let round = 1; round <= repetitions; round++) {
  for (const page of pages) {
    for (const profile of ["mobile", "desktop"]) {
      const prefix = path.join(artifacts, `${page.id}-${profile}-${round}`);
      // Completed matching reports can be resumed after an interrupted capture.
      let report;
      try {
        report = JSON.parse(await readFile(`${prefix}.report.json`, "utf8"));
      } catch {
        /* capture below */
      }
      if (!report) {
        const commandArgs = [
          args.lighthouse,
          new URL(page.path, origin).href,
          "--only-categories=performance",
          "--output=json",
          "--output=html",
          `--output-path=${prefix}`,
          "--chrome-flags=--headless=new --no-first-run --disable-extensions",
          "--quiet",
        ];
        if (profile === "desktop") commandArgs.push("--preset=desktop");
        await command(node, commandArgs, {
          env: { ...process.env, ...(args.chrome ? { CHROME_PATH: args.chrome } : {}) },
        });
        report = JSON.parse(await readFile(`${prefix}.report.json`, "utf8"));
      }
      if (
        report.runtimeError ||
        report.requestedUrl !== new URL(page.path, origin).href ||
        report.configSettings.formFactor !== profile ||
        report.lighthouseVersion !== baseline.environment.lighthouseVersion ||
        !Number.isFinite(report.categories.performance.score)
      ) {
        throw new Error(
          `Invalid or mismatched report for ${page.id}/${profile}/${round}: ${JSON.stringify(report.runtimeError)}`,
        );
      }
      const auditValue = (key) => report.audits[key]?.numericValue ?? null;
      if (report.fetchTime < baseline.startedAt) baseline.startedAt = report.fetchTime;
      const requests = report.audits["network-requests"]?.details?.items ?? [];
      baseline.runs.push({
        page: page.id,
        profile,
        round,
        fetchTime: report.fetchTime,
        requestedUrl: report.requestedUrl,
        finalUrl: report.finalDisplayedUrl ?? report.finalUrl,
        lighthouseVersion: report.lighthouseVersion,
        hostUserAgent: report.environment?.hostUserAgent,
        benchmarkIndex: report.environment?.benchmarkIndex,
        configSettings: report.configSettings,
        warnings: report.runWarnings,
        metrics: {
          score: report.categories.performance.score * 100,
          fcpMs: auditValue("first-contentful-paint"),
          lcpMs: auditValue("largest-contentful-paint"),
          tbtMs: auditValue("total-blocking-time"),
          cls: auditValue("cumulative-layout-shift"),
          speedIndexMs: auditValue("speed-index"),
          transferBytes: auditValue("total-byte-weight"),
          javascriptBytes: requests
            .filter((request) => request.resourceType === "Script")
            .reduce((sum, request) => sum + (request.transferSize ?? 0), 0),
          requests: requests.length,
          mainThreadMs: auditValue("mainthread-work-breakdown"),
          javascriptMs: auditValue("bootup-time"),
          unusedJavascriptBytes:
            report.audits["unused-javascript"]?.details?.overallSavingsBytes ?? 0,
        },
        findings: Object.values(report.audits)
          .filter(
            (audit) =>
              audit.score !== null &&
              audit.score < 1 &&
              !["informative", "notApplicable", "manual"].includes(audit.scoreDisplayMode),
          )
          .map((audit) => ({
            id: audit.id,
            title: audit.title,
            display: audit.displayValue ?? null,
            value: audit.numericValue ?? null,
          })),
      });
      await save();
      const latest = baseline.runs.at(-1);
      console.log(
        `${baseline.runs.length}/${pages.length * 2 * repetitions} ${page.id} ${profile} run ${round}: score ${latest.metrics.score}, LCP ${(latest.metrics.lcpMs / 1000).toFixed(2)}s, TBT ${latest.metrics.tbtMs}ms`,
      );
    }
  }
}

const endpoints = [
  ...pages.map((page) => ({ name: page.title, path: page.path })),
  { name: "Docs markdown", path: "/docs/recharts/bar-chart/static.md" },
  {
    name: "Negotiated docs markdown",
    path: "/docs/recharts/bar-chart/static",
    accept: "text/markdown",
  },
  { name: "Documentation index", path: "/llms.txt" },
  { name: "Registry download", path: "/r/recharts-bar-chart.json" },
  {
    name: "MCP initialize",
    path: "/mcp",
    body: {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "evilcharts-performance-baseline", version: "1.0" },
      },
    },
  },
];
for (const endpoint of endpoints) {
  const samples = [];
  for (let sample = 1; sample <= 5; sample++) {
    const prefix = path.join(artifacts, `http-${baseline.http.length}-${sample}`);
    const commandArgs = [
      "--silent",
      "--show-error",
      "--compressed",
      "--max-time",
      "30",
      "--dump-header",
      `${prefix}.headers`,
      "--output",
      `${prefix}.body`,
      "--write-out",
      "%{json}",
      "--user-agent",
      "EvilCharts performance baseline",
    ];
    if (endpoint.accept) commandArgs.push("--header", `Accept: ${endpoint.accept}`);
    if (endpoint.body)
      commandArgs.push(
        "--header",
        "Content-Type: application/json",
        "--data",
        JSON.stringify(endpoint.body),
      );
    commandArgs.push(new URL(endpoint.path, origin).href);
    const timing = JSON.parse(await command("curl", commandArgs));
    const headers = Object.fromEntries(
      (await readFile(`${prefix}.headers`, "utf8")).split(/\r?\n/).flatMap((line) => {
        const separator = line.indexOf(":");
        const name = line.slice(0, separator).toLowerCase();
        return separator > 0 &&
          [
            "server",
            "cache-control",
            "vary",
            "age",
            "etag",
            "content-type",
            "content-encoding",
            "x-vercel-cache",
            "x-vercel-id",
            "x-nextjs-prerender",
            "cf-cache-status",
            "cf-ray",
          ].includes(name)
          ? [[name, line.slice(separator + 1).trim()]]
          : [];
      }),
    );
    const body = await readFile(`${prefix}.body`);
    samples.push({
      timestamp: new Date().toISOString(),
      status: timing.http_code,
      ttfbMs: timing.time_starttransfer * 1000,
      totalMs: timing.time_total * 1000,
      dnsMs: timing.time_namelookup * 1000,
      tlsReadyMs: timing.time_appconnect * 1000,
      transferredBytes: timing.size_download,
      decodedBytes: body.length,
      bodySha256: createHash("sha256").update(body).digest("hex"),
      headers,
    });
  }
  baseline.http.push({
    name: endpoint.name,
    path: endpoint.path,
    method: endpoint.body ? "POST" : "GET",
    ...(endpoint.accept ? { accept: endpoint.accept } : {}),
    samples,
    median: {
      ttfbMs: median(samples.map((sample) => sample.ttfbMs)),
      totalMs: median(samples.map((sample) => sample.totalMs)),
      transferredBytes: median(samples.map((sample) => sample.transferredBytes)),
    },
  });
  await save();
  console.log(
    `HTTP ${endpoint.name}: ${samples[0].status}, median TTFB ${baseline.http.at(-1).median.ttfbMs.toFixed(0)}ms`,
  );
}
baseline.completedAt = new Date().toISOString();
await save();
console.log(`Saved ${output}.json and ${output}.html`);

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checks = [];

function record(name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), detail });
}

function text(path) {
  return readFileSync(join(root, path), "utf8");
}

function hash(path) {
  return createHash("sha256").update(readFileSync(join(root, path))).digest("hex").toUpperCase();
}

function walk(path, results = []) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if ([".git", ".playwright-cli", "node_modules", "dist", "output", "data"].includes(entry.name)) continue;
    const absolute = join(path, entry.name);
    if (entry.isDirectory()) walk(absolute, results);
    else results.push(absolute);
  }
  return results;
}

const required = [
  "README.md",
  "vercel.json",
  "api/index.js",
  "apps/web/src/App.jsx",
  "apps/api/src/app.js",
  "apps/api/src/postgres-repository.js",
  "apps/api/src/postgres-migrations.js",
  "apps/api/src/whatsapp-channel.js",
  "apps/api/src/whatsapp-meta-adapter.js",
  "DELIVERY/WHATSAPP_FIXTURE_VERIFICATION.md",
  "apps/web/public/assets/challan-nyay-road-hero-v2.webp",
  "apps/web/public/assets/synthetic-enforcement-frame-preview.webp",
  "apps/web/dist/client/index.html",
];
for (const path of required) record(`required:${path}`, existsSync(join(root, path)), "release input exists");

const readme = text("README.md");
const app = text("apps/web/src/App.jsx");
const architecture = text("ARCHITECTURE/SYSTEM_ARCHITECTURE.md");
record("public deployment URL is explicit", readme.includes("https://challan-nyay.vercel.app/"), "README identifies the active public release");
record("independent prototype disclosure is visible", app.includes("synthetic data only | not a government website"), "citizen shell contains the disclosure");
record("real-payment boundary is visible", app.includes("No real payment will occur."), "payment dialog states its mock boundary");
record("architecture names the implemented web stack", architecture.includes("React 19 + Vite 6") && !architecture.includes("Next.js App Router"), "architecture matches the source tree");
record("managed database boundary is explicit", readme.includes("public Vercel build selects the managed PostgreSQL adapter"), "README distinguishes local SQLite from deployed PostgreSQL");
record(
  "WhatsApp proof keeps the live-delivery boundary explicit",
  readme.includes("Live developer pilot + automated contract proof")
    && readme.includes("production WhatsApp number, native WhatsApp payment and unrestricted recipients are not claimed"),
  "developer-pilot delivery is distinguished from a production public channel",
);

const assetBudgets = [
  ["apps/web/public/assets/challan-nyay-road-hero-v2.webp", 150_000],
  ["apps/web/public/assets/synthetic-enforcement-frame-preview.webp", 250_000],
];
const assetHashes = {};
for (const [path, budget] of assetBudgets) {
  const bytes = statSync(join(root, path)).size;
  assetHashes[path] = { bytes, sha256: hash(path) };
  record(`asset budget:${path}`, bytes <= budget, `${bytes} bytes <= ${budget}`);
}

const publicAssets = walk(join(root, "apps/web/public/assets"));
const officialAssetNames = publicAssets
  .map((path) => relative(root, path))
  .filter((path) => /(?:emblem|ashoka|digital[-_ ]?india|morth|government[-_ ]?logo)/i.test(path));
record("no official-looking asset filenames", officialAssetNames.length === 0, officialAssetNames.join(", ") || "none found");

const sourceFiles = walk(root).filter((path) => /\.(?:js|jsx|mjs|json|md|css|html|yml|yaml|toml)$/i.test(path));
const secretPatterns = [
  /\bsk-proj-[A-Za-z0-9_-]{20,}\b/,
  /\bghp_[A-Za-z0-9]{30,}\b/,
  /\bEAA[A-Za-z0-9]{40,}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];
const secretHits = [];
for (const path of sourceFiles) {
  const contents = readFileSync(path, "utf8");
  if (secretPatterns.some((pattern) => pattern.test(contents))) secretHits.push(relative(root, path));
}
record("no common live-secret signatures", secretHits.length === 0, secretHits.join(", ") || "none found");

const passed = checks.every((check) => check.passed);
const report = {
  generatedAt: new Date().toISOString(),
  scope: "local release audit; not deployed verification",
  passed,
  checks,
  assetHashes,
};
const reportPath = join(root, "output/release-evidence/phase8-release-audit.json");
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

for (const check of checks) {
  console.log(`${check.passed ? "PASS" : "FAIL"} ${check.name} — ${check.detail}`);
}
console.log(`\nRelease audit report: ${reportPath}`);
if (!passed) process.exitCode = 1;

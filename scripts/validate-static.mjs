import { readFile, readdir, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const problems = [];
const required = [
  "index.html", "manifest.webmanifest", "service-worker.js",
  "src/app/bootstrap.js", "src/app/app.js", "src/app/router.js", "src/app/state.js",
  "src/components/shell.js", "src/styles/tokens.css", "src/styles/base.css",
  "src/styles/layout.css", "src/styles/components.css", "src/styles/utilities.css",
  "src/database/schema.js", "src/database/connection.js", "src/security/crypto.js",
  "src/services/backup-service.js", "src/services/restore-service.js",
  "src/services/entity-service.js", "src/services/onboarding-service.js",
  "src/services/transaction-service.js", "src/services/receipt-service.js", "src/engines/posting-engine.js",
];

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.filter((entry) => ![".git", "node_modules"].includes(entry.name)).map(async (entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  }));
  return nested.flat();
}

for (const path of required) {
  try { if ((await stat(resolve(root, path))).size === 0) problems.push(`${path} is empty`); }
  catch { problems.push(`${path} is missing`); }
}

const html = await readFile(resolve(root, "index.html"), "utf8");
if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) problems.push("Inline executable JavaScript is prohibited");
for (const id of ["app-header", "primary-navigation", "main-content", "status-region", "live-region"]) if (!html.includes(`id="${id}"`)) problems.push(`Missing shell element #${id}`);

const manifest = JSON.parse(await readFile(resolve(root, "manifest.webmanifest"), "utf8"));
for (const key of ["name", "short_name", "description", "start_url", "scope", "display", "icons"]) if (!manifest[key]) problems.push(`Manifest key ${key} is missing`);
for (const icon of manifest.icons ?? []) {
  try { await stat(resolve(root, icon.src.replace(/^\.\//, ""))); }
  catch { problems.push(`Manifest icon ${icon.src} is missing`); }
}

const files = await filesUnder(root);
const textExtensions = new Set([".css", ".html", ".js", ".json", ".md", ".mjs", ".py", ".svg", ".webmanifest", ""]);
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/,
  /\bAIza[0-9A-Za-z_-]{35}\b/,
];

for (const file of files.filter((path) => textExtensions.has(extname(path)))) {
  const text = await readFile(file, "utf8");
  for (const pattern of secretPatterns) if (pattern.test(text)) problems.push(`Potential committed secret in ${file.slice(root.length + 1)}`);
  if (file.endsWith(".md")) {
    for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].split("#")[0];
      if (!target || /^[a-z]+:/i.test(target)) continue;
      try { await stat(resolve(file, "..", target)); }
      catch { problems.push(`Broken local link ${match[1]} in ${file.slice(root.length + 1)}`); }
    }
  }
}

const schema = await import(pathToFileURL(resolve(root, "src/database/schema.js")));
if (schema.STORE_NAMES.length !== 29 || new Set(schema.STORE_NAMES).size !== 29 || !schema.STORE_NAMES.includes("openingPositions") || !schema.STORE_NAMES.includes("transactionEffects") || !schema.STORE_NAMES.includes("transactionVersions")) problems.push("Milestone 4 requires 29 unique stores including opening positions, effects, and versions");

if (problems.length) {
  console.error(problems.map((problem) => `- ${problem}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Static validation passed (${files.length} files inspected).`);
}

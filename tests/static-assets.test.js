import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

test("manifest is valid and uses honest shell routes", async () => {
  const manifest = JSON.parse(await readFile(resolve(root, "manifest.webmanifest"), "utf8"));
  assert.equal(manifest.short_name, "FinOrbit");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./#/transactions");
  assert.equal(manifest.scope, "./");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable"));
  for (const icon of manifest.icons) assert.ok((await stat(resolve(root, icon.src.replace(/^\.\//, "")))).size > 0);
  assert.ok(manifest.shortcuts.every((shortcut) => ["./#/transactions", "./#/accounts"].includes(shortcut.url)));
});

test("service worker shell asset list references existing files", async () => {
  const source = await readFile(resolve(root, "service-worker.js"), "utf8");
  const block = source.match(/const SHELL_ASSETS = \[([\s\S]*?)\];/)?.[1];
  assert.ok(block, "SHELL_ASSETS must be statically declared");
  const assets = [...block.matchAll(/"(\.\/[^\"]+)"/g)].map((match) => match[1]);
  assert.ok(assets.includes("./index.html"));
  assert.ok(assets.includes("./manifest.webmanifest"));
  for (const asset of assets.filter((value) => value !== "./")) await stat(resolve(root, asset.replace(/^\.\//, "")));
});

test("application shell includes required landmarks and no inline executable script", async () => {
  const html = await readFile(resolve(root, "index.html"), "utf8");
  for (const fragment of ["<header", "<nav", "<main", "aria-live=", "Skip to main content", "manifest.webmanifest"]) assert.ok(html.includes(fragment));
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i);
  assert.match(html, /Content-Security-Policy/);
});

test("security flow is local-only and backup files are not cached", async () => {
  const worker = await readFile(resolve(root, "service-worker.js"), "utf8");
  const bootstrap = await readFile(resolve(root, "src/app/bootstrap.js"), "utf8");
  assert.doesNotMatch(worker, /backup.*\.json/i);
  assert.match(bootstrap, /createUnlockDialog/);
  assert.doesNotMatch(bootstrap, /fetch\(|XMLHttpRequest|WebSocket/);
});

test("wealth route exposes transparent local valuation and recalculation controls", async () => {
  const center = await readFile(resolve(root, "src/modules/wealth/wealth-center.js"), "utf8");
  const bootstrap = await readFile(resolve(root, "src/app/bootstrap.js"), "utf8");
  for (const label of ["Wealth change explanation", "Record a valuation", "Recalculate history", "Saved snapshots"]) assert.ok(center.includes(label));
  assert.match(bootstrap, /createWealthCenter/);
  assert.doesNotMatch(center, /fetch\(|XMLHttpRequest|WebSocket/);
});

test("wealth controls retain accessible names and non-color stale status", async () => {
  const center = await readFile(resolve(root, "src/modules/wealth/wealth-center.js"), "utf8");
  for (const label of ["Asset", "Value in rupees", "Valuation date", "From", "Through"]) assert.ok(center.includes(`field(\"${label}\"`));
  assert.match(center, /stale; recalculate/);
  assert.match(center, /setAttribute\(\"role\", \"alert\"\)/);
});

test("transaction UI retains mobile input and bounded-rendering safeguards", async () => {
  const center = await readFile(resolve(root, "src/modules/transactions/transaction-center.js"), "utf8");
  const service = await readFile(resolve(root, "src/services/transaction-service.js"), "utf8");
  const styles = await readFile(resolve(root, "src/styles/components.css"), "utf8");
  assert.match(center, /inputMode = "decimal"/); assert.match(center, /aria-busy/);
  assert.match(service, /filters\.limit/); assert.match(service, /: 200/);
  assert.match(styles, /min-width: 0/);
});

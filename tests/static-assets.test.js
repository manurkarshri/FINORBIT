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

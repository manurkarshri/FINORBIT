import { cp, mkdir, readFile, rm, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, ".."); const output = resolve(root, "dist");
const worker = await readFile(resolve(root, "service-worker.js"), "utf8");
const block = worker.match(/const SHELL_ASSETS = \[([\s\S]*?)\];/)?.[1];
if (!block) throw new Error("Could not read the service-worker shell allowlist.");
const files = new Set(["index.html", "manifest.webmanifest", "service-worker.js", ...[...block.matchAll(/"\.\/([^"]+)"/g)].map((match) => match[1]).filter(Boolean)]);
await rm(output, { recursive: true, force: true });
for (const relative of files) { const source = resolve(root, relative); const target = resolve(output, relative); const info = await stat(source); if (!info.isFile()) throw new Error(`Release asset is not a file: ${relative}`); await mkdir(dirname(target), { recursive: true }); await cp(source, target); }
console.log(`Built release artifact with ${files.size} files in dist/.`);

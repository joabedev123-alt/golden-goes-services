import { cpSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const distDir = resolve(root, "dist");

if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
}

mkdirSync(distDir, { recursive: true });

const entries = ["index.html", "css", "js", "assets"];

for (const entry of entries) {
  const src = resolve(root, entry);
  if (existsSync(src)) {
    cpSync(src, resolve(distDir, entry), { recursive: true });
  }
}

console.log("Static build completed in dist/.");

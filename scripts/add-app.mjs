#!/usr/bin/env node
// Usage: npm run add-app -- <github-url> [--name "Pretty Name"] [--slug my-app] [--port 4002]
//        [--desc "..."] [--tags TypeScript,React] [--type node|static] [--status live|beta|planned]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const file = join(dirname(fileURLToPath(import.meta.url)), "..", "apps.json");
const args = process.argv.slice(2);
const repo = args.find((a) => !a.startsWith("--"));
const opt = (k) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : undefined;
};
if (!repo || !/^https:\/\/github\.com\/[^/]+\/[^/]+/.test(repo)) {
  console.error("Usage: npm run add-app -- https://github.com/<user>/<repo> [--name ..] [--slug ..] [--port ..]");
  process.exit(1);
}
const cfg = JSON.parse(readFileSync(file, "utf8"));
const repoName = repo.replace(/\.git$/, "").split("/").pop();
const slug = (opt("slug") ?? repoName).toLowerCase().replace(/[^a-z0-9-]+/g, "-");
if (cfg.apps.some((a) => a.slug === slug)) {
  console.error(`App "${slug}" already exists in apps.json`);
  process.exit(1);
}
const type = opt("type") ?? "node";
const used = new Set(cfg.apps.map((a) => a.port).filter(Boolean));
let port = Number(opt("port")) || 4001;
while (!opt("port") && used.has(port)) port++;

const app = {
  slug,
  name: opt("name") ?? repoName.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  description: opt("desc") ?? "A project by Das.",
  repo: repo.replace(/\.git$/, ""),
  tags: (opt("tags") ?? "TypeScript").split(",").map((s) => s.trim()),
  type,
  ...(type === "node" ? { port, start: "npm run start" } : { dist: "dist" }),
  build: "npm ci && npm run build",
  status: opt("status") ?? "live",
};
cfg.apps = cfg.apps.filter((a) => a.slug !== "example-app").concat(app);
writeFileSync(file, JSON.stringify(cfg, null, 2) + "\n");
console.log(`Added "${app.name}" -> ${cfg.site.routing === "path" ? `/apps/${slug}/` : `${slug}.${cfg.site.domain}`}${type === "node" ? ` (port ${port})` : ""}`);
console.log("Next: adjust apps.json (start/build commands), then run `npm run gen` and deploy.");

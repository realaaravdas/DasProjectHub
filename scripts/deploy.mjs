#!/usr/bin/env node
// Run ON THE SERVER: builds the hub, clones/updates every app, regenerates configs, reloads pm2 + Caddy.
// Usage: node scripts/deploy.mjs [slug]   (omit slug to deploy everything)
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { site, apps } = JSON.parse(readFileSync(join(root, "apps.json"), "utf8"));
const only = process.argv[2];
const run = (cmd, cwd = root) => (console.log(`\n$ ${cmd}`), execSync(cmd, { cwd, stdio: "inherit" }));

mkdirSync(site.appsRoot, { recursive: true });
if (!only || only === "hub") {
  run("npm ci && npm run build");
  if (root !== site.hubRoot) run(`mkdir -p ${site.hubRoot} && rm -rf ${site.hubRoot}/dist && cp -r dist ${site.hubRoot}/dist`);
}
run("node scripts/generate.mjs");

for (const a of apps) {
  if (a.status === "planned" || (only && only !== a.slug)) continue;
  const dir = join(site.appsRoot, a.slug);
  try {
    if (existsSync(join(dir, ".git"))) run("git pull --ff-only", dir);
    else run(`git clone ${a.repo}.git ${dir}`);
    if (a.build) run(a.build, dir);
  } catch (e) {
    console.error(`!! ${a.slug} failed, continuing: ${e.message}`);
  }
}
run("pm2 startOrReload deploy/ecosystem.config.cjs --update-env && pm2 save");
run("sudo cp deploy/Caddyfile /etc/caddy/Caddyfile && sudo systemctl reload caddy");
console.log("\nDeployed.");

# Das — Project Hub

A modern landing page + app router for all my personal projects, designed to run on a single Ubuntu server.

- **Hub**: Vite + React + TypeScript + Framer Motion (interactive canvas background, cursor effects, tilt cards, scroll animations).
- **Apps**: each GitHub project runs as its own process (pm2) on `127.0.0.1:<port>`; **Caddy** routes to it and handles HTTPS automatically.
- **One source of truth**: `apps.json`. The site cards, Caddy config and pm2 config are all generated from it.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
```

## Add an app

```bash
npm run add-app -- https://github.com/<you>/<repo> --name "My App" --desc "What it does" --tags TypeScript,React
# then tweak start/build commands in apps.json if needed
git commit -am "Add my-app" && git push
```

On the server: `node scripts/deploy.mjs` (all) or `node scripts/deploy.mjs my-app` (one). That clones/pulls the repo, builds it, regenerates `deploy/Caddyfile` + `deploy/ecosystem.config.cjs`, and reloads pm2 and Caddy.

App `type`: `node` (runs `start` on `$PORT`, bound to `$HOST`) or `static` (Caddy serves `dist`). `status`: `live` | `beta` | `planned` (planned cards link to the repo).

## Server setup (once)

```bash
bash scripts/setup-server.sh        # Node 22, pm2, Caddy, firewall, /srv dirs
git clone <this repo> /srv/hub && cd /srv/hub
# edit apps.json -> site.domain, then:
node scripts/deploy.mjs
```

Point DNS at the server: `A example.com` and, for subdomain routing, a wildcard `A *.example.com`.

## Routing: subdomains vs. sub-paths

`site.routing` in `apps.json`:

| Mode | URL | Notes |
|---|---|---|
| `subdomain` (default, recommended) | `my-app.example.com` | Works with any app unchanged. Needs wildcard DNS. |
| `path` | `example.com/apps/my-app/` | Single domain, but each app must be built for a base path (Vite `base`, Next.js `basePath`, router basename, API URLs) or its assets/links break. |

## Security notes

- App ports stay on localhost; only 22/80/443 are open (`ufw`).
- Apps share the server: run each as an unprivileged user (or Docker) if any app handles sensitive data. A crash in one app doesn't affect others (separate pm2 processes, memory-capped at 512 MB).

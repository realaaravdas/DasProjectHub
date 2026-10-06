#!/usr/bin/env bash
# One-time setup for a fresh Ubuntu 22.04/24.04 server. Run as a sudo-capable user.
set -euo pipefail

sudo apt-get update
sudo apt-get install -y curl git debian-keyring debian-archive-keyring apt-transport-https ufw

# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Caddy (automatic HTTPS)
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update && sudo apt-get install -y caddy

# Directories
sudo mkdir -p /srv/hub /srv/apps
sudo chown -R "$USER":"$USER" /srv/hub /srv/apps

# Firewall: only SSH + web. App ports (4001+) stay bound to localhost.
sudo ufw allow OpenSSH && sudo ufw allow 80,443/tcp && sudo ufw --force enable

# Start pm2 on boot
pm2 startup systemd -u "$USER" --hp "$HOME" | tail -n1 | bash || true

echo "Done. Next: clone this repo to /srv/hub, edit apps.json (domain!), then: node scripts/deploy.mjs"

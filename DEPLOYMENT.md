# Waste2Goods — Deployment Guide (cheapest path)

> **Follow top to bottom, step 1 → step 12. No branches.**
> **Stack:** 1× DigitalOcean Droplet (Docker Compose) + Cloudflare free proxy.
> **Cost:** ~$12/mo droplet + $0 Cloudflare + $0 Caddy.

---

## What's in this repo for deployment

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-target build: `api` (Node/Express) and `web` (Caddy + the 3 SPAs) |
| `.dockerignore` | Keeps build context small; excludes secrets and the Flutter app |
| `Caddyfile` | TLS, static hosting for the SPAs, reverse proxy to the API |
| `docker-compose.yml` | `web` → `api` → `db` (MySQL 8) + `redis` |
| `.env.docker.example` | Template for every runtime variable — copy to `.env` |
| `packages/backend/.env.example` | Full backend variable reference |

### Production fixes applied to the app

| Fix | File | Why |
|---|---|---|
| `TRUST_PROXY` is configurable (default 1) | `index-mysql.js` | Was hardcoded to `2` in prod. Wrong hop count makes rate limiting key on the proxy IP instead of the client. |
| `GET /health` + `GET /health/ready` | `index-mysql.js` | Liveness/readiness probes for Docker, Caddy and uptime monitors. |
| Demo-account seeding gated | `db-mysql.js` | Was re-creating admin A-001 + resident Maria Santos **and resetting their password hashes on every boot**. Now off when `NODE_ENV=production` unless `SEED_DEMO_DATA=true`. |
| `DB_RUN_MIGRATIONS` switch | `db-mysql.js` | Lets you freeze the schema and drop DDL privileges after the first boot. |
| No hardcoded kiosk PIN | `db-mysql.js` | Was `'7890'`. Now empty in production, which disables kiosk-login until you set one. |
| Fail-fast on DB loss in prod | `db-mysql.js` | Previously logged the error and served traffic against a dead database. |
| MySQL TLS with optional CA | `db-mysql.js` | `rejectUnauthorized:true` with no CA fails against DO Managed MySQL. Now supports `DB_SSL_CA` and `DB_SSL_REJECT_UNAUTHORIZED`. |

### Architecture

```
                    Internet
                       │  :80 / :443
                 ┌─────▼─────┐
                 │   Caddy   │  automatic HTTPS (Let's Encrypt)
                 │   (web)   │
                 └──┬─────┬──┘
     /  → mobile PWA│     │/api/*  /security-dashboard  /cdn/*  /health
   /admin/* → admin │     │
   /kiosk/* → kiosk │     │
                    │  ┌──▼──────┐
                    │  │  api    │  Node 22 · Express
                    │  └──┬───┬──┘
                    │     │   │
              ┌─────▼──┐ ┌▼────────┐
              │db MySQL│ │  redis  │
              └────────┘ └─────────┘
```

**Why one domain:** the SPAs and the API share an origin, so there is no CORS
surface at all. `CORS_ORIGINS` can stay empty.

---

## Prerequisites

- A DigitalOcean account
- A domain (or subdomain) you can add an **A record** to
- SSH key added to DigitalOcean *(recommended — password auth is disabled by default)*
- The repo pushed to GitHub (`https://github.com/RyotaIwa/Waste2Goods.git`)

---

## Step 1 — Create the Droplet

**Create → Droplets**

| Setting | Recommended |
|---|---|
| Region | Closest to Davao City (e.g. **Singapore / SGP1**) |
| Image | **Ubuntu 24.04 LTS** |
| Size | Basic, Regular, **2 GB / 1 vCPU** (~$12/mo) — the floor. Skip 1 GB (OOMs). |
| CPU options | Regular SSD |
| Authentication | **SSH Key** |
| Hostname | `waste2goods-prod` |

> ⚠️ MySQL 8 + Node + Redis + Caddy on 1 GB will OOM. **2 GB is the floor**, and
> Step 3 adds swap as a safety net.

Note the droplet's **public IP**.

---

## Step 2 — Add the domain to Cloudflare

> Cloudflare owns DNS from here on — do not also create records at your
> registrar or in DO Networking.

1. Cloudflare dashboard → **Add domain** → enter `example.com` → plan **Free**.
2. Cloudflare shows 2 nameservers. At your registrar, replace the current
   nameservers with those 2. Wait for the domain to show **Active**
   (5–30 min typical).
3. DNS → Records → **Add record**: Type `A`, Name `@` (or `waste2goods` for a
   subdomain), IPv4 = `<droplet-ip>`, Proxy = **Proxied (orange cloud ON)**.
   Add `www` the same way if you use it.

Verify before continuing:

```bash
dig +short waste2goods.example.com
# should print your droplet IP
```

---

## Step 3 — Bootstrap the server

SSH in as root (`ssh root@<droplet-ip>`) and run:

```bash
# 1. Non-root user
adduser --gecos "" deploy
usermod -aG sudo deploy

# 2. Copy your SSH key across so you can log in as deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# 3. Updates
apt update && apt upgrade -y

# 4. Docker + Compose plugin
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy

# 5. Swap — important on a 2 GB droplet
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# 6. Firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

Then reconnect as the app user:

```bash
exit
ssh deploy@<droplet-ip>
docker run --rm hello-world    # confirms docker works without sudo
```

---

## Step 4 — Deploy the application

```bash
cd ~
git clone https://github.com/RyotaIwa/Waste2Goods.git waste2goods
cd waste2goods

# Create the runtime environment file
cp .env.docker.example .env
nano .env
```

### Fill in `.env` — generate real secrets first

```bash
echo "DB_PASSWORD:            $(openssl rand -base64 24)"
echo "MYSQL_ROOT_PASSWORD:    $(openssl rand -base64 24)"
echo "JWT_SECRET:             $(openssl rand -hex 48)"
echo "JWT_REFRESH_SECRET:     $(openssl rand -hex 48)"
```

Copy those into `.env`, set `DOMAIN=waste2goods.example.com`, and pick a
non-trivial `KIOSK_PIN`.

**Required values:**

| Variable | Notes |
|---|---|
| `DOMAIN` | Your real domain, exactly as in DNS |
| `DB_PASSWORD` | From `openssl rand -base64 24` |
| `MYSQL_ROOT_PASSWORD` | Different from `DB_PASSWORD` |
| `JWT_SECRET` | **Must differ from your local `.env`** |
| `JWT_REFRESH_SECRET` | Different again |
| `KIOSK_PIN` | Non-trivial. Empty disables kiosk login. |

**Keep these exact values — this is the Cloudflare path (CF + Caddy = 2 hops):**

```ini
DOMAIN=waste2goods.example.com
SEED_DEMO_DATA=false   # never recreate the demo admin + resident in production
TRUST_PROXY=2          # Cloudflare (1) + Caddy (1). With 1, every visitor shares one rate-limit bucket.
CORS_ORIGINS=          # same origin (Caddy serves SPA + API) → leave empty
CSRF_ORIGINS=          # same origin → leave empty
```

### Build and start

```bash
docker compose up -d --build
```

First build takes **5–10 minutes** (npm install + three Vite builds).

### Confirm the schema was imported

MySQL initialises `schema-mysql.sql` **only on the very first boot** (empty data
volume). Confirm:

```bash
docker compose exec db mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SHOW TABLES;" waste2goods
```

You should see `users`, `administrators`, `rewards`, `recycling_transactions`, …

> ⚠️ **The app does not create tables.** `applySchemaMigrations()` only `ALTER`s
> existing columns. If this step is skipped the API starts but every query fails.
> To re-import from scratch: `docker compose down -v` (⚠️ destroys all data) then
> `docker compose up -d --build`.

---

## Step 5 — Verify the stack

```bash
# All four containers should be running / healthy
docker compose ps

# API errors
docker compose logs --tail=50 api

# Caddy got its Let's Encrypt cert (if this fails, see Step 9 first)
docker compose logs web | grep -i certificate

# Liveness (fast, no DB dependency)
curl -s https://waste2goods.example.com/health
# {"status":"ok","service":"waste2goods-api","env":"production",...}

# Readiness (pings MySQL)
curl -s https://waste2goods.example.com/health/ready
# {"status":"ready","checks":{"database":"ok","redis":"redis"},...}
```

First build takes **5–10 minutes** (npm install + three Vite builds). If the
cert isn't issued yet, continue to Step 6 anyway — Cloudflare's edge cert
covers browsers while Caddy retries in the background (check
`docker compose logs web` after 5 min).

Then open in a browser:

| URL | What you should see |
|---|---|
| `https://waste2goods.example.com/` | Resident PWA (valid certificate, no warning) |
| `https://waste2goods.example.com/admin/` | Admin panel |
| `https://waste2goods.example.com/kiosk/` | Kiosk terminal |
| `https://waste2goods.example.com/security-dashboard` | DevSecOps dashboard |

## Step 6 — Cloudflare SSL mode → Full (strict)

SSL/TLS → Overview → Encryption mode → **Full (strict)**. Caddy serves a real
Let's Encrypt cert, so strict validates the CF→origin leg.

**Never use `Flexible`** — it downgrades CF→origin to plain HTTP, exposing
logins/JWTs between Cloudflare and your droplet.

## Step 7 — Cloudflare cache rule: never cache the API

Caching → Cache Rules → Create rule `bypass-api`: if URI Path starts with
`/api/` OR `/health` OR `/cdn/` OR `/security-dashboard` → **Bypass cache**.
Caddy already sends correct `Cache-Control`; this survives dashboard mistakes.
Wrong here = stale logins, cached `POST /api/transactions` 200s.

## Step 8 — Cloudflare hardening (all free)

1. Security → **WAF managed ruleset** → ON.
2. Security → Bots → **Block definitely-automated** — then test the kiosk
   flow: the ESP32 posts with no browser UA and must NOT be blocked; if it
   trips, add a skip for `/api/vision/*`.
3. Rate limiting rule (second layer behind the app limiter): URI Path starts
   with `/api/auth/` AND > 20 req / 10 s → Block 60 s.
4. SSL/TLS → Edge Certificates → **Always Use HTTPS** ON, **HTTPS Rewrites**
   ON, minimum TLS **1.2**.

## Step 9 — Create your real admin (demo seeding is off)

Temporarily set `SEED_DEMO_DATA=true` and a strong `ADMIN_PASSWORD` in `.env`, then:

```bash
docker compose up -d api
```

Log in as that admin, **change the password in the UI**, then set
`SEED_DEMO_DATA=false` and redeploy (`docker compose up -d api`). This is the
one-time bootstrap because the seeder is what creates the first account.

## Step 10 — Freeze the schema

After the first successful boot:

```ini
DB_RUN_MIGRATIONS=false
```

```bash
docker compose up -d api
```

Then drop DDL privileges from the app user:

```sql
REVOKE ALL PRIVILEGES ON waste2goods.* FROM 'w2g'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON waste2goods.* TO 'w2g'@'%';
FLUSH PRIVILEGES;
```

## Step 11 — Final end-to-end check

```bash
# Edge is Cloudflare (cf-ray header present)
curl -sI https://waste2goods.example.com/ | grep -i -E "cf-ray|server:"
# API through the edge
curl -s https://waste2goods.example.com/health
curl -s https://waste2goods.example.com/health/ready
# Same-origin mutation works with empty CORS/CSRF
curl -s -X POST https://waste2goods.example.com/api/auth/kiosk-login \
  -H 'Content-Type: application/json' -d '{"pin":"<YOUR_KIOSK_PIN>"}'
```

Browser: open `https://waste2goods.example.com/`, `/admin/`, `/kiosk/` — valid
cert, no CORS errors in DevTools (same origin → zero preflights expected).

## Step 12 — Backups on (don't skip)

```bash
mkdir -p ~/backups
cat > ~/backup-w2g.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cd "$HOME/waste2goods"
set -a; source .env; set +a
STAMP=$(date +%F_%H%M)
docker compose exec -T db \
  mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction "$DB_NAME" \
  | gzip > "$HOME/backups/w2g_$STAMP.sql.gz"
# keep the last 14
ls -1t "$HOME/backups"/w2g_*.sql.gz | tail -n +15 | xargs -r rm --
EOF
chmod +x ~/backup-w2g.sh

# nightly at 02:30
( crontab -l 2>/dev/null; echo "30 2 * * * $HOME/backup-w2g.sh >> $HOME/backup.log 2>&1" ) | crontab -
```

Done. Future deploys are just:

```bash
cd ~/waste2goods
git pull
docker compose up -d --build
docker image prune -f
```

---

## Appendix A — Operations reference (not part of the 12 steps)

### Logs

```bash
docker compose logs -f                  # everything
docker compose logs -f api              # API only
docker compose logs --tail=200 web      # Caddy / TLS
```

### Update to a new version

```bash
cd ~/waste2goods
git pull
docker compose up -d --build
docker image prune -f
```

Downtime is a few seconds while the `api` container is replaced.

### Rollback

```bash
git log --oneline -10
git checkout <previous-commit>
docker compose up -d --build
```

### Restore

```bash
gunzip < ~/backups/w2g_2026-10-01_0230.sql.gz \
  | docker compose exec -T db mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME"
```

> Skip DO droplet backups (+20% cost) — the cron mysqldump above is enough for
> the cheapest path.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `web` container restart-loops, no cert | DNS not pointing at the droplet, or port 80 blocked | `dig +short $DOMAIN`, `ufw status`, check DO Cloud Firewall |
| API exits immediately with `JWT_SECRET environment variable is required in production` | `JWT_SECRET` unset | Set it in `.env` (this guard is intentional) |
| API exits with `database is unreachable` | DB not ready or wrong credentials | `docker compose ps`; wait for `db` to report `healthy` |
| `/health/ready` returns **503** | MySQL unreachable | `docker compose logs db`; verify `DB_PASSWORD` matches `MYSQL_PASSWORD` |
| Login works but you're logged out after every deploy | Redis not reachable → in-memory fallback | `docker compose logs redis`; confirm `REDIS_ENABLED=true`, `REDIS_HOST=redis` |
| `Table 'waste2goods.users' doesn't exist` | Schema never imported (data volume pre-existed) | `docker compose down -v && docker compose up -d --build` ⚠️ destroys data |
| Admin password keeps reverting | `SEED_DEMO_DATA=true` resetting the hash | Set it to `false` and redeploy |
| Everyone shares one rate limit | `TRUST_PROXY` wrong | Set `TRUST_PROXY=2` (Cloudflare + Caddy). |
| `502 Bad Gateway` | `api` container down | `docker compose logs api` |
| Build fails at `npm ci` | `package-lock.json` out of sync with a `package.json` | Run `npm install` locally, commit the updated lockfile, push |
| Ports 80/443 already in use | Apache/Nginx from XAMPP or a previous install | `sudo ss -tulpn \| grep -E ':(80|443)'` and stop the offender |

---

## Appendix B — App Platform (NOT the cheapest path, skip for now)

`app.yaml` exists in the repo if you ever want managed hosting, but it costs
~$40–42/mo (API $10–12 + MySQL $15 + Valkey $15) vs ~$12/mo for this guide.
It also forces managed databases (no volumes) and a manual one-time schema
import. Only switch if you want `git push` deploys and zero server
maintenance. Details kept in git history.

---

## Appendix C — Cloudflare Pages split (NOT the cheapest path, skip for now)

Splitting the 3 SPAs onto Cloudflare Pages + API-only droplet adds a second
origin (CORS + CSRF lists to keep in sync) and the kiosk SPA then needs
internet per deposit. Zero cost saving over Steps 1–12. Details kept in git
history.

## Security checklist (do it before going public)

- [x] `.env` gitignored — **verified**: only `.env.example` is tracked
- [ ] `JWT_SECRET` / `JWT_REFRESH_SECRET` rotated and unique to production
- [ ] `SEED_DEMO_DATA=false`
- [ ] `KIOSK_PIN` set to something non-trivial (or intentionally empty)
- [ ] `ADMIN_PASSWORD` / `RESIDENT_PASSWORD` rotated or blank
- [ ] `DB_RUN_MIGRATIONS=false` + DDL privileges revoked
- [ ] `TRUST_PROXY` matches the real hop count
- [ ] Firewall allows only 22 / 80 / 443
- [ ] Login rate limiting verified: `for i in $(seq 1 20); do curl -s -o /dev/null -w "%{http_code} " -X POST https://$DOMAIN/api/auth/login -H 'Content-Type: application/json' -d '{"email":"a@b.c","password":"x"}'; done`
      → later requests must return **429**
- [ ] Automatic backups scheduled (Step: Operations)
- [ ] OAuth callback URLs point at the production domain

---

## Notes on the ESP32-CAM / vision service (not yet implemented)

The repository currently contains **no** vision code. When you add it:

- Put the YOLO ONNX model at `packages/backend/models/` and uncomment the
  `COPY packages/backend/models` line in the `Dockerfile`. The image will grow by
  ~11 MB plus `onnxruntime-node` native binaries (~100 MB).
- **Architectural decision to make first:** if the ESP32-CAM uploads to this
  DigitalOcean endpoint, the kiosk needs working internet for *every* bottle drop
  and can no longer award points offline. Consider running the API (or at least
  the inference path) on the kiosk mini-PC and syncing to the cloud, rather than
  putting the kiosk's critical path in the cloud.


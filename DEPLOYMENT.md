# Waste2Goods — DigitalOcean Deployment Guide

> **Target:** a single DigitalOcean Droplet running the whole stack in Docker Compose,
> with Caddy handling TLS automatically.
> **Cost:** ~$12–24/month (see [Sizing](#step-1--create-the-droplet)).

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
| Size | Basic, Regular, **2 GB / 1 vCPU** minimum. **4 GB** if you also run the vision service. |
| CPU options | Regular SSD |
| Authentication | **SSH Key** |
| Hostname | `waste2goods-prod` |

> ⚠️ MySQL 8 + Node + Redis + Caddy on 1 GB will OOM. **2 GB is the floor**, and
> Step 3 adds swap as a safety net.

Note the droplet's **public IP**.

---

## Step 2 — Point your domain at it

In your DNS provider (or DigitalOcean Networking → Domains):

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `waste2goods` (or `@`) | `<droplet-ip>` | 3600 |

Verify before continuing — Caddy's certificate issuance fails without it:

```bash
dig +short waste2goods.example.com
# should print your droplet IP
```

> For local testing you can skip DNS and leave `DOMAIN=localhost`
> (Caddy issues a self-signed cert; browsers will warn).

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

**Keep these as-is for a public deployment:**

```ini
SEED_DEMO_DATA=false   # never recreate the demo admin + resident in production
TRUST_PROXY=1          # Caddy is the only proxy hop
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

## Step 5 — Verify

```bash
# All four containers should be running / healthy
docker compose ps

# API errors
docker compose logs --tail=50 api

# Liveness (fast, no DB dependency)
curl -s https://waste2goods.example.com/health
# {"status":"ok","service":"waste2goods-api","env":"production",...}

# Readiness (pings MySQL)
curl -s https://waste2goods.example.com/health/ready
# {"status":"ready","checks":{"database":"ok","redis":"redis"},...}
```

Then open in a browser:

| URL | What you should see |
|---|---|
| `https://waste2goods.example.com/` | Resident PWA (valid certificate, no warning) |
| `https://waste2goods.example.com/admin/` | Admin panel |
| `https://waste2goods.example.com/kiosk/` | Kiosk terminal |
| `https://waste2goods.example.com/security-dashboard` | DevSecOps dashboard |

### Check the certificate

```bash
curl -sI https://waste2goods.example.com | head -5
docker compose logs web | grep -i certificate
```

If Caddy can't get a cert it is almost always: DNS not propagated, port 80
blocked, or `DOMAIN` not matching. Re-run `dig +short $DOMAIN`.

---

## Step 6 — Post-deploy hardening

### 6.1 Create your real admin (demo seeding is off)

Temporarily set `SEED_DEMO_DATA=true` and a strong `ADMIN_PASSWORD` in `.env`, then:

```bash
docker compose up -d api
```

Log in as that admin, **change the password in the UI**, then set
`SEED_DEMO_DATA=false` and redeploy. This is the one-time bootstrap because the
seeder is what creates the first account.

### 6.2 Freeze the schema

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

### 6.3 Rotate any secret that has been in a local `.env`

`JWT_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_SECRET`.
Rotating `JWT_SECRET` invalidates all existing sessions — that is intended.

### 6.4 OAuth callback URLs (only if using Google/GitHub login)

```ini
GOOGLE_CALLBACK_URL=https://waste2goods.example.com/api/auth/google/callback
GITHUB_CALLBACK_URL=https://waste2goods.example.com/api/auth/github/callback
```

Register those exact URLs in the Google Cloud Console and the GitHub OAuth app.

---

## Operations

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

### Database backup (run on a cron)

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

**Also enable DigitalOcean droplet backups** (Droplets → your droplet → Backups,
+20% cost) — that covers the whole volume, not just MySQL.

### Restore

```bash
gunzip < ~/backups/w2g_2026-10-01_0230.sql.gz \
  | docker compose exec -T db mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$DB_NAME"
```

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
| Everyone shares one rate limit | `TRUST_PROXY` wrong | Set `TRUST_PROXY=1` (Caddy only). Only 2 if you add another LB. |
| `502 Bad Gateway` | `api` container down | `docker compose logs api` |
| Build fails at `npm ci` | `package-lock.json` out of sync with a `package.json` | Run `npm install` locally, commit the updated lockfile, push |
| Ports 80/443 already in use | Apache/Nginx from XAMPP or a previous install | `sudo ss -tulpn \| grep -E ':(80|443)'` and stop the offender |

---

## DigitalOcean App Platform (alternative to the Droplet)

**Yes, this works — and `app.yaml` is already written for it.** The app code is
unchanged; only the packaging and edge layer differ. Run:

```bash
doctl apps create --spec app.yaml
# then watch it
doctl apps list
doctl apps logs <app-id> api --type run
```

### What carries over vs what changes

| Component | Droplet + Compose | App Platform |
|---|---|---|
| API | `api` image from `Dockerfile` | Same `Dockerfile` (last stage = `api`) |
| Frontends | Caddy serving `dist/` | 3 × **Static Sites** (free tier) — Caddy unused |
| TLS | Caddy + Let's Encrypt | Automatic, built in |
| MySQL | `mysql:8` container | **Managed MySQL** (mandatory — see below) |
| Redis | `redis:7-alpine` container | **Managed Valkey/Redis** (mandatory) |
| Routing | `Caddyfile` | `ingress.rules` in `app.yaml` |
| Schema import | `docker-entrypoint-initdb.d` | **Manual one-time step** (see below) |
| Debugging | `docker compose logs`, SSH | `doctl apps logs`, no SSH |

### Four App Platform gotchas (verified against DO docs)

**1. There is no Docker build-target selector.** The app spec has
`dockerfile_path` but **no target field**, so App Platform always builds the
**last** stage. That is why `api` is deliberately the final stage in the
`Dockerfile` — if you move it, App Platform will build the Caddy image instead
and the deploy will fail. Do not reorder those stages.

**2. No persistent volumes → managed databases are mandatory.** DO documents
*"App Platform does not support volumes"* and *"Data in the host instance's local
filesystem is permanently lost after deployments."* You therefore **cannot** run
the `db` and `redis` containers from `docker-compose.yml` here. `app.yaml` uses
managed `db` (MySQL) and `redis` (Valkey) instead.

**3. The schema must be imported by hand — once.** There is no
`docker-entrypoint-initdb.d` equivalent. Because the seeder code only `ALTER`s
columns, the app will boot against an empty database and every query will fail.
Worse, `schema-mysql.sql` contains **8 `INSERT`s and 23 `ALTER TABLE`s**, so it is
**not idempotent** — re-running it aborts on the first duplicate constraint. Import
it exactly once, before the first boot:

```bash
# Using the connection details from Apps → your app → db → Connection Details
mysql --host=<HOST> --port=<PORT> --user=doadmin --password=<PASSWORD> \
      --ssl-mode=REQUIRED <DB_NAME> < packages/backend/database/schema-mysql.sql
```

Verify:

```bash
mysql --host=<HOST> --user=doadmin --password=<PASSWORD> --ssl-mode=REQUIRED \
      <DB_NAME> -e "SHOW TABLES;"
# expect: users, administrators, rewards, recycling_transactions, ...
```

*(A `PRE_DEPLOY` job could automate this, but it would need a guard table to stay
idempotent. For a capstone, the manual import is simpler and safer.)*

**4. gVisor sandbox + CDN caveats.**
- App Platform runs containers under the **gVisor** sandbox, which implements a
  subset of syscalls. `onnxruntime-node` and `sharp` are native modules — when you
  add the vision service, **test them on App Platform early**. This is the single
  biggest reason to prefer the Droplet once vision lands.
- *"You cannot disable the CDN cache for apps with static sites."* The SPAs are
  served via DO's Spaces CDN. Usually fine, but a hard refresh may be needed after
  a deploy to see new assets.
- The local filesystem is capped at **4 GiB** and is wiped on every deploy — do not
  write uploads or logs to disk.

### Cost comparison (verified pricing)

| | Droplet + Compose | App Platform |
|---|---|---|
| API | — | **$10–12/mo** (1 vCPU / 1 GiB; 512 MiB will OOM Node) |
| Frontends | included | **$0** (up to 3 static sites free, 1 GiB transfer each) |
| MySQL | included | **$15/mo** managed (or $7/mo dev DB — not for production) |
| Redis | included | **$15/mo** managed |
| Compute | **$12–24/mo** (2–4 GiB droplet) | — |
| **Total** | **~$12–24/mo** | **~$40–42/mo** |

App Platform is **~2–3× the cost**. You are paying for managed databases, managed
TLS, auto-deploy, and zero server maintenance — real value, but not free.

### Verify after deploying

```bash
curl -s https://<app>.ondigitalocean.app/health
curl -s https://<app>.ondigitalocean.app/health/ready
```

Then in a browser:

| URL | Expected |
|---|---|
| `/` | Mobile PWA |
| `/admin/` | Admin panel |
| `/kiosk/` | Kiosk terminal |
| `/api/security/appwrite` | JSON from the API |

⚠️ **If a frontend shows a blank page**, the ingress prefix is being stripped
before reaching the static site, so the vite `--base` no longer matches. The fix is
either to remove the prefix from the static site's build command (back to
`--base=/`) or to give that component **its own domain** instead of a path prefix.
The API routes (`/api`, `/health`) are unaffected — only the SPAs use a base path.

### My recommendation

**Start with the Droplet.** It is ~2–3× cheaper, you keep SSH and real logs, and —
critically — you can run it **on the kiosk itself** if you decide the deposit path
must work offline. Move to App Platform later if you want to stop doing server
maintenance; `app.yaml` and the `Dockerfile` are already ready.

The one scenario where App Platform wins immediately: you want `git push` to
deploy and you don't want to think about certs, patching, or backups.


---

## Cloudflare in front (optional, free)

Cloudflare and Caddy are **different layers, not substitutes — and both are
free** (Caddy is open-source, $0; Cloudflare's free plan is $0). They stack:

```
Internet → Cloudflare edge (DNS, DDoS, CDN, WAF) → Caddy (:80/:443 on the
droplet, still terminates TLS with Let's Encrypt) → api / SPAs
```

Use **both** for a public kiosk: Cloudflare absorbs abuse and caches the SPAs
globally; Caddy still does per-host routing on the droplet. There is no extra
charge either way — Cloudflare free-tier covers one domain with unlimited DDoS
mitigation and 3 Page Rules. (Cloudflare only starts billing if you add Workers
Paid, R2 storage, or an upgrade — none of which this setup needs.)

### Option A — Cloudflare proxy in front of the Droplet (recommended)

> **Goal:** one origin (`https://waste2goods.example.com` serves the SPAs
> *and* `/api/*` through Caddy). `CORS_ORIGINS`/`CSRF_ORIGINS` stay empty.
> **Cost delta: $0.**

```
Internet → Cloudflare edge (DNS/DDoS/CDN/WAF) → Caddy :80/:443 on droplet
                                                      (Let's Encrypt cert)
                                                   → SPAs + api:3001
```

#### A0 — What you need in your hands

- Droplet IP (e.g. `143.198.10.20`) with the stack already up via
  `docker compose up -d --build` and `DOMAIN=waste2goods.example.com` in `.env`
- Access to your domain's DNS + a Cloudflare account (free plan is enough)

#### A1 — Add the domain to Cloudflare (5 min, dashboard)

1. Cloudflare dashboard → **Add domain** → enter `example.com` → plan **Free**.
2. Cloudflare shows 2 nameservers. At your registrar, replace the current
   nameservers with those 2. Wait for "Active" (5–30 min typical).
3. DNS → Records → **Add record**: Type `A`, Name `@` (or `waste2goods` for a
   subdomain), IPv4 = droplet IP, Proxy = **Proxied (orange cloud ON)**.
   Add `www` the same way if you use it.

#### A2 — Set `.env` on the droplet (SSH)

```bash
ssh root@<DROPLET_IP>
cd /opt/waste2goods   # wherever you cloned the repo
cp .env.docker.example .env
nano .env
```

Set these exact values for Option A:

```env
DOMAIN=waste2goods.example.com
TRUST_PROXY=2
CORS_ORIGINS=
CSRF_ORIGINS=
```

Generate secrets once (never reuse dev values):

```bash
openssl rand -hex 48    # → JWT_SECRET (paste into .env)
openssl rand -hex 48    # → JWT_REFRESH_SECRET
openssl rand -base64 24 # → DB_PASSWORD
openssl rand -base64 24 # → MYSQL_ROOT_PASSWORD
```

> Why `TRUST_PROXY=2`: hops are Cloudflare (1) + Caddy (1). With `1`, Express
> sees Cloudflare's edge IP as `req.ip` and **every visitor shares one
> rate-limit bucket** — one bot locks everyone out. This is the #1 Option-A
> misconfiguration.

#### A3 — (Re)deploy the stack

```bash
docker compose up -d --build
sleep 15
docker compose ps
curl -s http://127.0.0.1:3001/health
# → {"status":"ok", ...}
```

#### A4 — Cert BEFORE proxy complications (important order)

Caddy gets its Let's Encrypt cert over port 80. That works through the
orange cloud, but first issuance is most reliable with DNS pointed and ports
reachable. Verify:

```bash
docker logs waste2goods-web-1 2>&1 | grep -i -E "certificate|acquired|error" | tail -5
curl -vk https://waste2goods.example.com/health 2>&1 | head -20
```

If you see `certificate obtained successfully`, move on. If issuance fails
behind the proxy, flip the DNS record to **DNS-only (grey cloud)**, wait
2 min, `docker restart waste2goods-web-1`, confirm the cert, then flip back
to **Proxied (orange cloud)**.

#### A5 — SSL mode Full (strict) (dashboard, 30 sec)

SSL/TLS → Overview → Encryption mode → **Full (strict)**. Caddy serves a real
Let's Encrypt cert so strict validates CF→origin. **Never use `Flexible`**
— it downgrades CF→origin to plain HTTP, exposing logins/JWTs.

#### A6 — Lock the origin: firewall (SSH)

Once proxied, only Cloudflare should reach Caddy. Keep SSH for yourself:

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

Stronger: restrict 80/443 to Cloudflare IP ranges
(`https://www.cloudflare.com/ips/`). The orange cloud hides your origin from
most scanners, but assume the IP leaks and keep the app patched.

#### A7 — Cache rules: never cache the API (dashboard, 2 min)

Caching → Cache Rules → Create rule `bypass-api`: if URI Path starts with
`/api/` OR `/health` OR `/cdn/` OR `/security-dashboard` → **Bypass cache**.
Caddy already sends correct `Cache-Control`; this survives dashboard mistakes.
Wrong here = stale logins, cached `POST /api/transactions` 200s.

#### A8 — Free hardening (dashboard, 5 min)

1. Security → **WAF managed ruleset** → ON.
2. Security → Bots → **Block definitely-automated** — then test the kiosk
   flow: the ESP32 posts without a browser UA and must NOT be blocked; if it
   trips, add a skip for `/api/vision/*`.
3. Rate limiting rule (second layer behind the app limiter): URI Path starts
   with `/api/auth/` AND > 20 req / 10 s → Block 60 s.
4. SSL/TLS → Edge Certificates → **Always Use HTTPS** ON, **HTTPS Rewrites**
   ON, minimum TLS **1.2**.

#### A9 — Verify end-to-end (SSH + browser)

```bash
# 1. Edge is Cloudflare (cf-ray header present)
curl -sI https://waste2goods.example.com/ | grep -i -E "cf-ray|server:"
# 2. API through the edge
curl -s https://waste2goods.example.com/health
curl -s https://waste2goods.example.com/health/ready
# 3. Limiter sees YOUR ip, not Cloudflare's
curl -sI -X POST https://waste2goods.example.com/api/auth/login \
  -H 'Content-Type: application/json' -d '{"email":"a@b.c","password":"x"}' \
  | grep -i ratelimit
# 4. Same-origin mutation works with empty CORS/CSRF
curl -s -X POST https://waste2goods.example.com/api/auth/kiosk-login \
  -H 'Content-Type: application/json' -d '{"pin":"<YOUR_KIOSK_PIN>"}'
```

Browser: open `https://waste2goods.example.com/`, `/admin/`, `/kiosk/` — valid
cert, no CORS errors in DevTools (same origin → zero preflights expected).

#### A10 — Operate it

- Deploys: `git pull && docker compose up -d --build` (Cloudflare untouched).
- Renewals: automatic via Caddy. Logs: `docker compose logs -f web api`.
- If `req.ip` in logs looks like a Cloudflare IP → `TRUST_PROXY` is wrong;
  set `2` and `docker compose up -d api`.

Cost delta: **$0**. Proxied DNS + Full (strict) + WAF + bot rule are free-plan.

---
### Option B — Cloudflare Pages for the 3 SPAs + Droplet for the API only

Move the Vite builds to **Pages** (free: unlimited static requests on the free
plan, generous build minutes) and keep only the API on the droplet. This splits
the origin, so the API must explicitly allow the Pages domains:

```env
# .env on the droplet — API host is api.example.com, Pages hosts differ
CORS_ORIGINS=https://waste2goods.pages.dev,https://admin.example.com
CSRF_ORIGINS=https://waste2goods.pages.dev,https://admin.example.com
```

> ⚠️ `CSRF_ORIGINS` is the one people forget: without it, `csrfOriginGuard`
> returns **403 on every POST/PUT/DELETE** (login, deposits, redemptions all
> break) while GETs keep working — a confusing half-outage. CORS and CSRF must
> carry the same list.

Pages build settings per site (all three use the monorepo root as the repo,
with the working directory set per project):

| Pages project | Build command | Output dir | Notes |
|---|---|---|---|
| `waste2goods` (mobile) | `npm run build --workspace=@waste2goods/mobile-app -- --base=/` | `packages/mobile-app/dist` | needs `VITE_API_BASE_URL=https://api.example.com` at build time |
| `waste2goods-admin` | `npm run build --workspace=@waste2goods/admin-panel -- --base=/` | `packages/admin-panel/dist` | each Pages project is its own origin → its own `--base=/` |
| `waste2goods-kiosk` | `npm run build --workspace=@waste2goods/kiosk-app -- --base=/` | `packages/kiosk-app/dist` | kiosk should ideally stay same-origin (see below) |

Trade-offs vs Option A:

- ✅ API droplet serves only JSON — smaller bandwidth bill, easier scaling.
- ✅ Global SPA latency (Pages edge) instead of single-region (Singapore).
- ❌ Two origins to maintain, CORS+CSRF lists to keep in sync.
- ❌ **Kiosk caution:** a cloud-hosted kiosk SPA still needs internet for every
  deposit (same offline warning as App Platform). If the kiosk must work
  offline, keep the kiosk SPA on the local Caddy (Option A) or on the kiosk PC.

**Recommendation:** Option A for the capstone (one origin, no CORS surface,
works offline-on-LAN, $0 extra). Option B when you outgrow one droplet or want
Pages' global edge for the public mobile/admin sites.

---

## Security checklist before going public

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


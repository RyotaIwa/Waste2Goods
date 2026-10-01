# syntax=docker/dockerfile:1
#
# Waste2Goods — single Dockerfile, multiple targets:
#   docker build -t w2g-api .                  → default target = the API (last stage)
#   docker build --target api -t w2g-api .     → Node/Express API + security dashboard
#   docker build --target web -t w2g-web .     → Caddy serving the 3 SPAs + reverse proxy
#
# Stage order matters: `api` is intentionally LAST so DigitalOcean App Platform —
# which cannot select a multi-stage build target — builds the API. Compose passes
# --target explicitly for both images.
#
# Build context MUST be the monorepo root (npm workspaces).

# ════════════════════════════════════════════════════════════════════
# 1. deps — full workspace install (includes dev deps, needed to build)
# ════════════════════════════════════════════════════════════════════
FROM node:22-bookworm-slim AS deps
WORKDIR /app
ENV npm_config_update_notifier=false \
    npm_config_fund=false \
    npm_config_audit=false

# Copy every workspace manifest first so this layer caches well.
# All of them are required: `npm ci` validates the root lockfile against
# the full workspace set, and copies only backend/core for the runtime stage.
COPY package.json package-lock.json ./
COPY packages/core/package.json            ./packages/core/
COPY packages/backend/package.json         ./packages/backend/
COPY packages/mobile-app/package.json      ./packages/mobile-app/
COPY packages/admin-panel/package.json     ./packages/admin-panel/
COPY packages/kiosk-app/package.json       ./packages/kiosk-app/
COPY packages/backend-laravel/package.json ./packages/backend-laravel/
RUN npm ci

# ════════════════════════════════════════════════════════════════════
# 2. frontend-build — build the three Vite SPAs with sub-path bases
# ════════════════════════════════════════════════════════════════════
FROM deps AS frontend-build

COPY packages/core        ./packages/core
COPY packages/mobile-app  ./packages/mobile-app
COPY packages/admin-panel ./packages/admin-panel
COPY packages/kiosk-app   ./packages/kiosk-app

# Sub-path base is passed via the Vite CLI. (process.env is NOT exposed to
# vite.config.ts while Vite loads the config, so a config-level base would be
# ignored — the --base flag is the reliable mechanism.)
RUN npm run build --workspace=@waste2goods/mobile-app -- --base=/
RUN npm run build --workspace=@waste2goods/admin-panel -- --base=/admin/
RUN npm run build --workspace=@waste2goods/kiosk-app   -- --base=/kiosk/

# ════════════════════════════════════════════════════════════════════
# 3. web — Caddy: static SPAs + automatic HTTPS + reverse proxy to the API
#    (Droplet/Compose only. App Platform serves static sites natively and
#     terminates TLS itself, so this stage is not used there.)
# ════════════════════════════════════════════════════════════════════
FROM caddy:2-alpine AS web
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=frontend-build /app/packages/mobile-app/dist  /srv/mobile
COPY --from=frontend-build /app/packages/admin-panel/dist /srv/admin
COPY --from=frontend-build /app/packages/kiosk-app/dist   /srv/kiosk
EXPOSE 80 443

# ════════════════════════════════════════════════════════════════════
# 4. api — production Node runtime (backend workspace only)
#
#    ⚠️ THIS MUST REMAIN THE LAST STAGE IN THE FILE.
#    DigitalOcean App Platform cannot select a multi-stage build target
#    (the app spec has `dockerfile_path` but no target field), so it always
#    builds the final stage. Compose overrides this with `--target api` /
#    `--target web`, so both deployment paths work from this one file.
# ════════════════════════════════════════════════════════════════════
FROM node:22-bookworm-slim AS api
ENV NODE_ENV=production \
    PORT=3001 \
    NODE_OPTIONS=--enable-source-maps
WORKDIR /app

# Manifests (all of them, so `npm ci` can validate the lockfile) …
COPY package.json package-lock.json ./
COPY packages/core/package.json            ./packages/core/
COPY packages/backend/package.json         ./packages/backend/
COPY packages/mobile-app/package.json      ./packages/mobile-app/
COPY packages/admin-panel/package.json     ./packages/admin-panel/
COPY packages/kiosk-app/package.json       ./packages/kiosk-app/
COPY packages/backend-laravel/package.json ./packages/backend-laravel/
# … then install production dependencies only. npm still links the local
# @waste2goods/core workspace package, which is pure JS (no build step).
# The workspace filter keeps the image lean; if a future npm version rejects
# `npm ci --workspace`, the fallback installs everything (correct, just bigger).
RUN npm ci --omit=dev --workspace=@waste2goods/backend --include-workspace-root \
      || npm ci --omit=dev \
 && npm cache clean --force

# Runtime sources
COPY packages/core/src         ./packages/core/src
COPY packages/backend/src      ./packages/backend/src
COPY packages/backend/public   ./packages/backend/public
COPY packages/backend/database ./packages/backend/database

# ── Vision model (optional) ─────────────────────────────────────────
# When you add YOLO11, place the ONNX file at packages/backend/models/ and
# uncomment the next line. Until then /api/vision/* returns 503 and the rest
# of the platform works normally.
# COPY packages/backend/models ./packages/backend/models
RUN mkdir -p packages/backend/models

USER node
EXPOSE 3001

# Uses Node's built-in fetch — no curl needed in the image.
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "packages/backend/src/index-mysql.js"]

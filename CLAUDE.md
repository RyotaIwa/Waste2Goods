# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Waste2Goods — a gamified recycling platform for a barangay (Cabantian). Residents drop off
recyclables at a bottle machine / kiosk, earn points, and redeem them for rewards. It's an npm
workspaces monorepo (`packages/*`) with a Node/Express + MySQL backend and three separate
Vite/React frontends (mobile PWA, admin panel, kiosk terminal).

## Commands

Install once from the repo root (npm workspaces): `npm install`.

**Local dev** needs MySQL running (XAMPP locally: `127.0.0.1:3306`, db name `waste2goods` — the
backend creates/migrates/seeds it on boot, see Architecture below) and 4 terminals from the root:
```
npm run dev:backend-mysql   # or: npm run start-mysql / npm start  — API at :3001
npm run dev:admin           # admin panel at :5174
npm run dev:mobile          # resident PWA at :5173
npm run dev:kiosk           # kiosk terminal at :5175
```
Redis is optional (graceful in-memory fallback): `pwsh -File scripts/redis.ps1 {up|status|down|logs|reset}`,
then `npm run redis:check` to confirm the backend is actually using it.

**Build** a frontend: `npm run build:admin` / `build:kiosk` / `build:mobile` from the root (each
just does `vite build` inside that package). There's no root build for the backend (it's run
directly with Node).

**Tests** only exist for the backend:
```
npm test                                              # root → runs the one test file below
cd packages/backend && node --test src/security/security.test.js   # same thing, directly
cd packages/backend && node test-e2e.mjs              # live E2E smoke test — needs a running,
                                                       # seeded backend (auth, ABAC, cache, CSRF)
```
`npm run lint` (root) runs ESLint on `packages/backend/src` only — the three frontend packages
have no lint/test scripts. To check a frontend package, use `npx tsc --noEmit -p .` inside it
(e.g. `cd packages/mobile-app && npx tsc --noEmit -p .`) and/or `npm run build` there; both are
fast and catch most issues before you hand changes back.

## Architecture

### Packages — know which one you're actually in

- `packages/backend` — **the real backend is `src/index-mysql.js`** (~2000+ lines, MySQL-backed,
  full auth/RBAC/rate-limit/cache stack). `src/index.js` is a much smaller, separate in-memory/SQLite
  demo entrypoint (`db.js`, mock data from `@waste2goods/core`'s `constants`) — don't confuse the
  two; almost all real feature work happens in `index-mysql.js` and its `src/security/*` modules.
  `src/machine-routes.js` is attached separately (`attachMachineRoutes(app)`) and handles the
  physical bottle-machine integration (see below).
- `packages/core` — shared types/constants/API client, imported as `@waste2goods/core` by all
  three frontends via workspace symlink. **Its `package.json` `main` points at the plain `.js`
  files (`src/index.js` → re-exports `constants.js` + `api.js`), not the `.ts` ones** — those are
  the real runtime source. The `.ts` files (`api.ts`, `constants.ts`, plus `index.ts`) exist for
  type-checking in the frontend packages but are **not auto-compiled or synced** — there's no
  build step that generates one from the other. **Any change to the API client or shared mock
  data must be made in both the `.ts` and `.js` versions by hand**, or the frontends will type-check
  against methods/shapes that don't exist at runtime (or vice versa). `types.ts` has no `.js`
  twin (pure type declarations, type-only import).
- `packages/mobile-app`, `packages/admin-panel`, `packages/kiosk-app` — independent Vite + React
  19 + Tailwind SPAs, each a single large `src/app/App.tsx` (thousands of lines, many components
  per file rather than split into separate files) using a hand-rolled screen-enum + switch router
  (no React Router). Ports: mobile `5173`, admin `5174`, kiosk `5175`.
- `packages/backend-laravel` — a small, secondary PHP/Laravel re-implementation of parts of the
  API (`php -S localhost:3001 -t public`). Not the primary backend; don't assume parity with
  `index-mysql.js` unless you check.
- `waste2goods_mobile/` (repo root, **not** under `packages/`) — a separate Flutter/Dart app.
  Appears to be an earlier/alternate mobile client; the actively developed resident app is
  `packages/mobile-app` (React). Don't conflate the two when asked to change "the mobile app."

### Backend request pipeline (`index-mysql.js` + `src/security/*`)

Helmet → 8-tier rate limiting (`security/rate-limit.js`) → CSRF origin guard (`security/csrf.js`)
→ Zod body validation (`security/validate.js`, `validateBody(Schema)`) → JWT auth
(`security/auth-jwt.js`, `authenticateJWT`/`authenticate`) → ABAC authorization
(`security/authorization.js`). New mutating routes should follow the existing pattern: add a Zod
schema in `validate.js`, then `app.post(path, authenticate, requirePermission(action, resource), writeLimiter, validateBody(Schema), handler)`.

- **Authorization** (`authorization.js`) is a hand-written 6-role × 11-resource permission matrix
  (`super_admin`, `admin`, `barangay_admin`, `resident`, `kiosk`, `anon`) checked via
  `requirePermission(action, resource)`, `requireRole(...roles)`, or `requireOwnershipOrRole(roles, paramName, bodyField)`
  for "admin OR the resource's own user" endpoints. Check this matrix before assuming a role can
  or can't do something — it's often more granular than you'd guess (e.g. the `kiosk` role already
  has `redemption: status` permission, used by the kiosk pickup-terminal claim endpoint).
- **Caching** (`security/cache.js`): routes are wrapped with `cacheRoute(seconds)`; any endpoint
  that mutates data must call the matching `CacheBust.<resource>()` afterwards (e.g.
  `CacheBust.redemptions()`, `CacheBust.tasks()`) or reads will serve stale cached data. Backed by
  Redis when available (`security/redis-client.js`), transparently falls back to in-memory.
- **Quest/task progress** lives in `packages/backend/src/quest-progress.js`
  (`updateTaskProgressForUser`), shared by both `index-mysql.js`'s manual transaction endpoint and
  `machine-routes.js`'s bottle-machine claim endpoint — any new way of recording a recycling
  transaction should call it too, or quest progress silently won't update for that path.
- **Bottle machine integration** (`machine-routes.js`): the physical machine posts finished
  deposits to `POST /api/machine/transactions` (API-key auth, not JWT) with a receipt code;
  the resident later redeems that code themselves via `POST /api/machine/claim` (JWT). This is the
  real "earn points" path — there is no live kiosk-to-phone session/QR-scanning flow (an earlier
  one existed and was removed as unreliable across separate devices).
- **Reward redemption** stays admin-approved as before (`PUT /api/redemptions/:id/status`), but
  requesting a reward also generates an 8-char pickup code (`reward_redemptions.redeemCode`); once
  approved, that code is verified/claimed at the kiosk terminal via `POST /api/redemptions/claim`.

### Database schema & migrations — two mechanisms, keep both in sync

- `packages/backend/database/schema-mysql.sql` is the full baseline dump (fresh-install source of
  truth, includes inline comments marking which migration added what).
- `packages/backend/migrations/NNN_description.sql` are numbered, idempotent, guarded (stored
  procedure + `information_schema` checks) incremental scripts — meant for manual application
  against a production/managed database.
- **But for local/XAMPP dev, schema changes are actually auto-applied on every backend boot** by
  `db-mysql.js`'s `applySchemaMigrations()` (gated by `DB_RUN_MIGRATIONS`, default `true`) via
  `migrateTableColumns(table, [{column, definition}, ...])` for simple column adds, plus small
  dedicated `ensureX()` functions for anything else (views, seed data, unique keys). **When you
  add a column/table, add it in all three places** — the schema dump, a new numbered migration
  file, and an entry in `applySchemaMigrations()` — otherwise local dev and a fresh/managed
  install will quietly drift apart. `SEED_DEMO_DATA` (default on outside `NODE_ENV=production`)
  controls whether the demo admin/resident accounts get (re)created.
- The `tasks` table is actually a **VIEW** over `recycling_tasks` (`ensureTasksView()`), kept for
  backward compatibility — don't query/alter `tasks` directly for schema changes.

### Deployment

`Dockerfile` is a multi-stage build with two targets: `api` (Node/Express, built last so
DigitalOcean App Platform's single-target build picks it by default) and `web` (Caddy serving the
three built SPAs + reverse proxy). `docker-compose.yml` wires up `db` + `redis` + `api` + `web` for
self-hosting; `app.yaml` is the DigitalOcean App Platform spec (1 API service, 3 static sites,
managed MySQL + Redis/Valkey) — see `DEPLOYMENT.md` for the full walkthrough.

## Local credentials (XAMPP/demo seed data)

| Role | Login | Password/PIN |
|---|---|---|
| Admin | `admin@waste2goods.ph` | `AdminCabantian2025` |
| Resident | `resident@cabantian.ph` | `ResidentCabantian2025` |
| Kiosk | PIN | `7890` |

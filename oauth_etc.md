# Waste2Goods — Instructor Demo Script (OAuth 2.0 & DevSecOps)

Copy any section below. Use this during the live walkthrough.

**Project:** Waste2Goods (Gamified Recycling Platform)  
**Deliverable:** D2-P2 — Authentication, Authorization, Rate Limiting, Redis Caching, DevSecOps  
**Backend:** `http://localhost:3001`

---

## 60-second explanation (say this)

Waste2Goods is its **own OAuth 2.0 Authorization Server**. We did not use Google or Facebook login.

Registered clients (`admin-panel`, `mobile-app`, `kiosk-app`) request access using **Authorization Code + PKCE**. The user sees a **consent screen**, we issue a short-lived **authorization code** (stored in Redis or in-memory fallback), then the client exchanges that code at `/api/oauth2/token` for a **15-minute JWT access token** and a **7-day rotating refresh token**.

APIs are then protected by **JWT verification**, **role-based / ABAC permissions** (6 roles × resources × actions), **multi-tier rate limits**, and **cached GET responses** with CDN-ready headers.

The live demo is the backend security dashboard plus the OAuth consent and callback pages.

---

## What the rubric asked vs what we built

| Rubric | What we implemented |
|---|---|
| **Authentication & OAuth Flow (25)** | OAuth 2.0 Authorization Code + PKCE S256, consent UI, token, introspect, revoke; JWT login with rotating refresh |
| **Access Control & Authorization (30)** | Permission matrix (super_admin, admin, barangay_admin, resident, kiosk, anon) + `requirePermission` on APIs |
| **Threat Mitigation & Rate Limiting (30)** | 8 limiter tiers: global, auth, auth failure lockout, writes, analytics, kiosk, OAuth authorize, OAuth token |
| **Availability, Caching & CDN (50)** | Namespaced cache (adm/res/kio/pub), TTLs, `Cache-Control` / `Surrogate-Key` / `Surrogate-Control` (CDN-ready). Redis when enabled |
| **Code Quality & DevSecOps (30)** | Helmet, CORS, Zod validation, bcrypt, SonarQube config, `/security-dashboard` |

**If asked “Is this Google OAuth?”**  
No. We implemented **RFC 6749** (Authorization Code), **RFC 7636** (PKCE), **RFC 8414** (discovery), **RFC 7662** (introspect), **RFC 7009** (revoke).

---

## Before the demo (start the server)

1. Start **XAMPP MySQL**.
2. (Recommended) Start **Redis** on `127.0.0.1:6379`. If Redis is off, the server still runs using in-memory cache/tokens — say that out loud.
3. Start the API:

```powershell
cd packages/backend
npm run start-mysql
```

4. Confirm logs show something like:
   - API: `http://localhost:3001`
   - Dashboard: `http://localhost:3001/security-dashboard`
   - OAuth discovery: `http://localhost:3001/api/oauth2/.well-known/oauth-authorization-server`

**Demo accounts**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@waste2goods.ph` | `AdminCabantian2025` |
| Resident | `resident@cabantian.ph` | `ResidentCabantian2025` |
| Kiosk PIN | — | `7890` |

---

## Live demo order (click these)

### Step A — Security dashboard (overview)

Open: [http://localhost:3001/security-dashboard](http://localhost:3001/security-dashboard)

**Say:** This maps to the five rubric columns: OAuth, authorization, rate limits, Redis/cache, DevSecOps.

Also show:

- Discovery JSON: [http://localhost:3001/api/oauth2/.well-known/oauth-authorization-server](http://localhost:3001/api/oauth2/.well-known/oauth-authorization-server)
- Registered clients: [http://localhost:3001/api/oauth2/clients](http://localhost:3001/api/oauth2/clients)

Point at: `authorization_endpoint`, `token_endpoint`, `introspection_endpoint`, `revocation_endpoint`, `code_challenge_methods_supported: S256`.

---

### Step B — Login (get a JWT)

OAuth **consent requires a logged-in user**. Login first.

**PowerShell** (use `curl.exe` so it is real curl, not `Invoke-WebRequest`):

```powershell
curl.exe -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@waste2goods.ph\",\"password\":\"AdminCabantian2025\"}"
```

Copy `access_token` from the JSON.

**Say:** Password login issues a short-lived access JWT and a rotating refresh token. OAuth is the *delegation* flow on top of that session.

---

### Step C — Consent screen (the visual they expect)

In **Postman** or **Thunder Client**:

- Method: `GET`
- URL:

```
http://localhost:3001/api/oauth2/authorize?client_id=admin-panel&redirect_uri=http://localhost:3001/api/oauth2/demo/callback&response_type=code&scope=admin:read%20profile:read&state=instructor-demo-12345&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256
```

- Header: `Authorization: Bearer <paste access_token>`

You should see the green page:

**Waste2Goods — OAuth 2.0 Authorization**

**Say while pointing:**

- Client: `admin-panel` (confidential)
- Requested scopes: `admin:read`, `profile:read`
- PKCE: `code_challenge` + `S256`
- `state=instructor-demo-12345` (CSRF protection)
- User identity from the JWT

Click **Allow — Issue Authorization Code**.

---

### Step D — Authorization code (callback)

You land on:

`http://localhost:3001/api/oauth2/demo/callback?code=...&state=instructor-demo-12345`

**Say:**

- Redirect URI is **allowlisted** (unknown URIs are rejected — no open redirect)
- `code` is short-lived (~10 min) and stored server-side
- `state` is echoed back unchanged (CSRF check)
- Click **Deny** instead to show `error=access_denied`

Copy the `code` value.

---

### Step E — Exchange code for tokens

**PowerShell** — replace `PASTE_CODE_HERE`:

```powershell
curl.exe -s -X POST http://localhost:3001/api/oauth2/token -H "Content-Type: application/json" -d "{\"grant_type\":\"authorization_code\",\"code\":\"PASTE_CODE_HERE\",\"redirect_uri\":\"http://localhost:3001/api/oauth2/demo/callback\",\"client_id\":\"admin-panel\",\"client_secret\":\"admin-panel-secret-local-only\"}"
```

Expected fields:

- `access_token` — JWT, ~15 minutes
- `refresh_token` — opaque, ~7 days, rotation + reuse detection
- `expires_in`, `token_type: Bearer`, `jti`

**Say:** The app never keeps the user password. It only keeps tokens. PKCE stops an attacker who steals the `code` from exchanging it without the `code_verifier`.

Optional — decode the JWT at [https://jwt.io](https://jwt.io) and show `iss`, `aud`, `sub`, `role`, `jti`, `exp`.

---

### Step F — Introspect and revoke (extra points)

Replace `PASTE_ACCESS_TOKEN`:

**Introspect (is this token still good?)**

```powershell
curl.exe -s -X POST http://localhost:3001/api/oauth2/introspect -H "Content-Type: application/json" -d "{\"token\":\"PASTE_ACCESS_TOKEN\",\"client_id\":\"admin-panel\",\"client_secret\":\"admin-panel-secret-local-only\"}"
```

Expect `"active": true`.

**Revoke (logout)**

```powershell
curl.exe -s -X POST http://localhost:3001/api/oauth2/revoke -H "Content-Type: application/json" -d "{\"token\":\"PASTE_ACCESS_TOKEN\",\"token_type_hint\":\"access_token\",\"client_id\":\"admin-panel\",\"client_secret\":\"admin-panel-secret-local-only\"}"
```

Introspect again → inactive / later API call with that Bearer token → **401 Token revoked**.

---

### Step G — Authorization (not the same as OAuth)

**Say:** OAuth answers “who is this client/user?” Authorization answers “what may they do?”

Show one of:

- [http://localhost:3001/api/security/policy](http://localhost:3001/api/security/policy) (needs admin Bearer)
- Code: `packages/backend/src/security/authorization.js`

Quick live proof:

1. Call `GET /api/analytics/summary` with a **resident** token → **403**.
2. Same call with an **admin** token → **200**.

---

### Step H — Rate limiting

**Say:** Login is limited to 10 attempts / 15 min per IP; 5 failed logins lock that email for 5 minutes. OAuth authorize is 30 / 5 min; token endpoint 60 / min. Writes are 30 / user / min.

Optional: spam `POST /api/auth/login` with a wrong password until you get the lockout JSON.

---

### Step I — Caching / Redis

Call `GET /api/rewards` twice with a valid token.

- First response header: `X-W2G-Cache: MISS`
- Second: `X-W2G-Cache: HIT`
- Also show `Cache-Control` and `Surrogate-Key` (CDN-ready; Cloudflare/Fastly would sit in front)

If Redis is running, also show `/api/security/cache-stats` or `/api/security/redis-stats`.

**If Redis is not running, say:** Cache and token store fall back to in-process memory. Production intent is Redis (`REDIS_ENABLED=true` or `REDIS_URL`).

---

## OAuth flow diagram (draw / show)

```
[Admin / Mobile App]
        |
        |  1. Create PKCE verifier + S256 challenge
        |  2. GET /api/oauth2/authorize?client_id&redirect_uri&code_challenge&state
        v
[Waste2Goods Auth Server]  ---- consent UI (Allow / Deny)
        |
        |  3. User Allow → store auth code (Redis) → redirect
        v
[Demo callback]  ?code=...&state=...
        |
        |  4. POST /api/oauth2/token  (code + client_secret [+ code_verifier])
        v
[Tokens]  access_token (JWT 15m) + refresh_token (7d, rotating)
        |
        |  5. API calls: Authorization: Bearer <access_token>
        v
[Resource APIs]  JWT verify → JTI revoke check → ABAC permission → rate limit → cache
```

---

## Files to open in the IDE (if they ask for code)

| Topic | File |
|---|---|
| OAuth server, clients, consent HTML | `packages/backend/src/security/oauth2-server.js` |
| JWT, auth codes, refresh rotation | `packages/backend/src/security/auth-jwt.js` |
| Permission matrix (ABAC) | `packages/backend/src/security/authorization.js` |
| Rate limit tiers | `packages/backend/src/security/rate-limit.js` |
| Cache + CDN headers | `packages/backend/src/security/cache.js` |
| Redis / memory fallback | `packages/backend/src/security/redis-client.js` |
| Routes + dashboard | `packages/backend/src/index-mysql.js` |
| SonarQube | `sonar-project.properties` |

Key endpoints (also listed on `GET http://localhost:3001/`):

```
GET  /api/oauth2/.well-known/oauth-authorization-server
GET  /api/oauth2/clients
GET  /api/oauth2/authorize
POST /api/oauth2/authorize/consent
POST /api/oauth2/token
POST /api/oauth2/introspect
POST /api/oauth2/revoke
GET  /api/oauth2/demo/callback
GET  /security-dashboard
```

---

## If something breaks

| Problem | Fix |
|---|---|
| `401 Unauthorized — missing Bearer token` on `/authorize` | Login first (Step B) and send `Authorization: Bearer …`. The dashboard “Step 1” link does **not** attach a JWT by itself. |
| `invalid_redirect_uri` | Use exactly `http://localhost:3001/api/oauth2/demo/callback` for `admin-panel` / docs demo. |
| `login_required` after clicking Allow | Consent POST also needs the same Bearer token (stay in Postman, do not submit the HTML form in a bare browser tab unless the session is attached). |
| `invalid_grant` on `/token` | Code already used or expired; run authorize again. Codes are one-time. |
| MySQL / connection errors | Start XAMPP MySQL, then `npm run start-mysql` again. |
| Cache always MISS / no Redis | Optional: set `REDIS_ENABLED=true` and start Redis. Demo still works without it. |

---

## Honest notes (only if they press)

- This is a **prototype Authorization Server**. Client secrets in source are **local demo secrets**, not production vault secrets.
- Mobile / admin / kiosk UIs do **not** yet host `/oauth/callback` pages. The graded flow is demonstrated on the **backend** (`/security-dashboard` + `/api/oauth2/demo/callback`).
- Rate limiters currently use **in-memory** Express stores. Redis is used for cache/tokens when enabled.
- CDN is **header-ready** (`s-maxage`, `Surrogate-Key`). There is no Cloudflare account in front of localhost.

Do **not** claim “Google OAuth” or “full production CDN” unless they specifically accept the prototype scope.

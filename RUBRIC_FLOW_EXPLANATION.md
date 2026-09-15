# Waste2Goods — Login & Security Flows Explained (Simple English)

This document explains how authentication, OAuth, access control, rate limiting, caching, and DevSecOps work in Waste2Goods, with copy-paste code examples.

---

## Table of Contents

1. [The Big Idea](#the-big-idea)
2. [Flow 1: Password Login (JWT)](#flow-1-password-login-jwt)
3. [Flow 2: Social Login (GitHub)](#flow-2-social-login-github)
4. [Flow 3: Social Login (Google)](#flow-3-social-login-google)
5. [Flow 4: First-Party OAuth (Authorization Code + PKCE)](#flow-4-first-party-oauth-authorization-code--pkce)
6. [Flow 5: Introspect & Revoke](#flow-5-introspect--revoke)
7. [Access Control (Column F)](#access-control-column-f)
8. [Rate Limiting (Column G)](#rate-limiting-column-g)
9. [Redis Cache & CDN (Column H)](#redis-cache--cdn-column-h)
10. [DevSecOps (Column I)](#devsecops-column-i)

---

## The Big Idea

Waste2Goods is **its own login system** (like having your own Keycloak or Auth0). It doesn't just say "Log in with Google." It **is** the boss that gives out permission slips (tokens) to apps.

Think of it like a **nightclub**:
- You show your ID at the door (password login).
- Or you show a VIP pass from another club (GitHub/Google login).
- Once inside, you get a wristband (JWT token).
- The bouncer checks your wristband at every room (API endpoint) to see if you're allowed in.

---

## Flow 1: Password Login (JWT)

This is the starting point for most demos.

### What happens:

1. You type email + password in the app.
2. Backend checks password with **bcrypt** (hashed, never stored plain text).
3. If correct, backend gives you two tokens:
   - **Access Token** (JWT): lasts **15 minutes**. This is your wristband.
   - **Refresh Token**: lasts **7 days**. If your wristband expires, you show this to get a new one without typing your password again.

### Code to run (PowerShell):

```powershell
# Step B: Login as Admin
$login = curl.exe -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@waste2goods.ph","password":"AdminCabantian2025"}'
$t = ($login | ConvertFrom-Json).accessToken
echo "Access Token: $t"
```

**What you'll see back:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6...",
  "expiresIn": 900,
  "tokenType": "Bearer"
}
```

### Where in code:
- Route: `POST /api/auth/login`
- File: `packages/backend/src/security/auth-jwt.js`
- Password check: bcrypt 10 rounds
- JWT sign: 15-minute expiry, `iss: w2g-auth-server`, `aud: w2g-localhost`

---

## Flow 2: Social Login (GitHub)

### What happens:

1. You click **"Login with GitHub"**.
2. You land on Waste2Goods' fake GitHub-like page (local demo).
3. Click **"Continue as cabantian-recycler"**.
4. Backend creates your account/login and gives you the same JWT wristband.

**If you add real GitHub secrets later**, step 2 redirects to `github.com` instead.

### Code to run (browser):

```
Open: http://localhost:3001/api/auth/github
```

Click **Continue as cabantian-recycler** → you'll see a JWT page.

### Where in code:
- Route: `GET /api/auth/github`
- File: `packages/backend/src/security/github-oauth.js`

### How it works (simplified from `github-oauth.js`):

```javascript
// If no real GitHub credentials, show local demo page
if (!process.env.GITHUB_CLIENT_ID) {
  return res.redirect(302, '/api/auth/github/demo?state=...');
}

// Otherwise redirect to real GitHub
return res.redirect(302, `https://github.com/login/oauth/authorize?${params}`);
```

---

## Flow 3: Social Login (Google)

### What happens:

1. You click **"Login with Google"**.
2. You land on a fake Google-like page (local demo).
3. Click **"Continue as Google Demo Resident"**.
4. Backend creates your account/login and gives you the same JWT wristband.

**If you add real Google secrets later**, step 2 redirects to `accounts.google.com`.

### Code to run (browser):

```
Open: http://localhost:3001/api/auth/google
```

Click **Continue as Google Demo Resident** → you'll see a JWT page.

### Where in code:
- Route: `GET /api/auth/google`
- File: `packages/backend/src/security/google-oauth.js`

### How it works (simplified from `google-oauth.js`):

```javascript
// Demo user profile
const DEMO_GOOGLE_USER = {
  id: 'GOOGLE-10928374',
  name: 'Google Demo Resident',
  email: 'google.demo@cabantian.ph',
  role: 'resident'
};

// If no real Google credentials, show local demo page
if (!googleConfigured()) {
  return res.redirect(302, '/api/auth/google/demo?state=...');
}

// Otherwise redirect to real Google
return res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
```

---

## Flow 4: First-Party OAuth (Authorization Code + PKCE)

This is the **main event** for the rubric. It proves you built a real OAuth server.

### What is OAuth, in plain English?

Normally, when you use an app, you give it your password. That's bad because the app could leak your password.

With OAuth, you never give the app your password. Instead:
1. The app asks Waste2Goods: "Can I get a permission slip for this user?"
2. Waste2Goods shows YOU a screen: "App X wants access to your profile. Allow or Deny?"
3. You click Allow.
4. Waste2Goods gives the app a short-lived **authorization code**.
5. The app exchanges that code for **access + refresh tokens**.

The app never sees your password.

### What is PKCE?

PKCE (pronounced "pixy") is a security handshake. It's like locking the authorization code in a box. Only the app that locked it can unlock it.

- **`code_challenge`**: A scrambled version of a secret word (`code_verifier`), sent in step 1.
- **`code_verifier`**: The original secret word, sent in step 5 when exchanging the code.

If a hacker steals the code from the URL, they can't exchange it without the secret word.

### Step-by-Step:

#### Step 1: Login and get a JWT (you already have this)

```powershell
$login = curl.exe -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@waste2goods.ph","password":"AdminCabantian2025"}'
$t = ($login | ConvertFrom-Json).accessToken
```

#### Step 2: Request an authorization code (consent screen)

Open this URL in a browser (or Postman/Thunder Client). **Add header:** `Authorization: Bearer $t`

```
http://localhost:3001/api/oauth2/authorize?client_id=waste2goods-docs&redirect_uri=http://localhost:3001/api/oauth2/demo/callback&response_type=code&scope=profile:read&state=instructor-demo-12345&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256
```

**What you'll see:** A green consent screen:
```
Waste2Goods — OAuth 2.0 Authorization

Client: Waste2Goods Documentation / Demo
Requested scopes: profile:read
PKCE: Enabled (S256)
State: instructor-demo-12345

[Allow — Issue Authorization Code]  [Deny]
```

Click **Allow**. You'll be redirected to:
```
http://localhost:3001/api/oauth2/demo/callback?code=abc123xyz...&state=instructor-demo-12345
```

Copy the `code` value.

#### Step 3: Exchange the code for tokens

```powershell
curl.exe -s -X POST http://localhost:3001/api/oauth2/token -H "Content-Type: application/json" -d '{"grant_type":"authorization_code","code":"PASTE_CODE_HERE","redirect_uri":"http://localhost:3001/api/oauth2/demo/callback","client_id":"waste2goods-docs","client_secret":"docs-demo-secret","code_verifier":"dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"}'
```

**What you'll see back:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "f6e5d4c3b2a1...",
  "expires_in": 900,
  "token_type": "Bearer",
  "jti": "a1b2c3d4-e5f6-..."
}
```

#### Step 4: Verify the JWT

Copy the `access_token` and decode it at [https://jwt.io](https://jwt.io). You should see:

```json
{
  "iss": "w2g-auth-server",
  "aud": "w2g-localhost",
  "sub": "admin@waste2goods.ph",
  "role": "admin",
  "name": "Admin User",
  "exp": 1725651234,
  "jti": "a1b2c3d4-e5f6-..."
}
```

### Where in code:
- Route: `GET /api/oauth2/authorize`, `POST /api/oauth2/token`
- File: `packages/backend/src/security/oauth2-server.js`
- PKCE helper: `pkceChallengeFromVerifierS256()` in the same file
- Consent HTML: `consentScreenHtml()` function

### Test vectors (these are the values in the URL above):

| Field | Value |
|---|---|
| `code_verifier` | `dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk` |
| `code_challenge` S256 | `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM` |

---

## Flow 5: Introspect & Revoke

### Introspect: "Is this token still good?"

```powershell
curl.exe -s -X POST http://localhost:3001/api/oauth2/introspect -H "Content-Type: application/json" -d '{"token":"PASTE_ACCESS_TOKEN","client_id":"waste2goods-docs","client_secret":"docs-demo-secret"}'
```

**Response:**
```json
{
  "active": true,
  "scope": "profile:read",
  "client_id": "waste2goods-docs",
  "sub": "admin@waste2goods.ph",
  "exp": 1725651234
}
```

### Revoke: "Log this token out"

```powershell
curl.exe -s -X POST http://localhost:3001/api/oauth2/revoke -H "Content-Type: application/json" -d '{"token":"PASTE_ACCESS_TOKEN","token_type_hint":"access_token","client_id":"waste2goods-docs","client_secret":"docs-demo-secret"}'
```

After revoking, try using the token again:

```powershell
curl.exe -s http://localhost:3001/api/security/policy -H "Authorization: Bearer PASTE_REVOKED_TOKEN"
```

**Response:** `401 Unauthorized — Token revoked`

### Where in code:
- Routes: `POST /api/oauth2/introspect`, `POST /api/oauth2/revoke`
- File: `packages/backend/src/security/oauth2-server.js`
- Revocation store: `packages/backend/src/security/auth-jwt.js`

---

## Access Control (Column F)

After you have a token, every API call goes through the **bouncer**:

1. **Is the token valid?** (signature, expiry, not revoked)
2. **What role does this user have?** (admin, resident, barangay_admin, kiosk, etc.)
3. **Does this role have permission for this action?** (ABAC matrix: 6 roles × 11 resources × 8 actions)
4. **Does this user own this data?** (residents can only see their own transactions)
5. **Barangay scope:** Users can only see data from their own barangay.
6. **Super-admin ID protection:** Super-admin IDs cannot be modified or deleted by anyone except themselves.

### Code to run (PowerShell):

```powershell
# Login as Resident
$resLogin = curl.exe -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"resident@cabantian.ph","password":"ResidentCabantian2025"}'
$resTok = ($resLogin | ConvertFrom-Json).accessToken

# Try to access admin-only analytics as resident → should get 403
curl.exe -s -w "`nHTTP %{http_code}`n" http://localhost:3001/api/analytics/summary -H "Authorization: Bearer $resTok"

# Login as Admin
$adminLogin = curl.exe -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@waste2goods.ph","password":"AdminCabantian2025"}'
$adminTok = ($adminLogin | ConvertFrom-Json).accessToken

# Same endpoint as admin → should get 200
curl.exe -s -w "`nHTTP %{http_code}`n" http://localhost:3001/api/analytics/summary -H "Authorization: Bearer $adminTok"

# View the full permission matrix
curl.exe -s http://localhost:3001/api/security/policy -H "Authorization: Bearer $adminTok"
```

### Where in code:
- File: `packages/backend/src/security/authorization.js`
- Key functions: `requirePermission()`, `requireOwnershipOrRole()`
- Example response for resident trying analytics:
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this resource",
  "code": "ACCESS_DENIED"
}
```

---

## Rate Limiting (Column G)

Waste2Goods has **8 rate-limit tiers** to stop abuse.

### The 8 Tiers

| Tier | Limit | What it protects |
|---|---|---|
| global | 1000 requests/minute | All requests per IP |
| auth | 10 attempts / 15 minutes | Login/register per IP |
| authFailure | 5 attempts / 5 minutes | Failed logins per email |
| write | 30 requests / minute | Write operations per user |
| analyticsHeavy | 60 requests / minute | Analytics queries per user |
| kiosk | 120 requests / minute | Kiosk API per user |
| oauthAuthorize | 30 requests / 5 minutes | OAuth authorize endpoint per IP |
| oauthToken | 60 requests / minute | OAuth token endpoint per IP |

Plus **progressive delay**: after 5 requests to the same endpoint, each request gets delayed by 250ms more, up to 3 seconds max.

### Demo 1: Account lockout (authFailure tier)

```powershell
# Make sure you already saved $resTok before running this!
1..6 | ForEach-Object {
  curl.exe -s -D - -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"resident@cabantian.ph","password":"WRONG_PASSWORD"}'
}
```

**What you'll see on the 6th attempt:**
```json
{
  "error": "Account login temporarily locked — 5 consecutive failures. Reset via email or try again in 5 minutes.",
  "code": "ACCOUNT_LOCKED"
}
```

**Response headers you'll see:**
```
HTTP/1.1 429 Too Many Requests
Retry-After: 300
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
```

### Demo 2: CSRF Origin block

```powershell
curl.exe -s -X POST http://localhost:3001/api/auth/login -H "Origin: https://evil.example" -H "Content-Type: application/json" -d '{"email":"a@b.co","password":"x"}'
```

**Response:**
```json
{
  "error": "CSRF blocked — Origin is not on the allowlist",
  "code": "CSRF_ORIGIN_DENIED",
  "origin": "https://evil.example"
}
```

**Why this works:** The backend checks the `Origin` header on POST/PUT/DELETE requests. If the origin is not `localhost`, `127.0.0.1`, or a local network IP, it's blocked. This stops evil websites from making API calls on behalf of logged-in users.

**Note:** `curl.exe` without an `Origin` header still works because it's not a browser.

### Demo 3: Global rate limit

```powershell
# Spam the server with 1001 requests in 1 minute
1..1001 | ForEach-Object {
  curl.exe -s -o NUL -w "%{http_code}" http://localhost:3001/api/health
}
```

The 1001st request should return `429`.

### Where in code:
- File: `packages/backend/src/security/rate-limit.js`
- CSRF file: `packages/backend/src/security/csrf.js`

---

## Redis Cache & CDN (Column H)

### What is Redis?

Redis is an in-memory database that stores data super fast. Waste2Goods uses it for:
1. **Caching API responses** (so the database isn't hit every time)
2. **Storing OAuth codes and refresh tokens**
3. **Rate-limit counters** (when Redis is running)

If Redis is off, everything falls back to in-memory JavaScript Maps. The app never crashes.

### Start Redis (Docker on Windows)

```powershell
# Start Redis
docker run -d -p 6379:6379 --name w2g-redis redis:alpine

# Verify it's running
docker ps
redis-cli ping
```

### Demo: API Cache MISS → HIT

```powershell
# First call: should be MISS (not cached)
curl.exe -s -D - http://localhost:3001/api/rewards -H "Authorization: Bearer $resTok" -o NUL

# Second call: should be HIT (cached in Redis)
curl.exe -s -D - http://localhost:3001/api/rewards -H "Authorization: Bearer $resTok" -o NUL

# Check cache stats
curl.exe -s http://localhost:3001/api/security/cache-stats -H "Authorization: Bearer $t"

# Check Redis connection status
curl.exe -s http://localhost:3001/api/security/redis-stats -H "Authorization: Bearer $t"
```

**What to look for in headers:**

First call:
```
X-W2G-Cache: MISS
Cache-Control: no-cache
```

Second call:
```
X-W2G-Cache: HIT
Cache-Control: public, max-age=30, s-maxage=60
Surrogate-Key: rewards
```

### Demo: CDN Static Assets

```powershell
# Check CDN headers for a static CSS file
curl.exe -s -D - http://localhost:3001/cdn/brand.css -o NUL
```

**What to look for:**
```
Cache-Control: public, max-age=31536000, immutable
CDN-Cache-Control: public, max-age=31536000, immutable
Surrogate-Key: static-assets
Surrogate-Control: max-age=31536000, stale-while-revalidate=86400
```

This means a CDN like Cloudflare or CloudFront could cache this file for 1 year at the edge.

### Where in code:
- Cache middleware: `packages/backend/src/security/cache.js`
- Redis client: `packages/backend/src/security/redis-client.js`
- CDN headers: `packages/backend/src/security/cdn.js`
- Static files: `packages/backend/public/cdn/`

---

## DevSecOps (Column I)

### Run the test suite

```powershell
# Run tests
npm test

# Run linting
npm run lint

# Run dependency audit (CI mode)
npm run audit:ci
```

### What to point at during the demo:

| Evidence | Where |
|---|---|
| Unit tests | `packages/backend/src/security/security.test.js` |
| ESLint config | `packages/backend/eslint.config.js` |
| CI workflow | `.github/workflows/ci.yml` |
| SonarQube config | `sonar-project.properties` |
| Helmet / Zod / bcrypt usage | `packages/backend/src/index-mysql.js`, `validate.js`, `auth-jwt.js` |

### What's in the CI workflow:

```yaml
# .github/workflows/ci.yml does:
# 1. Install dependencies
# 2. Run ESLint
# 3. Run tests (node:test)
# 4. Run npm audit (fail on high/critical vulnerabilities)
```

### Key security libraries used:

| Library | Purpose | Where |
|---|---|---|
| Helmet | Sets security headers (CSP, HSTS, etc.) | `index-mysql.js` |
| Zod | Validates all incoming data (15 schemas) | `validate.js` |
| bcrypt | Hashes passwords (10 rounds) | `auth-jwt.js` |
| express-rate-limit | 8-tier rate limiting | `rate-limit.js` |
| mysql2 | Parameterized queries (prevents SQLi) | Database routes |

---

## Quick Copy-Paste Cheat Sheet

### 1. Start everything

```powershell
# Terminal 1: XAMPP → Start MySQL

# Terminal 2: Start Redis
docker run -d -p 6379:6379 --name w2g-redis redis:alpine

# Terminal 3: Start backend
cd "c:\Users\USER\Downloads\Gamified Recycling Platform Prototype"
$env:REDIS_ENABLED = "true"
npm run dev:backend-mysql
```

### 2. Login as admin

```powershell
$login = curl.exe -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@waste2goods.ph","password":"AdminCabantian2025"}'
$t = ($login | ConvertFrom-Json).accessToken
```

### 3. Login as resident

```powershell
$resLogin = curl.exe -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"resident@cabantian.ph","password":"ResidentCabantian2025"}'
$resTok = ($resLogin | ConvertFrom-Json).accessToken
```

### 4. GitHub OAuth (browser)

```
http://localhost:3001/api/auth/github
```

### 5. Google OAuth (browser)

```
http://localhost:3001/api/auth/google
```

### 6. First-party OAuth (consent screen)

```
http://localhost:3001/api/oauth2/authorize?client_id=waste2goods-docs&redirect_uri=http://localhost:3001/api/oauth2/demo/callback&response_type=code&scope=profile:read&state=instructor-demo-12345&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256
```

### 7. Exchange code for token

```powershell
curl.exe -s -X POST http://localhost:3001/api/oauth2/token -H "Content-Type: application/json" -d '{"grant_type":"authorization_code","code":"PASTE_CODE","redirect_uri":"http://localhost:3001/api/oauth2/demo/callback","client_id":"waste2goods-docs","client_secret":"docs-demo-secret","code_verifier":"dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"}'
```

### 8. Introspect token

```powershell
curl.exe -s -X POST http://localhost:3001/api/oauth2/introspect -H "Content-Type: application/json" -d '{"token":"PASTE_ACCESS_TOKEN","client_id":"waste2goods-docs","client_secret":"docs-demo-secret"}'
```

### 9. Revoke token

```powershell
curl.exe -s -X POST http://localhost:3001/api/oauth2/revoke -H "Content-Type: application/json" -d '{"token":"PASTE_ACCESS_TOKEN","token_type_hint":"access_token","client_id":"waste2goods-docs","client_secret":"docs-demo-secret"}'
```

### 10. Test access control (resident 403)

```powershell
curl.exe -s -w "`nHTTP %{http_code}`n" http://localhost:3001/api/analytics/summary -H "Authorization: Bearer $resTok"
```

### 11. Test access control (admin 200)

```powershell
curl.exe -s -w "`nHTTP %{http_code}`n" http://localhost:3001/api/analytics/summary -H "Authorization: Bearer $t"
```

### 12. Test CSRF block

```powershell
curl.exe -s -X POST http://localhost:3001/api/auth/login -H "Origin: https://evil.example" -H "Content-Type: application/json" -d '{"email":"a@b.co","password":"x"}'
```

### 13. Test rate limit lockout

```powershell
1..6 | ForEach-Object {
  curl.exe -s -D - -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"email":"resident@cabantian.ph","password":"WRONG_PASSWORD"}'
}
```

### 14. Test cache MISS → HIT

```powershell
curl.exe -s -D - http://localhost:3001/api/rewards -H "Authorization: Bearer $resTok" -o NUL
curl.exe -s -D - http://localhost:3001/api/rewards -H "Authorization: Bearer $resTok" -o NUL
curl.exe -s http://localhost:3001/api/security/cache-stats -H "Authorization: Bearer $t"
curl.exe -s http://localhost:3001/api/security/redis-stats -H "Authorization: Bearer $t"
```

### 15. Test CDN headers

```powershell
curl.exe -s -D - http://localhost:3001/cdn/brand.css -o NUL
```

### 16. Run tests, lint, audit

```powershell
npm test
npm run lint
npm run audit:ci
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `401` on `/authorize` | Login first; send Bearer. Dashboard OAuth link does not attach a JWT. |
| `invalid_grant` | Code reused/expired or wrong `code_verifier`. |
| Rewards 401 | Send `$resTok` or `$t`. |
| CSRF 403 in Postman | Remove `Origin` header (or use `http://localhost:5173`). |
| Redis off | `REDIS_ENABLED=true` and restart. |
| Login lockout | Wait 5 min or keep using admin `$t`. |
| `npm run dev:backend-mysql` fails | Start XAMPP MySQL first. Check `.env` has `DB_HOST=127.0.0.1`. |
| `curl` commands fail in PowerShell | Use single quotes `'` around JSON instead of double quotes `"`. |

---

## Code Map

| Topic | File |
|---|---|
| First-party OAuth AS | `packages/backend/src/security/oauth2-server.js` |
| GitHub OAuth | `packages/backend/src/security/github-oauth.js` |
| Google OAuth | `packages/backend/src/security/google-oauth.js` |
| JWT / refresh / PKCE codes | `packages/backend/src/security/auth-jwt.js` |
| ABAC | `packages/backend/src/security/authorization.js` |
| Rate limits | `packages/backend/src/security/rate-limit.js` |
| CSRF Origin | `packages/backend/src/security/csrf.js` |
| Redis cache + API CDN headers | `packages/backend/src/security/cache.js` |
| Static CDN | `packages/backend/src/security/cdn.js`, `packages/backend/public/cdn/` |
| CI | `.github/workflows/ci.yml` |

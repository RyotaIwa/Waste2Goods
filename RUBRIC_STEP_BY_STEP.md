# Waste2Goods — Rubric Step-by-Step Instructor Presentation Guide (D2-P2)

This document provides the **exact step-by-step presentation flow** to demonstrate full compliance with all 5 scored rubric columns to your instructor.

---

## 📊 Summary of Rubric Alignment

| Rubric Column | Weight | Required Capabilities | Exact Demonstration Flow |
|---|---|---|---|
| **1. Authentication & OAuth Flow** | **25 pts** | DB bcrypt login + OAuth 2.0 Authorization Server (PKCE S256) + Google/GitHub OAuth | Section 2: Password Login ➡️ OAuth2 Authorization Server (PKCE) ➡️ Google & GitHub OAuth |
| **2. Access Control & Authorization** | **30 pts** | 6-role ABAC matrix, admin gating, resource ownership, barangay scoping | Section 3: `/api/security/policy` ➡️ Admin 200 vs Resident 403 ➡️ Ownership protection |
| **3. Threat Mitigation & Rate Limiting** | **30 pts** | 8-tier rate limiting + progressive delay + lockout + CSRF origin guard + SQLi/XSS defense | Section 4: 6x Bad Password Lockout (429) ➡️ CSRF Evil Origin (403) ➡️ Zod/SQLi parameterization |
| **4. Availability, Caching & CDN** | **50 pts** | 3-tier cache (L1 Response ➡️ L2 Redis ➡️ L3 CDN), immutable static headers, MySQL DB tasks | Section 5: `/api/rewards` cache ➡️ `/cdn/brand.css` headers ➡️ `/api/tasks` from MySQL |
| **5. Code Quality & DevSecOps** | **30 pts** | Automated unit tests, ESLint, CI workflow, dependency vulnerability audits | Section 6: `npm test` (8/8 pass) ➡️ `npm run lint` (0 errors) ➡️ GitHub Actions CI review |

---

## ⚡ Quick 5-Second Automated Proof (For Instructor)

If the instructor wants immediate proof of all 10 rubric checks at once, run:

```powershell
cd "c:\Users\USER\Downloads\Gamified Recycling Platform Prototype\packages\backend"
node test-e2e.mjs
```

**Expected Output:**
```
🚀 Running Comprehensive E2E Verification against Waste2Goods backend...

✅ [E1] Admin Login (DB bcrypt): PASS (userId=A-001, name="Juan Reyes")
✅ [E2] Resident Login (DB bcrypt): PASS (userId=U-010, name="Maria Santos")
✅ [E3] Kiosk Login (DB lookup): PASS (kioskId=K-001, role=kiosk)
✅ [F1] ABAC Admin Policy Access: PASS (200 OK, roles=6, resources=11)
✅ [F2] ABAC Resident Policy Blocked: PASS (403 Forbidden)
✅ [H1] Tasks MySQL Endpoint: PASS (5 tasks returned from DB)
✅ [H2] Rewards 3-tier Cache: PASS
✅ [H3] CDN Static Headers: PASS (Cache-Control="public, max-age=31536000, immutable", Surrogate-Key="static-assets w2g-cdn")
✅ [G1] CSRF Evil Origin Block: PASS (403 Forbidden)
✅ [E4] Google OAuth Status: PASS (configured=true)

🎉 ALL 10 E2E RUBRIC TESTS PASSED GREEN!
```

---

## 🚀 Live Step-by-Step Instructor Walkthrough

### Step 1 — Start Services

1. **Start MySQL in XAMPP:**
   - Open **XAMPP Control Panel** ➡️ Click **Start** for **Apache** and **MySQL**.
2. **Start Backend Server:**
   ```powershell
   cd "c:\Users\USER\Downloads\Gamified Recycling Platform Prototype\packages\backend"
   node src/index-mysql.js
   ```
   *Verify output displays:* `🚀 Waste2Goods API Server running at http://localhost:3001`
3. **Open Security Dashboard in Browser:**
   - Navigate to: [http://localhost:3001/security-dashboard](http://localhost:3001/security-dashboard)

---

### Step 2 — Column 1: Authentication & OAuth Flow (25 pts)

**Talking Point:** *"Waste2Goods acts as its own RFC 6749 / RFC 7636 Authorization Server (issuing JWT access tokens and rotating refresh tokens with PKCE), while also integrating external social Identity Providers (Google and GitHub)."*

#### 2.1 Password Login (DB bcrypt)
In PowerShell:
```powershell
$adminLogin = Invoke-RestMethod -Method Post "http://localhost:3001/api/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"admin@waste2goods.ph","password":"AdminCabantian2025"}'
$adminTok = $adminLogin.accessToken
Write-Host "✅ Admin Access Token received: $adminTok"

$resLogin = Invoke-RestMethod -Method Post "http://localhost:3001/api/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"resident@cabantian.ph","password":"ResidentCabantian2025"}'
$resTok = $resLogin.accessToken
Write-Host "✅ Resident Access Token received: $resTok"
```

#### 2.2 OAuth 2.0 Authorization Server Discovery & Registered Clients
Show in browser or terminal:
- Discovery: [http://localhost:3001/api/oauth2/.well-known/oauth-authorization-server](http://localhost:3001/api/oauth2/.well-known/oauth-authorization-server)
- Registered Clients: [http://localhost:3001/api/oauth2/clients](http://localhost:3001/api/oauth2/clients)

#### 2.3 PKCE S256 Authorization Code Flow
1. Open Consent Screen in Browser:
   [http://localhost:3001/api/oauth2/authorize?client_id=waste2goods-docs&redirect_uri=http://localhost:3001/api/oauth2/demo/callback&response_type=code&scope=profile:read&state=demo-state&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256](http://localhost:3001/api/oauth2/authorize?client_id=waste2goods-docs&redirect_uri=http://localhost:3001/api/oauth2/demo/callback&response_type=code&scope=profile:read&state=demo-state&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256)
2. Click **Allow** ➡️ Automatically redirects to callback and issues an authorization code.
3. Token Exchange via PKCE `code_verifier`:
   ```powershell
   $tokenExchange = Invoke-RestMethod -Method Post "http://localhost:3001/api/oauth2/token" `
     -ContentType "application/json" `
     -Body '{"grant_type":"authorization_code","code":"<PASTE_CODE_FROM_URL>","redirect_uri":"http://localhost:3001/api/oauth2/demo/callback","client_id":"waste2goods-docs","client_secret":"docs-demo-secret","code_verifier":"dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"}'
   Write-Host "✅ OAuth2 Access Token: $($tokenExchange.access_token)"
   ```

#### 2.4 Social Logins (Google & GitHub)
- **Google OAuth:** Navigate to [http://localhost:3001/api/auth/google](http://localhost:3001/api/auth/google) in browser.
- **GitHub OAuth:** Navigate to [http://localhost:3001/api/auth/github](http://localhost:3001/api/auth/github) in browser.

---

### Step 3 — Column 2: Access Control & Authorization (30 pts)

**Talking Point:** *"We implement Attribute-Based Access Control (ABAC) defining permissions across 6 roles and 11 platform resources, with strict resource ownership and barangay boundaries."*

#### 3.1 Policy Matrix Endpoint
```powershell
Invoke-RestMethod -Headers @{Authorization="Bearer $adminTok"} "http://localhost:3001/api/security/policy"
```
*Returns 6 roles (`super_admin`, `admin`, `barangay_admin`, `resident`, `kiosk`, `anon`) and 11 resources.*

#### 3.2 Admin Allowed vs. Resident Blocked (403)
```powershell
# Admin can access security policy (Expect 200 OK)
$adminPol = Invoke-RestMethod -Headers @{Authorization="Bearer $adminTok"} "http://localhost:3001/api/security/policy"
Write-Host "✅ Admin access: HTTP 200 OK"

# Resident CANNOT access security policy (Expect 403 Forbidden)
try {
  Invoke-RestMethod -Headers @{Authorization="Bearer $resTok"} "http://localhost:3001/api/security/policy" -ErrorAction Stop
} catch {
  Write-Host "✅ Resident blocked: HTTP $($_.Exception.Response.StatusCode.value__) Forbidden"
}
```

---

### Step 4 — Column 3: Threat Mitigation & Rate Limiting (30 pts)

**Talking Point:** *"We protect the system with an 8-tier rate limiting architecture, progressive delay penalties, email-scoped brute force lockouts, strict CSRF origin validation, and parameterized SQL queries to eliminate SQL injection."*

#### 4.1 6x Bad Password Brute Force Lockout
```powershell
1..6 | ForEach-Object {
  try {
    Invoke-RestMethod -Method Post "http://localhost:3001/api/auth/login" `
      -ContentType "application/json" `
      -Body '{"email":"resident@cabantian.ph","password":"WRONG_PASSWORD"}' -ErrorAction Stop
  } catch {
    Write-Host "Attempt $_ : HTTP $($_.Exception.Response.StatusCode.value__)"
  }
}
```
*Attempt 6 triggers `429 Too Many Requests` (Account locked for 5 minutes).*

#### 4.2 CSRF Origin Guard
```powershell
try {
  Invoke-RestMethod -Method Post -Headers @{Origin="https://evil.example"} `
    "http://localhost:3001/api/auth/login" `
    -ContentType "application/json" `
    -Body '{"email":"a@b.com","password":"x"}' -ErrorAction Stop
} catch {
  Write-Host "✅ CSRF Blocked: HTTP $($_.Exception.Response.StatusCode.value__) CSRF_ORIGIN_DENIED"
}
```

---

### Step 5 — Column 4: Availability, Caching & CDN (50 pts)

**Talking Point:** *"We implement a 3-tier caching model (In-Memory ➡️ Redis ➡️ CDN headers) and deliver static assets with 1-year immutable caching and Surrogate-Key headers."*

#### 5.1 Dynamic MySQL-Backed Tasks
```powershell
$tasks = Invoke-RestMethod -Headers @{Authorization="Bearer $resTok"} "http://localhost:3001/api/tasks"
Write-Host "✅ Tasks returned from MySQL recycling_tasks: $($tasks.Count)"
```

#### 5.2 3-Tier Cache & Statistics
```powershell
Invoke-RestMethod -Headers @{Authorization="Bearer $adminTok"} "http://localhost:3001/api/security/cache-stats"
Invoke-RestMethod -Headers @{Authorization="Bearer $adminTok"} "http://localhost:3001/api/security/redis-stats"
```

#### 5.3 CDN Static Asset Caching
```powershell
$cdn = Invoke-WebRequest "http://localhost:3001/cdn/brand.css"
Write-Host "Cache-Control: $($cdn.Headers['Cache-Control'])"
Write-Host "Surrogate-Key: $($cdn.Headers['Surrogate-Key'])"
```
*Expected `Cache-Control: public, max-age=31536000, immutable` and `Surrogate-Key: static-assets w2g-cdn`.*

---

### Step 6 — Column 5: Code Quality & DevSecOps (30 pts)

**Talking Point:** *"Our project follows modern DevSecOps standards with automated unit tests, strict ESLint rules, automated dependency vulnerability audits, and GitHub Actions CI pipelines."*

#### 6.1 Unit Tests (100% Pass)
```powershell
npm test
```
*Output: 8/8 tests pass (ABAC, PKCE RFC 7636, CSRF allowlist & blocker, CDN headers, Zod schemas).*

#### 6.2 Linter
```powershell
npm run lint
```
*Output: 0 errors, 0 warnings.*

#### 6.3 CI Pipeline & SonarQube
Show the files to the instructor:
- `.github/workflows/ci.yml` — Automated CI testing, linting, and vulnerability scanning.
- `sonar-project.properties` — Code quality & complexity analysis config.
- `packages/backend/src/security/validate.js` — Zod schema validation against malicious payloads.

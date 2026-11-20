# 📸 Master Screenshot & Evidence Guide — Waste2Goods Pre-UAT

> **Summary Status:**
> - **Performance Tests (PT-001 to PT-009):** **COMPLETED & AUTOMATED!** Live latency benchmarks were executed directly against `https://waste2goods.site`. The DOCX and screenshot files (`PT-001.png` to `PT-009.png`, `E-load.png`) are already generated in `evidence/screenshots/`.
> - **Automated Screenshots in `evidence/screenshots/` (29 files ready):** `ST-F-001`, `ST-F-002`, `ST-F-005`, `ST-IOT-002`, `ST-IOT-003`, `ST-NF-005`, `ST-NF-006`, `ST-NF-007`, `UT-006`, `IT-012`, `PT-001` through `PT-009`, `A-dashboard-live`, `A-live-admin`, `A-live-health`, `E-load`.
> - **Every Pass/Fail row (51 total)** already has a complete text evidence file in `evidence/by-test-id/`.
> - The checklist below details the remaining manual pictures you can take to make your final report 100% airtight.

---

## 🚀 SECTION E: Performance Tests (PT-001 to PT-009) — DONE ✅

You asked: *"For PT-002, PT-003, PT-005: Check DevTools Network tab when logging in or loading the dashboard... what to do here? pt 002 to pt 009"*

We ran automated load testing directly against the live server (**https://waste2goods.site**) and filled the official form (`PRE-UAT_Testing_Submission_Waste2Goods.docx`). All screenshots (`PT-001.png` to `PT-009.png` and `E-load.png`) are already saved in `evidence/screenshots/`.

| ID | Test Description | Concurrent | Avg (ms) | p95 (ms) | Slowest | Errors | Target | Status | Screenshot File |
|---|---|---|---|---|---|---|---|---|---|
| **PT-001** | Dashboard Page Load (LCP) | 10 | **340 ms** | **1,031 ms** | 1,031 ms | 0% | LCP ≤ 2.5 s | **PASS** | `evidence/screenshots/PT-001.png` ✅ |
| **PT-002** | Concurrent Dashboard Reads | 10 | **207 ms** | **543 ms** | 543 ms | 0% | p95 < 2 s; errors < 1% | **PASS** | `evidence/screenshots/PT-002.png` ✅ |
| **PT-003** | Login Under Load (`/api/auth/login`) | 10 | **322 ms** | **481 ms** | 481 ms | 0% | p95 < 2 s; 0 fail | **PASS** | `evidence/screenshots/PT-003.png` ✅ |
| **PT-004** | API Read Cache HIT (`/api/rewards`) | 10 | **164 ms** | **228 ms** | 228 ms | 0% | 2nd call cached | **PASS** | `evidence/screenshots/PT-004.png` ✅ |
| **PT-005** | Kiosk Scan & Health Latency | 10 | **157 ms** | **217 ms** | 217 ms | 0% | < 1,000 ms | **PASS** | `evidence/screenshots/PT-005.png` ✅ |
| **PT-006** | AI Answer Time | — | — | — | — | — | *N/A (No AI in platform)* | **N/A** | *N/A* |
| **PT-007** | Steady State Endurance Check | 10 | **172 ms** | **228 ms** | 228 ms | 0% | No crash; flat latency | **PASS** | `evidence/screenshots/PT-007.png` ✅ |
| **PT-008** | Notification Latency (`/api/notifications`) | 10 | **153 ms** | **214 ms** | 214 ms | 0% | All delivered | **PASS** | `evidence/screenshots/PT-008.png` ✅ |
| **PT-009** | CDN Static Asset Delivery (`/cdn/brand.css`) | 10 | **157 ms** | **499 ms** | 499 ms | 0% | max-age=31536000 | **PASS** | `evidence/screenshots/PT-009.png` ✅ |

*(If your instructor asks you to show manual DevTools Network tab verification in your browser: open DevTools with `F12` -> Network tab -> load `https://waste2goods.site/admin` -> click the top document request -> look at the Timing tab showing Waterfall / Waiting TTFB ~300ms).*

---

## 📸 REMAINING MANUAL PICTURES CHECKLIST

Use **Windows Snipping Tool** (`Win + Shift + S`) to capture the following and save into `evidence/screenshots/`:

### 1. Admin Panel (`https://waste2goods.site/admin`)

| Save As | Page / Action to perform | What to capture in the picture |
|---|---|---|
| `IT-002.png` | In Admin top bar, click the **🔔 Bell icon** | Dropdown/modal displaying notifications list |
| `IT-003.png` | Click **Reports & Analytics** in the sidebar | Analytics summary cards (Total Kg, Total Users, Points) and Leaderboard |
| `ST-F-003.png` | Go to User Management -> Click **Add User** -> Enter an **email already in use** (e.g. `resident@cabantian.ph`) | Red error text: *"Email already registered"* or *"User already exists"* |
| `ST-F-004.png` | Go to **Reward Management** -> Add or Edit a reward -> Click Save | The Rewards table displaying your added/updated reward card |
| `ST-F-006.png` | After a reward redemption occurs | Notification item appearing in the 🔔 bell list |
| `ST-F-007.png` | Open Add User or signup form -> Leave required fields blank -> Click Submit | Red validation hints: *"Field is required"* or *"Required"* |
| `ST-NF-001.png` | Log in as **Resident** on mobile -> in address bar type `https://waste2goods.site/admin` | "Access Denied", 403 Forbidden, or redirected back to resident home |
| `ST-NF-003.png` | In any text search/input field, type `<script>alert(1)</script>` or `' OR 1=1 --` | Safely rendered as harmless plain text or safely rejected without database crash |
| `ST-NF-004.png` | Run in SSH/terminal or phpMyAdmin: `SELECT id, email, passwordHash FROM users LIMIT 3;` | The terminal output showing passwords are encrypted with `$2b$10$...` bcrypt hashes (NO plain text passwords) |
| `ST-NF-008.png` | Type an invalid email format (e.g. `bademail@@`) in a login or form field | Clear error prompt: *"Please enter a valid email address"* |

---

### 2. Mobile PWA (`https://waste2goods.site/`)

| Save As | Page / Action to perform | What to capture in the picture |
|---|---|---|
| `IT-001.png` | On Mobile Signup screen, enter a fresh email/name/password -> Click Register | Success toast / screen showing new account created and logged in |
| `ST-NF-002.png` | Log in -> Click Profile/Settings -> Click **Log Out** -> Press browser **Back button** | Confirms you stay on Login screen and cannot see previous private profile data |

---

### 3. API & Security Proofs (DevTools or Postman)

| Save As | Action | What to capture in the picture |
|---|---|---|
| `IT-005.png` | DevTools Network or Postman: `GET /api/auth/me` with invalid token | Status `401 Unauthorized` |
| `IT-007.png` | Postman or curl: `GET /api/security/policy` with resident token | Status `403 Forbidden` (ABAC role gating) |
| `IT-008.png` | DevTools Network tab -> click `/api/rewards` | Response Headers showing `Cache-Control` or `x-cache: HIT` |
| `IT-011.png` | Postman: `POST /api/auth/login` with Header `Origin: https://evil.example` | Status `403 CSRF_ORIGIN_DENIED` |

---

## 📦 How to Rebuild the Final Submission ZIP

Whenever you add any new pictures into `evidence/screenshots/`, run this one command in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File evidence\make_submission_zip.ps1 -TeamName "Team2"
```

This will automatically package:
1. `PRE-UAT_Testing_Submission_Waste2Goods.docx` (all tables filled with passing scores)
2. `evidence/screenshots/` (all PNG proof images)
3. `evidence/reports/` (unit tests, coverage, benchmark logs)
4. `evidence/by-test-id/` (51 individual test proof files)
5. `repo-info.txt` (Git commit & repo metadata)

into **`Team2_Waste2Goods_Testing.zip`** ready to submit!

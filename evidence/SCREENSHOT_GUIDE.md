# Evidence / Screenshot Guide — Waste2Goods Pre-UAT

The submission checklist requires: **"Every Pass or Fail row has an evidence file, and the file
is in the folder."** This guide tells you exactly which screenshot to take for each test ID,
and how to save it with the right filename.

**Save everything into `evidence/screenshots/`**, named **`<TEST-ID>.png`** (e.g. `UT-001.png`).
Tool reports (c8 coverage, `node --test` output) go into `evidence/reports/`.

---

## STEP 0 — Start the stack first (nothing to screenshot until this is done)

Right now MySQL (:3306) and all app ports are **down**. Open these in order:

1. **XAMPP Control Panel** (`C:\xampp\xampp-control.exe`) → **Start** *Apache* and *MySQL*.
   - In a browser open `http://localhost/phpmyadmin`, create/select DB **`waste2goods`**,
     then **Import** `packages/backend/database/schema-mysql.sql`.
2. **Terminal 1 — Backend**
   ```powershell
   cd "c:\Users\USER\Downloads\Gamified Recycling Platform Prototype\packages\backend"
   node src/index-mysql.js
   ```
   Wait for: `🚀 Waste2Goods API Server running at http://localhost:3001`
3. **Terminal 2 — Admin Panel**  → open <http://localhost:5174>
   ```powershell
   cd "c:\Users\USER\Downloads\Gamified Recycling Platform Prototype\packages\admin-panel"
   npm run dev
   ```
4. **Terminal 3 — Mobile App (PWA)** → open <http://localhost:5173>
   ```powershell
   cd "c:\Users\USER\Downloads\Gamified Recycling Platform Prototype\packages\mobile-app"
   npm run dev
   ```
5. **Terminal 4 — Kiosk App** → open <http://localhost:5175>
   ```powershell
   cd "c:\Users\USER\Downloads\Gamified Recycling Platform Prototype\packages\kiosk-app"
   npm run dev
   ```

**Credentials (from RUN_GUIDE.md):**

| Role | Email / ID | Password / PIN | App |
|---|---|---|---|
| Admin | `admin@waste2goods.ph` | `AdminCabantian2025` | Admin Panel :5174 |
| Resident | `resident@cabantian.ph` | `ResidentCabantian2025` | Mobile :5173 |
| Kiosk | PIN `7890` | `7890` | Kiosk :5175 |

---

## STEP 1 — Two ways to capture

### Option A — Manual (zero install) ✅ recommended for a submission
Use **Windows Snipping Tool**: press **`Win + Shift + S`**, drag over the area, then paste
(`Ctrl+V`) into Paint / or click the toast → **Save as PNG**. Name each file by its test ID.

> Tip: capture the **whole window including the URL bar and the clock** so the evidence shows
> which screen and when. For "error" tests, capture the red error message too.

### Option B — Automated (optional, needs Playwright)
See `capture_evidence.mjs` in this folder. One-time install:
```powershell
cd "c:\Users\USER\Downloads\Gamified Recycling Platform Prototype"
npm i -D playwright
npx playwright install chromium
node evidence\capture_evidence.mjs
```
It logs into each app and saves `UT-001.png`, `ST-F-001.png`, … automatically.

---

## STEP 2 — Shot list (test ID → what to show → filename)

### Section A — context
| File | What to capture |
|---|---|
| `A-servers.png` | All terminals showing the 4 servers running |
| `A-dashboard-live.png` | `http://localhost:3001/security-dashboard` open |

### Section B — Unit tests (evidence = test output, plus UI where noted)
These are mostly **tool-report** evidence, not screenshots. Save into `evidence/reports/`:
| File | How to produce |
|---|---|
| `reports/unit-test-output.txt` | `node --test src/security/security.test.js` in backend → copy the `# pass 13` output |
| `reports/coverage.txt` | `npm run test:coverage` at repo root → copy the summary (35.6%) |
| `UT-006.png` | Admin login with a **wrong password** → red "Invalid credentials" toast |
| `UT-004.png` | Registration form with `<script>alert('XSS')</script>` in the name field, then show it stored as plain text |

### Section C — Integration tests
| File | What to capture |
|---|---|
| `IT-001.png` | Mobile "Create Account" → success + new user logged in |
| `IT-002.png` | Admin bell icon showing notifications list |
| `IT-003.png` | Admin Analytics page with totals + leaderboard |
| `IT-005.png` | `GET /api/auth/me` with valid token (200) in Postman/curl |
| `IT-007.png` | Admin opens `/api/security/policy` (200, roles=6) then resident gets 403 |
| `IT-008.png` | DevTools → Network → `/api/rewards` twice, show `x-cache: MISS` then `HIT` |
| `IT-009.png` | DevTools → Response headers of `/cdn/brand.css` (Cache-Control + Surrogate-Key) |
| `IT-011.png` | Postman POST `/api/auth/login` with `Origin: https://evil.example` → 403 |

### Section D — System tests
**D1 Functional**
| File | What to capture |
|---|---|
| `ST-F-001.png` | Admin dashboard after admin login |
| `ST-F-002.png` | Mobile registration success + points balance showing +50 |
| `ST-F-003.png` | Registering with an existing email → "Email already registered" |
| `ST-F-004.png` | Admin Rewards list (create/edit/delete reflected) |
| `ST-F-005.png` | Admin Analytics/Report screen |
| `ST-F-006.png` | New redemption → admin notification appears |
| `ST-F-007.png` | Submit a form with blank required fields → validation errors |
| `ST-F-008.png` | Type `<script>alert(1)</script>` in a text field → shown as plain text |

**D4 Non-functional**
| File | What to capture |
|---|---|
| `ST-NF-001.png` | Resident typing the admin URL `/api/security/policy` → 403 Forbidden |
| `ST-NF-002.png` | After logout, press browser **Back** → login screen (no private data) |
| `ST-NF-003.png` | `<script>alert(1)</script>` and `' OR 1=1 --` in a form → plain text / rejected, no error |
| `ST-NF-004.png` | phpMyAdmin `users` table → `passwordHash` column (no plaintext), + `.env` git-ignored |
| `ST-NF-005.png` | 6 wrong-password attempts → 429 "Account locked" |
| `ST-NF-007.png` | Mobile PWA open on a phone (or responsive view) |
| `ST-NF-008.png` | Blank form / wrong value → clear error message |

### Section E — Performance
| File | What to capture |
|---|---|
| `E-load.png` | Terminal running `node test-e2e.mjs` (all 10 green) — baseline timing |
| `PT-004.png` | DevTools timing for cached `/api/rewards` |
| `PT-009.png` | Response headers of `/cdn/brand.css` (immutable cache) |
| `PT-001/002/003/005/007/008.png` | Output of your load tool (autocannon/k6/Lighthouse) with p95 numbers |

### Section G — Results
| File | What to capture |
|---|---|
| `G-coverage.png` | `coverage/lcov-report/index.html` opened in browser (35.6%) |
| `G-ready.png` | This summary table + `node test-e2e.mjs` green run |

---

## STEP 3 — Final ZIP (form Section H)
```
[TeamName]_Waste2Goods_Testing.zip
├── PRE-UAT_Testing_Submission_Waste2Goods.docx
├── evidence/
│   ├── screenshots/   (one <TEST-ID>.png per Pass/Fail row)
│   └── reports/       (unit-test-output.txt, coverage.txt, load reports)
└── repo-info.txt      (repo URL + commit 4e2f06f)
```

**Checklist reminder:** no passwords/keys/personal data visible in any screenshot. Crop or blur
if needed. Every Pass/Fail row in the DOCX must have a matching file in `screenshots/`.


---

## ✅ STATUS — evidence already captured for you (auto-generated)

While preparing this, I started the full stack (MySQL + backend + all 3 SPAs), fixed the
demo-login issue (see note below), and **automatically captured** the following real files.
They are already in `evidence/` — you can use them directly or re-capture anytime.

### Screenshots already captured (`evidence/screenshots/`)
| File | Shows | Test ID |
|---|---|---|
| `A-dashboard-live.png` | DevSecOps / OAuth 2.0 hardened dashboard (live, rubric scores) | A |
| `ST-F-001a-login-screen.png` | Admin login screen | ST-F-001 |
| `UT-006-wrong-password.png` | Wrong-password error on admin login | UT-006 |
| `ST-NF-005-brute-force-lockout.png` | Brute-force lockout after repeated bad logins | ST-NF-005 |
| `ST-F-001-admin-dashboard.png` | Admin dashboard with live data (12,450 kg, 19 residents, 284.5K pts) | ST-F-001 |
| `ST-F-005-admin-analytics.png` | Admin analytics / reports screen | ST-F-005 |
| `ST-F-002-mobile-home.png` | Mobile PWA onboarding/home | ST-F-002 |
| `ST-IOT-003-kiosk-scan.png` | Kiosk scan-to-sign-in screen | ST-IOT-003 |

### Reports already captured (`evidence/reports/`)
| File | Contents |
|---|---|
| `unit-test-output.txt` | `node --test` output — **13/13 pass** |
| `e2e-output.txt` | `node test-e2e.mjs` — **all 10 E2E checks green** |
| `api-evidence.txt` | Live API transcript: admin/resident/kiosk login 200, resident→policy 403, invalid token 401, evil-origin 403, CDN immutable headers, cache headers |

### Still manual (needs a live action you perform)
These need you to click through the app — see the shot list above:
`IT-001, IT-002, IT-003, ST-F-003, ST-F-004, ST-F-006, ST-F-007, ST-F-008, ST-NF-001..004, ST-NF-007, ST-NF-008`,
and the performance runs `PT-001/002/003/005/007/008`.

---

## 🔑 Important — demo login fix I applied (so your screenshots work)

**Problem:** the documented demo passwords (`AdminCabantian2025` / `ResidentCabantian2025`)
did **not** match the password hashes in your live database, so every login (and every
login-based test) returned **401 "Invalid credentials."** Kiosk PIN login also failed because
`KIOSK_PIN` was unset in `packages/backend/.env`.

**Fix (already applied):**
1. Added to `packages/backend/.env`:
   ```
   ADMIN_PASSWORD=AdminCabantian2025
   RESIDENT_PASSWORD=ResidentCabantian2025
   KIOSK_PIN=7890
   ```
   The backend seeder (`SEED_DEMO_DATA=true`) re-syncs the two demo accounts (A-001 admin and
   U-010 resident) to these exact passwords on every boot, so logins are now reproducible.
2. Restarted the backend. Verified: admin, resident, and kiosk logins all return 200 with a JWT.

Your real imported users (jq@gmail.com, etc.) were **not** touched. If you deploy publicly,
set `SEED_DEMO_DATA=false` and use strong passwords (see DEPLOYMENT.md).

> Note: the seeder re-randomizes demo password hashes on each boot unless `ADMIN_PASSWORD` /
> `RESIDENT_PASSWORD` are set — that is why the `.env` values above are the durable fix.


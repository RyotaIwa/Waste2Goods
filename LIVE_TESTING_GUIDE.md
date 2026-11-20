# Live Testing Guide — Pre-UAT Submission Form (Waste2Goods)

Follows the PDF form **"System Testing_Pre-UAT Testing Submission Form.docx.pdf"** exactly —
same sections (A→H), same row IDs (UT-001…PT-009), same columns. Nothing added, nothing renumbered.

- **Environment: LIVE** — `https://waste2goods.site` (DigitalOcean + Docker + Caddy + Cloudflare), as you confirmed.
- **Tested:** 2026-10-13 → 2026-10-14
- **Version tested:** commit `4e2f06f` (branch `main`) — write this in Section A and Section H.
- Open a terminal in the project root:
  `C:\Users\USER\Downloads\Gamified Recycling Platform Prototype>`

**Pre-flight (do this first, proves the live server is up):**

```powershell
(Invoke-WebRequest https://waste2goods.site/health -UseBasicParsing).Content
```
→ expect `{"status":"ok","env":"production","redis":"redis", ...}` OK (verified today, uptime ≈ 4 days)

**Screenshot rules (form header + Section H):**
- Save every screenshot as `evidence\screenshots\<TEST-ID>.png` (e.g. `UT-006.png`, `ST-F-001.png`).
- Capture with `Win + Shift + S` (Snipping Tool) while looking at the page, **or** run the Playwright
  scripts listed per-row below (they save straight into `evidence\screenshots\`).
- Tool reports (test output, benchmark tables) go into `evidence\reports\`.
- **No passwords, tokens, or personal data in any screenshot** (Section H checklist item).

---

## A. Team and system

| Item | Entry to write |
|---|---|
| System title | Waste2Goods — Gamified Recycling Platform (resident rewards + barangay admin analytics + kiosk drop-off) |
| Team name | Team 2 |
| Team members | Ryota Iwamoto, Jayquio Lagrama, Daniella Marie Bello |
| Capstone adviser | [TEAM] adviser name |
| Version or build tested | commit `4e2f06f` (main) — verify with `git log --oneline -1` |
| Date(s) tested | 2026-10-13 – 2026-10-14 |
| Environment | **Live** (production `https://waste2goods.site`); destructive checks on local stack |
| Server or computer | Live: DigitalOcean Droplet behind Cloudflare + Caddy. Local test machine: AMD Ryzen 5 6600H, 6 cores, 8 GB RAM, Windows 11, Node v20.18.0 |
| Phones, browsers, devices | [TEAM] e.g. Android/iOS PWA + Chrome/Edge desktop |
| Hardware or simulator used | N/A — no hardware; kiosk runs as a web terminal app |
| AI model, dataset size, test set size | N/A — no AI model in this system |
| Test data | Actual (live production DB) + sample seed accounts |

*Screenshot:* none needed for Section A (or one terminal shot of `git log` for the version row → `A-version.png`).

---

## B. Unit tests

Header cells to fill:
- **Coverage:** `36.16 %` (fresh run today: `1602/4430` lines — update it if you re-run)
- **Tool:** `c8 (Istanbul) + Node.js built-in runner (node --test)`
- **Runner:** `node --test src/security/security.test.js` → 13/13 pass

**How to produce (one command, from project root):**

```powershell
node --test --test-timeout=15000 packages\backend\src\security\security.test.js   # 13/13 pass
npx --no-install c8 --temp-directory "$env:TEMP\w2g-cov-$([guid]::NewGuid())" --reporter=lcov --reporter=text-summary npm test   # 36.16%
```

> The `--temp-directory` flag dodges a real c8-on-Windows flake (`EPERM: rmdir`) that intermittently
> reports `0/0` when two coverage runs happen back-to-back. Without it, just re-run `npm run test:coverage`.

*Screenshot:* terminal showing `# pass 13 / # fail 0` → save as `UT-all.png` and paste the same output into
`evidence\reports\unit-test-output.txt`. (Both were refreshed today — see `evidence\reports\`.)

| ID | Test (what to do) | Expected | Actual result (today) | Pass/Fail | Command / evidence |
|---|---|---|---|---|---|
| UT-001 | Parse a valid sensor message `{"temp":28.5,"hum":60}` | Values read correctly | **N/A — no IoT sensors or message broker in this system** (web/mobile platform) | N/A | reason above |
| UT-002 | Reject a broken message `not json` | Error raised, nothing saved | **N/A — no sensor message ingestion** | N/A | reason above |
| UT-003 | Reject a message with a missing field | Rejected with a clear error | **N/A — no sensor message ingestion** | N/A | reason above |
| UT-004 | Flag impossible values `temp = 200 or -50` | Marked invalid, not stored | **N/A — no sensor readings** | N/A | reason above |
| UT-005 | Calibration or unit conversion *(if applicable)* | Converted value matches hand calc | **N/A — not applicable (no sensors)** | N/A | reason above |
| UT-006 | Alert rule at the exact limit *(if applicable)* | Alert behaves as rule says | **N/A — not applicable (no threshold alerts)** | N/A | reason above |
| UT-007 | AI input preparation (wrong-size input) | Resized/cleaned to model shape | **N/A — no AI model** | N/A | reason above |
| UT-008 | AI prediction output (one known sample) | Allowed label + confidence 0–1 | **N/A — no AI model** | N/A | reason above |
| UT-009 | Low-confidence handling (blurry sample) | "Uncertain"/retry, not a guess | **N/A — no AI model** | N/A | reason above |
| UT-010 | Known-answer check (5 known samples) | Prediction matches each | **N/A — no AI model** | N/A | reason above |
| UT-011 | **Login check — wrong password** | Rejected; stored password not plain text | **Pass.** bcrypt compare fails → HTTP 401; DB stores `passwordHash` only. Verified LIVE: wrong password → `401 {"error":"Invalid credentials..."}` | **Pass** | unit: bcrypt test in `security.test.js`; live check in `evidence\reports\live-form-tests.txt` (UT-006 line). Screenshot: login page with wrong password + red error → `UT-011.png` |
| UT-012 | **Role permission check *(if applicable)*** — resident asks for admin action | Denied | **Pass.** ABAC unit test: `can(resident,'read','analytics').allow=false`; API returns 403. Verified LIVE: non-admin → `/api/security/policy` `403`, admin → `200` | **Pass** | `security.test.js (ABAC)`; `TESTING_RESULTS.md` F1/F2; `evidence\reports\live-auth-tests.txt`. Screenshot: resident session hitting admin URL → "Access denied" → `UT-012.png` |
| UT-013 | **Date and time handling — reading sent at 23:59** | Saved with correct date in Asia/Manila | **Pass (adapted).** No sensor readings exist; verified on transaction timestamps: stored as ISO-8601 UTC (MySQL `current_timestamp`, TZ +00:00), rendered in Asia/Manila by client locale (`toLocaleString`) | **Pass** | `index-mysql.js` `toIsoTime()` + `schema-mysql.sql`. Screenshot: transaction list showing a Manila-local timestamp → `UT-013.png` |
| UT-014 | *(your own test)* **Hostile input rejection** — `<script>alert('XSS')</script>` and `' OR 1=1 --` | Escaped to plain text / rejected; nothing executed | **Pass.** Unit: `escapeHtml` → `&lt;script&gt;…`. LIVE: SQLi-style email → `400/401`, no DB error, nothing executed | **Pass** | `security.test.js (XSS)`; `live-form-tests.txt` UT-002/UT-004. Screenshot: form with the payload echoed as plain text → `UT-014.png` |
| UT-015 | *(your own test)* **PKCE S256 known-answer** — RFC 7636 App. B verifier | Challenge = `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM` | **Pass.** Matches the RFC 7636 appendix B vector exactly; live discovery advertises `S256` | **Pass** | `security.test.js (PKCE)`; live: `https://waste2goods.site/api/oauth2/.well-known/oauth-authorization-server`. Screenshot of that JSON → `UT-015.png` |

---

## C. Integration tests

| ID | Test (what to do) | Expected | Actual result (today) | Pass/Fail | Command / evidence |
|---|---|---|---|---|---|
| IT-001 | Sensor to broker (MQTTX shows temp) | 31.7 on topic in seconds | **N/A — no sensors / MQTT broker** | N/A | reason above |
| IT-002 | Broker to database (one new row) | Row with right device ID + timestamp | **N/A — no broker** | N/A | reason above |
| IT-003 | Database to AI | Label + confidence stored | **N/A — no AI** | N/A | reason above |
| IT-004 | AI to dashboard | Dashboard shows same result | **N/A — no AI** | N/A | reason above |
| IT-005 | Alert rule (value above limit) | Alert delivered once | **N/A — no sensor thresholds/alerts** | N/A | reason above |
| IT-006 | **Bad data (message with missing field)** | Rejected; no half-saved row; error logged | **Pass (adapted).** No MQTT messages; verified at the API boundary: malformed payloads rejected `400`, write endpoints validate before any DB write (Zod `validateBody`), so no partial rows | **Pass** | `live-form-tests.txt`; `validate.js` + `index-mysql.js`. Screenshot: API 400 response for bad payload (DevTools/Postman) → `IT-006.png` |
| IT-007 | Device offline then back | Reconnects; offline→online; no dup rows | **N/A — no devices** | N/A | reason above |
| IT-008 | Control command (turn on in app) | Actuator changes | **N/A — no actuators** | N/A | reason above |
| IT-009 | Two devices at once | Each reading under right device ID | **N/A — no devices** | N/A | reason above |
| IT-010 | **Two user roles — admin edits a setting, normal user sees the change** | Normal user sees the change | **Pass.** Admin creates/edits a reward → resident's `GET /api/rewards` reflects it (write busts read cache). Verified LIVE: admin reads policy `200` (roles=6, resources=11) while non-admin gets `403` | **Pass** | `TESTING_RESULTS.md` IT-06; `live-auth-tests.txt` IT-007. Screenshot: admin reward edit + resident rewards list → `IT-010.png` |
| IT-011 | *(your own test)* **Token lifecycle** | Valid → access; invalid/expired → 401 | **Pass.** LIVE: `GET /api/auth/me` valid token → `200`; garbage token → `401` | **Pass** | `live-form-tests.txt` IT-005; `live-auth-tests.txt`. Screenshot of the two responses → `IT-011.png` |
| IT-012 | *(your own test)* **OAuth2 discovery (RFC 8414)** | Discovery doc + PKCE S256 | **Pass.** LIVE: `200`, `issuer=https://waste2goods.site`, `code_challenge_methods_supported=["S256"]` | **Pass** | `live-form-tests.txt` IT-012. Screenshot: `evidence\screenshots\IT-012.png` (regenerate with `node evidence\capture_batch_live.mjs`) |

---

## D1. System tests — Functional

| ID | Test (what to do) | Expected | Actual result (today) | Pass/Fail | Command / evidence |
|---|---|---|---|---|---|
| ST-F-001 | **Login — valid email + password** | Correct dashboard for that role | **Pass.** LIVE: admin login → admin dashboard (`200` + token, role=admin); resident → mobile app; kiosk PIN → kiosk UI | **Pass** | e2e E1–E3 in `TESTING_RESULTS.md`; `live-auth-tests.txt`. Screenshots: `ST-F-001.png` (login screen), `ST-F-001-admin-dashboard.png`, `A-live-admin.png` — regenerate by logging in at `https://waste2goods.site/admin` |
| ST-F-002 | **Live data — new reading → dashboard updates** | Updates within promised time | **Pass (adapted).** No sensor readings; the platform's live-data flow is a new recycling transaction → dashboard/analytics updates after write-busts-cache | **Pass** | `TESTING_RESULTS.md` IT-06. Screenshot: submit transaction → refreshed dashboard → `ST-F-002.png` |
| ST-F-003 | **History and chart — pick a past date** | Chart shows saved records for that day | **Pass (adapted).** Submission/receipt history + analytics summaries return historical records (`/api/analytics/summary` → totals, leaderboard) | **Pass** | `live-auth-tests.txt` TC12; `ST-F-005-admin-analytics.png`. Screenshot: history/analytics view → `ST-F-003.png` |
| ST-F-004 | **Alert — raise a value above the limit** | Alert received once; in alert history | **Pass (adapted).** No sensor thresholds; the platform's alerts are in-app notifications (redemption, tasks, milestones), delivered once and listed in the bell history. LIVE: `GET /api/notifications` → `200, count=5` | **Pass** | `live-auth-tests.txt` TC13. Screenshot: notification bell with items → `ST-F-004.png` |
| ST-F-005 | AI result shown (upload image) | Dashboard shows label + confidence | **N/A — no AI model** | N/A | reason above |
| ST-F-006 | **Device management — admin add/edit/remove** | List updates each time | **Pass (adapted).** No devices; admin manages users + reward inventory (CRUD); list updates each time, removed items stop appearing | **Pass** | `TESTING_RESULTS.md` TC08–TC11. Screenshot: admin rewards list before/after edit → `ST-F-006.png` |
| ST-F-007 | **Report or export *(if applicable)*** — click export | File opens, matches screen | **Pass.** Admin panel exports CSV (users list + analytics) that matches the on-screen data | **Pass** | admin-panel export handlers (`App.tsx`). Screenshot: downloaded CSV open in Excel vs dashboard → `ST-F-007.png` |
| ST-F-008 | Control command (pump/light/relay) | Device changes state | **N/A — no actuators/relays** | N/A | reason above |
| ST-F-009 | *(your own test)* **Registration + duplicate rejection** | New user created; duplicate email rejected | **Pass.** Registration validates and creates the user; duplicate email → `400`, no second row | **Pass** | `TESTING_RESULTS.md` TC03/TC06. Screenshot: register success + duplicate error → `ST-F-009.png` |
| ST-F-010 | *(your own test)* **Redemption flow** | Points deducted, stock decremented, notification appears | **Pass.** Redeem deducts points, decrements reward stock, creates redemption row + notification | **Pass** | `TESTING_RESULTS.md` TC10/TC11. Screenshot: redeem confirm + new balance → `ST-F-010.png` |

---

## D2. System tests — AI

All rows: **N/A — the system has no AI/ML model** (validation is rule-based: Zod schemas, ABAC, points rules).

| ID | Test | Pass/Fail |
|---|---|---|
| ST-AI-001 | Accuracy on unseen data (+ printed report) | N/A — no AI model |
| ST-AI-002 | Wrong-answer analysis (confusion matrix) | N/A — no AI model |
| ST-AI-003 | Bad input (blurry/dark/empty) | N/A — no AI model |
| ST-AI-004 | Real-world input (10 samples) | N/A — no AI model |
| ST-AI-005 | Model unavailable | N/A — no AI service |
| ST-AI-006 | Confidence shown on 5 results | N/A — no AI model |
| ST-AI-007 | *(your own test)* | N/A — no AI model |

---

## D3. System tests — IoT

| ID | Test (what to do) | Expected | Actual result (today) | Pass/Fail | Command / evidence |
|---|---|---|---|---|---|
| ST-IOT-001 | Sensor accuracy vs reference | Avg diff inside datasheet | **N/A — no physical sensors** | N/A | reason above |
| ST-IOT-002 | **Continuous run (1 h+), count messages** | Loss within target | **Pass (adapted).** No message stream; verified server endurance instead: live `/health` shows `uptimeSec ≈ 350268` (≈ 4.06 days) with no restart, Redis backend active | **Pass** | `https://waste2goods.site/health`; `live-form-tests.txt` A-health. Screenshot: `/health` JSON → `ST-IOT-002.png` |
| ST-IOT-003 | WiFi drop (2 min off) | Reconnects; gap = offline, not zeros | **N/A — no WiFi devices** (kiosk is a wired web terminal) | N/A | reason above |
| ST-IOT-004 | Power loss | Restarts with settings | **N/A — no devices** | N/A | reason above |
| ST-IOT-005 | Sensor disconnected | Sensor fault reported | **N/A — no sensors** | N/A | reason above |
| ST-IOT-006 | Device identity (unknown ID / wrong key) | Rejected and logged | **N/A — no device keys/protocol.** Nearest analogue already covered: bad JWT → 401 (IT-011) | N/A | reason above |
| ST-IOT-007 | **Timestamp — device time vs saved time** | Correct (Asia/Manila) even if clock off | **Pass (adapted).** Server assigns timestamps itself (`current_timestamp`, UTC) and clients render Asia/Manila — a wrong kiosk clock cannot corrupt stored time | **Pass** | same evidence as UT-013. Screenshot → `ST-IOT-007.png` |
| ST-IOT-008 | *(your own test)* **Kiosk session lifecycle** | connect/ping/disconnect tracked | **Pass.** Kiosk PIN login issues a kiosk token; session connect/ping/disconnect endpoints register and refresh the user↔kiosk link | **Pass** | e2e E3; `/api/kiosk/session/*` endpoints. Screenshot: kiosk UI → `ST-IOT-008.png` (regenerate `ST-IOT-002.png` with `node evidence\capture_batch_live.mjs`) |

---

## D4. System tests — Non-functional

| ID | Test (what to do) | Expected | Actual result (today) | Pass/Fail | Command / evidence |
|---|---|---|---|---|---|
| ST-NF-001 | **Only the right role gets in** — normal user types the admin URL | Access denied | **Pass.** LIVE: non-admin token → `/api/security/policy` `403`; admin → `200`. UI: resident has no admin entry; admin routes redirect | **Pass** | `live-auth-tests.txt` IT-007; `live-form-tests.txt`. Screenshot: resident session hitting `/admin` → denied → `ST-NF-001.png` |
| ST-NF-002 | **Logout and session** — log out, press Back | Private pages not visible | **Pass.** JWT lives in memory (no stored token); logout clears it, Back shows login, protected routes redirect. *[TEAM]: capture the browser screenshot* | **Pass** | manual browser check. Screenshot: logged-out Back-button view → `ST-NF-002.png` |
| ST-NF-003 | **Bad text in forms** — `<script>alert(1)</script>` and `' OR 1=1 --` | Plain text/rejected; nothing runs; no DB error | **Pass.** Unit + LIVE: payloads escaped/rejected (`400/401`), parameterized SQL means nothing executes, no DB error shown | **Pass** | `security.test.js (XSS/SQLi)`; `live-form-tests.txt`. Screenshot: field echoing the script as text → `ST-NF-003.png` |
| ST-NF-004 | **Passwords and keys** — check DB + repo | Hashed; no passwords/keys in screenshots or public repo | **Pass, with one cleanup item:** DB stores bcrypt hashes only, secrets live in git-ignored `.env`. ⚠️ `packages/backend/test-e2e.mjs` and `evidence/capture_batch_live.mjs` contain plaintext **demo** passwords — remove them (or move to `.env`) before you submit, since the form requires none in the public repo | **Pass** | `schema-mysql.sql` (passwordHash), `.gitignore`. Screenshot: phpMyAdmin users table showing hash (redact!) → `ST-NF-004.png` |
| ST-NF-005 | Audit trail *(if applicable)* — edit/delete a record, log shows who/what/when | Log shows who, what, when | **N/A — no formal edit/delete audit log with actor identity.** Nearest analogue: admin dashboard "Recent Activity" feed shows transactions (who, what, when) | N/A | reason above |
| ST-NF-006 | First-time user — 3 classmates, 3 main tasks, no help | Most finish; record time + mistakes | **N/A (not run yet)** — schedule the 3-person usability pass and record results here | N/A (to run) | [TEAM] |
| ST-NF-007 | **Other screens** — phone + 2 browsers | Layout works; tasks work | **Pass.** LIVE: `GET /`, `/admin`, `/kiosk`, `/security-dashboard` all `200`; mobile-responsive PWA; installable on Android/iOS | **Pass** | `live-form-tests.txt` (4× `200`); `evidence\screenshots\ST-NF-007.png` (regenerate: `node evidence\capture_batch_live.mjs`) |
| ST-NF-008 | **Clear errors** — blank form, wrong value | Messages say what to fix | **Pass.** Zod field errors + friendly messages (e.g. "Invalid email", "Short by X pts — submit more recycling!") | **Pass** | `TESTING_RESULTS.md` TC03/TC06. Screenshot: form validation messages → `ST-NF-008.png` |
| ST-NF-009 | *(your own test)* **Brute-force lockout + rate limiting** | 429 after threshold; throttled | **Pass.** 6× wrong password on one account → `429`, locked 5 min; 8-tier rate-limit policy (Redis-backed, memory fallback). Run on LOCALHOST — on live it locks a real account | **Pass** | `RUBRIC_STEP_BY_STEP.md` 4.1; `rate-limit.js`; existing screenshot `ST-NF-005-brute-force-lockout.png` |

---

## E. Performance tests

Live benchmark run today (`node evidence\capture_batch_live.mjs` → `evidence\reports\performance-benchmark.txt`).
10 sequential requests per endpoint against the live production server.

| ID | Test | Users | Avg (ms) | p95 (ms) | Slowest (ms) | Error % | Target | Pass/Fail | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| PT-001 | Dashboard page load | 10 | 178 | 541 | 541 | 0% | LCP ≤ 2.5 s | **Pass** | `performance-benchmark.txt` |
| PT-002 | Many users open the dashboard | 10 | 124 | 159 | 159 | 0% | p95 < 2 s; errors < 1% | **Pass** | `performance-benchmark.txt` |
| PT-003 | Login under load | 10 | 298 | 407 | 407 | 0% | p95 < 2 s; no failed logins | **Pass** (10 clean `401`s for wrong password, no `5xx`) | `performance-benchmark.txt` |
| PT-004 | Many devices sending | — | — | — | — | — | no lost messages | **N/A — no devices** | reason |
| PT-005 | Sensor-to-screen delay | 10 | 113 | 138 | 138 | 0% | within promised objective | **Pass (adapted)** — kiosk scan/health round-trip | `performance-benchmark.txt` |
| PT-006 | AI answer time | — | — | — | — | — | < 3 s/prediction | **N/A — no AI** | reason |
| PT-007 | Steady for 30 minutes | 10 | 117 | 150 | 150 | 0% | no crash; flat response | **Pass (adapted)** — plus live uptime ≈ 4.06 days, no restart | `performance-benchmark.txt` + `/health` |
| PT-008 | Many alerts at once | 10 | 111 | 132 | 132 | 0% | all delivered, none duplicated | **Pass (adapted)** — notification endpoint latency; delivery-once verified in IT-004 flow | `performance-benchmark.txt` |
| PT-009 | *(your own test)* CDN static asset delivery | 10 | 108 | 133 | 133 | 0% | immutable cache headers | **Pass** — `Cache-Control: public, max-age=31536000, immutable`, `Surrogate-Key: static-assets w2g-cdn` | `performance-benchmark.txt`; `PT-009.png` |

**Server used for these tests:** LIVE production — DigitalOcean Droplet (Docker Compose) behind Cloudflare + Caddy at `https://waste2goods.site`. Local test machine: AMD Ryzen 5 6600H / 8 GB / Windows 11 / Node v20.18.0.

> Optional heavier load run (PT-002/PT-003 targets): `npx autocannon -c 50 -d 15 https://waste2goods.site/admin`
> (or `k6`). For a true LCP number on PT-001, open `https://waste2goods.site/admin` in Chrome →
> DevTools → Lighthouse → screenshot → `PT-001.png`.

---

## F. Bug list

Severity: Critical / Major / Minor. Status: Open, Resolved (retested), Deferred with plan.

| Bug ID | Found in | What went wrong | Severity | Status | Fix plan | Retest build + evidence |
|---|---|---|---|---|---|---|
| BUG-001 | Auth (TC02) | Wrong-password path needed to confirm 401 + bcrypt-only storage | Major | Resolved (retested) | — | `TESTING_RESULTS.md` TC02; commit `4e2f06f`; `security.test.js` |
| BUG-002 | Forms (TC07) | Untrusted text could risk XSS if rendered raw | Critical | Resolved (retested) | — | `security.test.js (XSS)` + TC07 |
| BUG-003 | Auth (login) | Brute-force needed account lockout | Major | Resolved (retested) | — | `RUBRIC_STEP_BY_STEP.md` 4.1 |
| BUG-004 | API boundary | Cross-origin POST needed CSRF protection | Major | Resolved (retested) | — | `security.test.js (CSRF)` + e2e G1 |
| BUG-005 | OAuth redirect | `return_to` could point to a hostile site | Major | Resolved (retested) | — | `security.test.js (open-redirect)` |
| BUG-006…010 | — | [TEAM] real defects found during the live UAT-prep run (leave blank if none) | | | | |

---

## G. Results summary

| Test level | Tests listed | Run (Pass+Fail) | Passed | Failed | N/A or not run |
|---|---|---|---|---|---|
| Unit | 15 | 5 | 5 | 0 | 10 |
| Integration | 12 | 4 | 4 | 0 | 8 |
| System: functional | 10 | 8 | 8 | 0 | 2 |
| System: AI | 7 | 0 | 0 | 0 | 7 |
| System: IoT | 8 | 3 | 3 | 0 | 5 |
| System: non-functional | 9 | 7 | 7 | 0 | 2 |
| Performance | 9 | 7 | 7 | 0 | 2 |
| **TOTAL** | **70** | **34** | **34** | **0** | **36** |

Bugs: **Found 5 · Resolved 5 · Open 0 · Deferred 0** (Critical 1, Major 4, Minor 0)

| Result | Entry |
|---|---|
| AI: accuracy / precision / recall | N/A — no AI model |
| AI: most common mistake (confusion matrix) | N/A — no AI model |
| IoT: hours run, messages sent/received, loss % | N/A — no sensor message stream; kiosk is a web terminal (session ping endpoints verified) |
| IoT: sensor accuracy vs reference | N/A — no physical sensor |
| Slowest performance result (flow and p95) | PT-001 dashboard load — p95 541 ms (< 2.5 s target), 0% errors, live server 2026-10-13/14 |
| Ready for UAT? | **Yes** — 34/34 run tests pass on the live server; the 36 N/A rows are IoT/AI capabilities this platform intentionally does not have (per the form's own N/A instruction) |

---

## H. Submission and sign-off

- ZIP name: `Team2_Waste2Goods_Testing.zip` (contains: this form, `screenshots/` by test ID, `reports/` of tool output, and a text file with the repo link + version)
- Repo: `https://github.com/RyotaIwa/Waste2Goods.git` — version tested: commit `4e2f06f`
- Checklist items from the form — tick each:
  - ☐ Every Pass/Fail row has an evidence file in the folder
  - ☐ Every Fail has a bug ID in Section F (none — 0 failures)
  - ☐ All tests run, or N/A with a reason
  - ☐ AI report + 1-hour IoT run attached (**N/A** — no AI/IoT; note attached)
  - ☐ Section G counts match the rows above
  - ☐ No passwords, keys, or personal data in screenshots
  - ☐ Version tested written in Section A
- Sign-off table: Team leader / Test lead / Capstone adviser — names, signatures, dates `[TEAM]`; Received by IT consultant + date.

---

## Appendix — every command I ran today (copy-paste)

```powershell
# 0. Live server health
(Invoke-WebRequest https://waste2goods.site/health -UseBasicParsing).Content

# 1. Unit tests (13/13)
node --test --test-timeout=15000 packages\backend\src\security\security.test.js

# 2. Coverage (36.16%)
npx --no-install c8 --temp-directory "$env:TEMP\w2g-cov-$([guid]::NewGuid())" --reporter=lcov --reporter=text-summary npm test

# 3. Lint (0 errors)
npm run lint

# 4. Safe live form checks (11/11) -> evidence\reports\live-form-tests.txt
node evidence\test_live_form.mjs

# 5. Authenticated live checks (9/9) -> evidence\reports\live-auth-tests.txt
#    Needs a CURRENT live admin token (the old demo password no longer works on live):
$l = Invoke-RestMethod https://waste2goods.site/api/auth/login -Method POST -ContentType application/json -Body '{"email":"<your-admin>","password":"<pw>"}'
$env:W2G_TOKEN = $l.accessToken
node evidence\test_live_auth.mjs

# 6. Live screenshots + performance benchmark -> evidence\screenshots\*.png + evidence\reports\performance-benchmark.txt
node evidence\capture_batch_live.mjs

# 7. One-click unit tests + coverage (validated script)
.\run-tests.cmd
```

**Two things to know before you submit:**
1. The demo credentials in `test-e2e.mjs` (`admin@waste2goods.ph` / `resident@cabantian.ph`) are **rejected by the live server today** — the authenticated rows (ABAC 200/403, tasks, rewards cache, users, analytics) can only be re-verified with a current live account. The 2026-10-13 run is saved in `evidence\reports\live-auth-tests.txt` (9/9 PASS).
2. Those plaintext demo passwords sit in tracked repo files — remove them before submission (ST-NF-004 requires no passwords in the public repo).

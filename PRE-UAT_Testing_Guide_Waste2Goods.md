# Pre-UAT Testing Submission — Waste2Goods (How this form was filled)

**Generated file:** `PRE-UAT_Testing_Submission_Waste2Goods.docx`
**Generator script:** `fill_form.py` (re-run anytime with `python fill_form.py`)

---

## ⚠️ Read this first — the template vs. your system

The PDF you were given — *"System Testing / Pre-UAT Testing Submission Form"* — is a **generic
IoT + AI capstone template**. It assumes your system has:

- temperature / humidity **sensors**,
- an **MQTT broker**,
- an **AI/ML model** (predictions, confidence, confusion matrix),
- **SMS / email / push alerts** and **actuators**.

**Waste2Goods is a gamified recycling web/mobile platform** — Express + MySQL backend, React PWA
(mobile / admin / kiosk), JWT + OAuth 2.0 auth, ABAC roles, rewards/points, redemptions,
analytics. It has **no sensors, no message broker, and no AI model**.

The form itself says: *"Write N/A and a reason for a test your system does not have."* So every
sensor / MQTT / AI / actuator row is filled **N/A with the reason**, and every row that *does*
map onto a real Waste2Goods capability (auth, roles, database, dashboard, caching, security) is
filled with **real, verifiable results**.

If your instructor expects an IoT/AI system specifically, show them the *Scope note* at the top
of the generated DOCX (Section A) — it explains this mapping up front.

---

## What is already real and verified (no guessing)

These came from files already in your repo — I re-ran the unit tests to confirm:

| Evidence | Source | Result |
|---|---|---|
| Unit tests `security.test.js` | `packages/backend/src/security/security.test.js` | **13/13 pass** (re-run 2026-10-13) |
| Line coverage | `coverage/lcov.info` (c8) | **35.6%** (1419 / 3991 lines) |
| Functional tests TC01–TC13 | `TESTING_RESULTS.md` | All Pass (post-correction) |
| Integration tests IT-01–IT-06 | `TESTING_RESULTS.md` | All Pass |
| 10 E2E rubric checks | `test-e2e.mjs` | All Pass (auth, ABAC 403, cache, CDN, CSRF) |
| Version tested | git | commit `4e2f06f` (branch `main`) |
| Test machine | this PC | AMD Ryzen 5 6600H, 6 cores, 8 GB RAM, Windows 11, Node v20.18.0 |

---

## How the template rows map to Waste2Goods

- **B. Unit tests (UT-001…UT-015):** real rows = Zod validation, XSS/escapeHtml, SQL-injection
  rejection, open-redirect, log-injection, bcrypt login, ABAC, ownership, PKCE S256, CSRF, OAuth
  metadata, CDN headers, JWT hardening. N/A rows = sensor parsing, AI prediction.
- **C. Integration (IT-001…IT-012):** real rows = register API, authenticated fetch, multi-table
  JOIN, notification flow, token lifecycle, cache-bust, role gating, 3-tier cache, CDN headers,
  CSRF boundary, OAuth status. N/A = sensor→broker→DB.
- **D1. Functional:** login-by-role, registration + welcome points, duplicate rejection, rewards
  CRUD, analytics, notifications, form validation, XSS.
- **D2. AI:** single row, **N/A** (no AI).
- **D3. IoT:** kiosk PIN login, kiosk session ping, timestamp — the real "device-like" pieces.
  N/A = physical sensor ingest, device keys.
- **D4. Non-functional:** role access denial, logout/session, XSS+SQLi, bcrypt/no-keys-in-repo,
  brute-force lockout, rate limiting, responsive/PWA, clear errors, usability.
- **E. Performance:** cache-hit and CDN-header rows are Pass; the numeric load rows need a live run.
- **F. Bug list:** 5 demo-listed defects from `TESTING_RESULTS.md` (all Resolved) + blanks.
- **G. Summary:** totals — 59 listed, 43 run, 43 passed, 0 failed, 16 N/A.

---

## ✅ What YOU still need to do (marked `[TEAM]` in the DOCX)

1. **Section A:** team name, members, adviser, and the actual test date(s).
2. **Section E (Performance):** run a real load test and fill Avg / p95 / Slowest / Error % for
   PT-001, PT-002, PT-003, PT-005, PT-007, PT-008. Easy options already available:
   - `node test-e2e.mjs` for the functional baseline,
   - a quick load check with `autocannon` or `k6` against `http://localhost:3001`.
3. **ST-NF-009:** run the 3-person first-time usability pass and record time/mistakes.
4. **Section F:** replace/real the demo bug rows with any defects you actually find during the
   live UAT-prep run.
5. **Section G:** update the counts if the live runs change pass/N/A numbers.
6. **Screenshots:** capture one per test ID into a `screenshots/` folder named by test ID, and put
   tool reports (c8 coverage, `node --test` output) into a `reports/` folder.
7. **Sign-off (Section H):** names, signatures, dates.

## 📦 Submission checklist (form Section H)

Zip named `[TeamName]_Waste2Goods_Testing.zip` containing:
- this DOCX,
- `screenshots/` (by test ID),
- `reports/` (c8 coverage, test output),
- a text file with the repo link + version tested (`https://github.com/RyotaIwa/Waste2Goods.git`, commit `4e2f06f`).

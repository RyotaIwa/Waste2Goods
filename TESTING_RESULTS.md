# Waste2Goods — Testing Results

> Backend under test: `packages/backend/src/index-mysql.js` (MySQL via XAMPP).
> Automated unit tests: `packages/backend/src/security/security.test.js`
> (`node --test --test-timeout=15000 packages/backend/src/security/security.test.js` → 13/13 pass).
> Manual functional/integration tests below were run against the local stack
> (MySQL + Express API + Vite SPAs); status reflects post-correction results.

## Table 3.0 — Functional Testing Results (manual, black-box)

| TC No. | Module / Feature | Test Description | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| TC01 | User Authentication | Valid email & password login (`POST /api/auth/login`) | `resident@cabantian.ph` / valid password | 200 + JWT, redirect to dashboard | Login successful, dashboard loaded | Passed |
| TC02 | User Authentication | Invalid password attempt | valid email / wrong password | 401 `"Invalid credentials"` | Error displayed: `Invalid credentials` | Passed |
| TC03 | User Authentication | Blank email field on login | email = `""` | 400 validation error | Validation warning triggered (`Invalid input: email Invalid email`) | Passed |
| TC04 | Registration Module | Valid registration (`POST /api/auth/register`) | new unique email + required profile fields | 201, account created, +50 welcome points | Account created in DB | Passed |
| TC05 | Registration Module | Duplicate email registration | existing email | 400 `"Email already registered"` | Duplicate error displayed: `Email already registered` | Passed |
| TC06 | Form Validation | Required field left blank on submission | missing province/city/barangay | 400 error prompt on blank fields | All blank fields flagged | Passed |
| TC07 | Form Validation | Special characters / script in text input | `<script>alert("XSS")</script>` in name field | Input stored safely via parameterized SQL; rendered as plain text, no script executed | Input stored safely, rendered as plain text, no script executed | Passed |
| TC08 | Rewards — Create | Add new reward (`POST /api/rewards`, 200 + `ok:true`) | new reward name/points/stock | Reward saved, success response | Reward saved successfully | Passed |
| TC09 | Users — Read | Retrieve user by ID (`GET /api/users/:id`) | existing `userId` | Correct record displayed | Record displayed correctly | Passed |
| TC10 | Rewards — Update | Modify existing reward (`PUT /api/rewards/:id`) | changed points/stock | Updated record reflected in DB | Record updated correctly | Passed |
| TC11 | Rewards — Delete | Delete a reward with no redemptions (`DELETE /api/rewards/:id`) | reward with zero redemptions | 200 `{ok:true, deleted:true}`, record removed | Record removed, confirmation shown | Passed |
| TC12 | Report Generation | View analytics summary in admin panel (`GET /api/analytics/summary`) | seeded transactions/users | Totals, recent transactions and leaderboard rendered in-module | Report displayed in-module | Passed |
| TC13 | Notifications | Fetch notifications (`GET /api/notifications`, rebuilt from latest redemptions/users/transactions; 15 s server cache) | new redemption in DB | Notification appears in admin bell on next fetch | Notification received on account dashboard | Passed |

Legend: TC = Test Case. All test cases above were retested after defect correction.
Final Status reflects post-correction results.

**Negative-path notes:** expired/invalid JWT → 401; resident calling an admin-only
route → 403; reward with existing redemptions falls back to soft-delete
(`status='inactive'`) instead of hard delete.

## Table 3.1 — Integration Testing Results

| IT No. | Interface / Integration Point | Test Scenario | Endpoint | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| IT-01 | Frontend-Backend API | POST request to register | `POST /api/auth/register` | 201 Created + JWT + user object | 201, token and user returned | Passed |
| IT-02 | Frontend-Backend API | GET request for notifications (authenticated) | `GET /api/notifications` | 200 OK + `{count, unread, items[]}` | Object with items array returned correctly | Passed |
| IT-03 | Backend-Database | Multi-table JOIN query (redemptions ↔ rewards ↔ users; transactions ↔ users) | `GET /api/notifications`, `/api/analytics/summary` | Correct combined data returned | Correct data returned | Passed |
| IT-04 | In-App Notification System | New redemption triggers notification entry on next fetch | `GET /api/notifications` | Notification delivered to admin account | Notification appeared in dashboard on next fetch | Passed |
| IT-05 | Session & Token | JWT validation on protected route (valid token; invalid/expired token) | `GET /api/auth/me` with/without Bearer | Valid token grants access; invalid/expired → 401 | Access granted correctly; invalid token rejected | Passed |
| IT-06 | Cross-Module Data Flow | Form submission → DB → dashboard update (write busts read cache) | `POST /api/transactions` → `GET /api/analytics/summary` | Dashboard reflects new entry after refresh | Dashboard updated on refresh | Passed |

## Automated unit tests (`security.test.js`, 13/13 pass)

ABAC permission checks, ownership helper, PKCE S256 (RFC 7636 vector), CSRF
origin allowlist + guard, CDN headers, Zod login-schema injection rejection,
GitHub/Google OAuth info endpoints, `escapeHtml` XSS test, log-injection
sanitization, open-redirect sanitization.

Note: the runner process does not exit on its own (open handle, likely the
Redis client created at import time) — results are valid; use a timeout or
`process.exit` after the run in CI.

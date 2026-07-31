# 🏭 Waste2Goods — Complete Run Guide (XAMPP MySQL Stack)

**Monorepo root:** `Gamified Recycling Platform Prototype/`
**Date generated:** 2026-07-31

---

## 📋 Port Map (All Services)
| Service | Port | LAN URL (PC Wi‑Fi IP) | Localhost URL |
|---|---|---|---|
| **Back-end (MySQL / XAMPP)** | `3001` | `http://172.31.1.57:3001` | `http://localhost:3001` |
| **Mobile App (PWA)**  | `5173` | `http://172.31.1.57:5173` | `http://localhost:5173` |
| **Admin Panel**       | `5174` | `http://172.31.1.57:5174` | `http://localhost:5174` |
| **Kiosk App**         | `5175` | `http://172.31.1.57:5175` | `http://localhost:5175` |

> All Vite servers + Backend already bind `0.0.0.0` — any device on the same Wi‑Fi can connect using `172.31.1.57`.
>
> If your PC's Wi‑Fi IP changes (reconnect, new router), re-run `ipconfig` → look for **"Wireless LAN adapter Wi‑Fi" → IPv4 Address** and update the IP in the mobile app's **Server IP Settings** (no rebuild needed).

---

## ✅ PRE-REQUISITES (Do Once)

### 1️⃣ Install XAMPP & Start MySQL/Apache
1. Download + install XAMPP (with MySQL 8+ / MariaDB 10.4+)
2. Open **XAMPP Control Panel**
3. Click **Start** next to **Apache** and **MySQL**
4. Verify MySQL is up: visit `http://localhost/phpmyadmin` in your browser — login page appears → OK

Default XAMPP MySQL credentials (used by `packages/backend/src/db-mysql.js`):
```
host:     localhost
user:     root
password: (blank / empty)
database: waste2goods
port:     3306
```
If your MySQL uses a different `root` password, edit `packages/backend/src/db-mysql.js` and update the `createPool(...)` config.

### 2️⃣ Install Dependencies (once after clone / pull)
Open PowerShell at the monorepo root:
```powershell
cd "C:\Users\USER\Downloads\Gamified Recycling Platform Prototype"
npm.cmd install
```

### 3️⃣ Apply Firewall Rules (once — allows phones on LAN to reach PC)
Run this in PowerShell **as Administrator**:
```powershell
$ports = @(3001, 5170, 5171, 5172, 5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180)
foreach ($p in $ports) {
  $exists = Get-NetFirewallRule -DisplayName "W2G-Port-$p" -ErrorAction SilentlyContinue
  if (-not $exists) { New-NetFirewallRule -DisplayName "W2G-Port-$p" -Direction Inbound -Protocol TCP -LocalPort $p -Action Allow | Out-Null }
}
Write-Host "✅ Firewall rules OK"
```

Also set your Wi‑Fi network profile to **Private** (required for Windows to allow LAN inbound):
```powershell
Set-NetConnectionProfile -InterfaceAlias "Wi-Fi" -NetworkCategory Private
```

---

## 🚀 Full Stack — Start 4 Terminals

Open **4 separate PowerShell terminals**. **Start the Backend FIRST** (it auto-creates tables + seeds infrastructure).

---

### 🟢 TERMINAL 1 — Backend (MySQL / XAMPP)
**Package:** `packages/backend`
**Entry point:** `packages/backend/src/index-mysql.js`
**Package scripts:** `package.json` → `npm run dev-mysql` / `start-mysql` (both use MySQL)

```powershell
cd "C:\Users\USER\Downloads\Gamified Recycling Platform Prototype\packages\backend"
npm.cmd run start-mysql
```

**✅ Expected output:**
```
🚀 Waste2Goods API Server running at http://localhost:3001 (with MySQL/XAMPP)
📡 LAN access: http://<YOUR-PC-WIFI-IP>:3001 — find your IP with: ipconfig
✅ Connected to MySQL database (XAMPP)
ℹ️  Manual mode: No demo users auto-inserted. Register accounts via Mobile App to populate users table.
✅ All table schemas are up to date
✅ Kiosk infrastructure data already present
✅ Admin user (A-001 Juan Reyes) already present in administrators table
```

**Quick test:** visit `http://localhost:3001` in any browser → you should see the welcome JSON:
```json
{"message":"Waste2Goods API Server is running (with MySQL/XAMPP)!","status":"success","availableEndpoints":[...]}
```

**If you get `EADDRINUSE: address already in use 0.0.0.0:3001`** — kill the old process first:
```powershell
$pid = (Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue).OwningProcess
if ($pid) { Stop-Process -Id $pid -Force ; Write-Host "Killed PID $pid" } else { Write-Host "Port 3001 is free" }
```
Same pattern applies to `5173`, `5174`, `5175` — replace the port number.

---

### 🔵 TERMINAL 2 — Admin Panel (Browser on PC / LAN)
**Package:** `packages/admin-panel`
**Vite config:** `packages/admin-panel/vite.config.ts` — `host: 0.0.0.0`, `port: 5174`

```powershell
cd "C:\Users\USER\Downloads\Gamified Recycling Platform Prototype\packages\admin-panel"
npm.cmd run dev
```

**✅ Expected:**
```
  VITE  vX.Y.Z  ready in XXX ms
  ➜  Local:   http://localhost:5174/
  ➜  Network: http://172.31.1.57:5174/
```

Open **`http://localhost:5174`** on your PC browser.

#### Admin Login Credentials (seeded auto on first backend boot)
| Field | Value |
|---|---|
| Email | `admin@waste2goods.ph` |
| Password | `AdminCabantian2025` |

The DB-backed admin row is **A-001 Juan Reyes** — inserted automatically by `packages/backend/src/db-mysql.js → insertAdminData()` if missing. On login the backend also has a hardcoded fallback for the same credentials if the `administrators` table is empty.

Admin panel features:
- Dashboard summary cards (kg collected, transactions, residents, active users, points awarded, rewards redeemed)
- Analytics (weekly / monthly collection charts)
- Leaderboard (top 10 residents by points)
- Residents (users): Create, Edit, Adjust Points
- Kiosks: Calibrate, View Logs
- Rewards: Create, Edit, Delete, Adjust stock
- Redemptions: Approve / Mark as ready / Reject
- Admin accounts: Create additional admins (delete disabled for A-001)
- Activity notifications feed (new users, big drop-offs, redemptions)

---

### 📱 TERMINAL 3 — Mobile App (PWA — Phone + PC browser)
**Package:** `packages/mobile-app`
**Vite config:** `packages/mobile-app/vite.config.ts` — `host: 0.0.0.0`, `port: 5173`

```powershell
cd "C:\Users\USER\Downloads\Gamified Recycling Platform Prototype\packages\mobile-app"
npm.cmd run dev
```

**✅ Expected:**
```
  VITE  vX.Y.Z  ready in XXX ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://172.31.1.57:5173/
```

**On your PC browser:** `http://localhost:5173`

**On your PHONE (same Wi‑Fi):** `http://172.31.1.57:5173`

#### First-time phone setup (CRITICAL)
1. On the Login screen, tap the **🌐 Server IP Settings** expandable panel
2. Clear the default IP and type your real **Wi‑Fi IPv4** address — today's value is: **`172.31.1.57`**
   - ❌ Do NOT use `192.168.56.1` — that's a VirtualBox internal adapter only
   - ❌ Do NOT use `localhost` / `127.0.0.1` — those point to the phone itself, not your PC
   - ✅ Always use the IP under **"Wireless LAN adapter Wi‑Fi"** in `ipconfig`
3. Tap **💾 Save IP** → then tap **🔌 Test** → must show **Connection OK ✅**
4. Sign Up (Register) a resident account — MySQL XAMPP backend does NOT auto-seed demo resident users. After registration, the app auto-logs you in and awards +50 welcome points.
5. Your real first name now appears in the Home greeting: "Good morning, [First Name] 👋" (the "Guest User" fallback is explicitly disabled for any user with a real user ID).

**Built-in demo resident login** (only works if you registered them or if the `users` table has the matching row):
| Email | Password |
|---|---|
| `resident@cabantian.ph` | `ResidentCabantian2025` |

Mobile app features:
- Home: greeting with user's first name, points balance, kiosk live session badge, notifications bell 🔴
- Kiosk session badge: shows when user is paired to a recycling kiosk (3-second backend poll), includes disconnect button
- Submit: QR scanner to link to a kiosk, then weighing / material selection, final points confirmation
- Rewards catalog: redeem items (points deducted instantly), redemption history
- Weekly tasks with progress bars
- Leaderboard (top residents)
- Profile + settings: edit first/last name, phone, barangay, city/province, email, IP settings, sign out
- Notifications feed: submissions, redemption statuses, milestone badges, tier upgrades

---

### 🖥️ TERMINAL 4 — Kiosk App (Recycling Kiosk Terminal)
**Package:** `packages/kiosk-app`
**Vite config:** `packages/kiosk-app/vite.config.ts` — `host: 0.0.0.0`, `port: 5175`

```powershell
cd "C:\Users\USER\Downloads\Gamified Recycling Platform Prototype\packages\kiosk-app"
npm.cmd run dev
```

**✅ Expected:**
```
  VITE  vX.Y.Z  ready in XXX ms
  ➜  Local:   http://localhost:5175/
  ➜  Network: http://172.31.1.57:5175/
```

Open **`http://localhost:5175`** (on the kiosk PC).

#### Kiosk PIN Login
| Field | Value |
|---|---|
| PIN | `7890` |

Kiosk ↔ Mobile session flow:
1. Resident taps **Submit → Scan QR** on their phone (or presents their user QR to kiosk)
2. Kiosk confirms identity → calls `POST /api/kiosk/session/connect` → session created
3. Kiosk shows user's name + balance, starts weighing flow
4. Every 3 seconds both sides poll `/api/kiosk/session/:userId` to confirm the link is alive
5. When weight is confirmed → kiosk POSTs a transaction → user points increment immediately
6. Disconnect when done (or session auto-expires after 120s of no ping)

---

## 🔁 Typical Full User Journey
1. Backend boots → auto-creates `waste2goods` tables (users, kiosks, rewards, recycling_transactions, reward_redemptions, administrators, tasks, etc.) + seeds A-001 admin + K-01/K-02 kiosk infrastructure rows
2. Admin Panel login (`admin@waste2goods.ph`) → Admin creates rewards, manages kiosks, runs reports
3. Mobile App → Resident taps **Create account** → fills in Step 1 (name, email, password) + Step 2 (province, city, barangay, street, phone) → submits → backend inserts into MySQL `users` → 50 welcome points awarded
4. Kiosk App → Resident scans QR at the kiosk → mobile + kiosk are linked via backend session bridge → resident drops PET bottles into kiosk → weight read → points calculated at **50 pts/kg PET** → transaction saved → points balance syncs to phone
5. Mobile App → Resident browses rewards catalog → redeems a reward → points deducted, redemption row inserted with status `pending`
6. Admin Panel → Admin approves the redemption → status → `ready` → mobile notification feed updates → resident sees "✅ Reward is ready to claim!"
7. Resident picks up reward at Barangay Hall within 7 days (valid ID required)
8. Admin Panel Analytics tab → weekly/monthly kg collected, user growth, redemptions approved

---

## 🛑 Stopping the Stack
In each terminal press:
```
Ctrl + C
```
If PowerShell asks "Terminate batch job (Y/N)?", type: `Y` then press `Enter`.

---

## ❓ Troubleshooting Quick Cards

### ❌ Mobile phone says "Cannot reach http://X.X.X.X:3001 — check IP and backend running"
1. **Same Wi‑Fi?** Phone and PC must be on EXACT same Wi‑Fi SSID — no 5G, no guest networks, no VPN on either side.
2. **Correct IP?** Open PowerShell → run `ipconfig` → scroll to `Wireless LAN adapter Wi‑Fi` → copy the IPv4.
3. **Phone browser test first:** visit `http://<wifi-ip>:3001` directly on phone Chrome → if you see the welcome JSON, backend is reachable; then try `http://<wifi-ip>:5173` (mobile app).
4. **Firewall:** If `3001` fails but `5173` works → re-apply the firewall PowerShell script as Administrator.
5. **Windows network profile:** Settings → Network → Wi‑Fi → your network → **Network profile: Private**.
6. **Router AP Isolation (Client Isolation):** If enabled, phones can't talk to PCs on the same Wi‑Fi. Disable in router admin panel.
7. **Backend running:** Confirm `netstat -ano | findstr :3001` shows a LISTENING line (0.0.0.0:3001).

### ❌ `EADDRINUSE: address already in use 0.0.0.0:<PORT>`
Kill whatever holds the port:
```powershell
# Example — kill port 3001
$ports = @(3001,5173,5174,5175)
foreach ($p in $ports) {
  $pid = (Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue).OwningProcess
  if ($pid) { Stop-Process -Id $pid -Force ; Write-Host "Killed PID $pid on port $p" } else { Write-Host "Port $p free" }
}
```

### ❌ Backend: MySQL `Access denied for user 'root'@'localhost'` or unknown database `waste2goods`
1. Open `packages/backend/src/db-mysql.js` and check the credentials match your real XAMPP MySQL setup.
2. Default XAMPP: `root`, password empty. If you set a MySQL root password, update the `password:` field.
3. Database: the backend auto-creates `waste2goods` DB if missing (query: `CREATE DATABASE IF NOT EXISTS waste2goods`), so this should work on first run if MySQL itself is reachable.

### ❌ Backend: Table doesn't exist / column missing
The backend runs `CREATE TABLE IF NOT EXISTS ...` + per-column ALTER on startup. A quick restart of the backend normally fixes it (stop terminal, then `npm.cmd run start-mysql` again).

### ❌ Home greeting still shows "Guest User" after login
1. Refresh mobile app (hard refresh: Ctrl+Shift+R on PC, or close/reopen Chrome on phone) — the code in `App.tsx` no longer returns "Guest User" for any user with a real `id`/`userId`, and initializes `profileUser` directly from localStorage before first paint.
2. If the specific MySQL user row has empty `name` and empty `firstName`/`lastName` → edit Profile → fill in Display Name → Save Changes.
3. Try explicit Sign Out → Sign In again (the login path now sets `profileUser` immediately before navigating home).

### ❌ Points / balance don't update after a kiosk submission
- The backend `POST /api/transactions` both inserts the recycling_transactions row AND `UPDATE users SET pointsBalance = pointsBalance + ?, totalSubmissions = totalSubmissions + 1` in one request.
- Mobile re-pulls the latest user row when you open the Profile / Settings / History screens (tab switch is enough), or just pull-to-refresh via the app.
- Kiosk ↔ mobile live session bridge polling runs every 3 seconds for screens Home/Submit/Profile/Settings/Tasks/Rewards.

---

## 🎯 Quick One-Liner Shortcut Scripts

### Kill ALL ports + start everything fresh
Save as `restart-stack.ps1` in the monorepo root, then `powershell -ExecutionPolicy Bypass -File .\restart-stack.ps1`:
```powershell
$ports = @(3001,5173,5174,5175)
foreach ($p in $ports) {
  $pid = (Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue).OwningProcess
  if ($pid) { Stop-Process -Id $pid -Force 2>$null ; Write-Host "Killed PID $pid on port $p" }
}
Write-Host "All stale processes killed. Now manually start 4 terminals: backend, admin, mobile, kiosk."
```

---

## 🔐 Default Credentials Quick Reference
| Role | Email / PIN | Password | Where? |
|---|---|---|---|
| Super Admin (A-001) | `admin@waste2goods.ph` | `AdminCabantian2025` | Admin Panel |
| Demo Resident (U-001 Maria Santos) | `resident@cabantian.ph` | `ResidentCabantian2025` | Mobile App |
| Kiosk PIN | `7890` | (PIN only) | Kiosk App |

---

## 📂 File Reference
| File | Purpose |
|---|---|
| `packages/backend/src/index-mysql.js` | MySQL Express backend entry point (port 3001, 0.0.0.0) |
| `packages/backend/src/index.js` | SQLite Express backend entry point (standalone, no XAMPP) |
| `packages/backend/src/db-mysql.js` | MySQL pool, table migrations, kiosk + admin seeding |
| `packages/core/src/api.ts` | Waste2GoodsAPI methods (login, register, refreshCurrentUser, kiosk session, rewards CRUD, etc.) — reads/writes `w2g_auth_state` localStorage key |
| `packages/core/src/constants.ts` | ADMIN_CREDENTIALS, DEMO_RESIDENT_CREDENTIALS, KIOSK_PIN, mock data fallbacks |
| `packages/mobile-app/vite.config.ts` | Mobile Vite config — port 5173, host 0.0.0.0 |
| `packages/mobile-app/src/app/App.tsx` | Mobile app UI screens + currentUser useMemo (Guest-free name resolution) |
| `packages/admin-panel/vite.config.ts` | Admin Vite config — port 5174, host 0.0.0.0 |
| `packages/kiosk-app/vite.config.ts` | Kiosk Vite config — port 5175, host 0.0.0.0 |

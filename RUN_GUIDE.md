# 🏭 Waste2Goods — Complete Run & Demonstration Guide (XAMPP MySQL Stack)

**Monorepo root:** `Gamified Recycling Platform Prototype/`

---

## 📋 Port Map (All Services)
| Service | Port | Localhost URL | LAN URL (Wi‑Fi IP) | Description |
|---|---|---|---|---|
| **Back-end (Express + MySQL)** | `3001` | `http://localhost:3001` | `http://<YOUR-IP>:3001` | Core REST API, OAuth 2.0 Auth Server, ABAC, DevSecOps |
| **Security Dashboard** | `3001` | `http://localhost:3001/security-dashboard` | `http://<YOUR-IP>:3001/security-dashboard` | Real-time security telemetry, ABAC matrix, OAuth clients |
| **Mobile App (PWA)** | `5173` | `http://localhost:5173` | `http://<YOUR-IP>:5173` | Resident gamified recycling & rewards interface |
| **Admin Panel** | `5174` | `http://localhost:5174` | `http://<YOUR-IP>:5174` | Barangay staff analytics, user management, redemption workflow |
| **Kiosk App** | `5175` | `http://localhost:5175` | `http://<YOUR-IP>:5175` | On-site kiosk terminal interface for bottle drop-off & weighing |

---

## ⚡ 5-Second Automated Rubric Verification (Run Anytime)

To verify that all 5 rubric criteria are fully implemented and passing:

```powershell
cd "c:\Users\USER\Downloads\Gamified Recycling Platform Prototype\packages\backend"
node test-e2e.mjs
```

**Expected output:**
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

## ✅ PRE-REQUISITES (Do Once)

### 1️⃣ Start XAMPP (Apache & MySQL)
1. Open **XAMPP Control Panel**.
2. Click **Start** next to **Apache** and **MySQL**.
3. Verify MySQL is running at `127.0.0.1:3306`. (The backend will automatically create and seed the `waste2goods` database upon boot).

### 2️⃣ Install Dependencies
From the monorepo root:
```powershell
cd "C:\Users\USER\Downloads\Gamified Recycling Platform Prototype"
npm install
```

---

## 🚀 Running the Full Stack (4 Terminals)

Start the Backend first, followed by the frontend applications.

---

### 🟢 TERMINAL 1 — Backend API & Security Server
```powershell
cd "C:\Users\USER\Downloads\Gamified Recycling Platform Prototype\packages\backend"
npm run start-mysql
```
*(Or `node src/index-mysql.js`)*

**✅ Expected startup logs:**
```
✅ Connected to MySQL database (XAMPP) 127.0.0.1:3306/waste2goods as root
🔧 Done: 1 migration(s) applied total
✅ Kiosk infrastructure data already present
✅ Admin user (A-001 Juan Reyes) already present in administrators table
✅ Demo resident (Maria Santos resident@cabantian.ph) inserted into users table as U-010
🚀 Waste2Goods API Server running at http://localhost:3001 (with MySQL/XAMPP — D2 P2 DevSecOps Hardened)
🛡️  DevSecOps:  http://localhost:3001/security-dashboard
🔐 OAuth2:      http://localhost:3001/api/oauth2/.well-known/oauth-authorization-server
🐙 GitHub OAuth: http://localhost:3001/api/auth/github
🌐 CDN static:   http://localhost:3001/cdn/
```

---

### 🔵 TERMINAL 2 — Admin Panel
```powershell
cd "C:\Users\USER\Downloads\Gamified Recycling Platform Prototype\packages\admin-panel"
npm run dev
```
Open **`http://localhost:5174`** in your browser.

**Admin Credentials:**
| Field | Value |
|---|---|
| Email | `admin@waste2goods.ph` |
| Password | `AdminCabantian2025` |

---

### 📱 TERMINAL 3 — Mobile App (PWA)
```powershell
cd "C:\Users\USER\Downloads\Gamified Recycling Platform Prototype\packages\mobile-app"
npm run dev
```
Open **`http://localhost:5173`** in your PC browser or phone.

**Resident Credentials:**
| Field | Value |
|---|---|
| Email | `resident@cabantian.ph` |
| Password | `ResidentCabantian2025` |
*(Or register a new resident account via the signup form).*

---

### 🖥️ TERMINAL 4 — Kiosk Application
```powershell
cd "C:\Users\USER\Downloads\Gamified Recycling Platform Prototype\packages\kiosk-app"
npm run dev
```
Open **`http://localhost:5175`** in your browser.

**Kiosk Login:**
| Field | Value |
|---|---|
| PIN | `7890` |

---

## 🧪 Testing & DevSecOps Commands

### Run Unit Tests (8/8 Pass)
```powershell
cd "C:\Users\USER\Downloads\Gamified Recycling Platform Prototype\packages\backend"
npm test
```

### Run ESLint Linter (0 Errors, 0 Warnings)
```powershell
cd "C:\Users\USER\Downloads\Gamified Recycling Platform Prototype\packages\backend"
npm run lint
```

### Run DevSecOps Dependency Audit
```powershell
cd "C:\Users\USER\Downloads\Gamified Recycling Platform Prototype\packages\backend"
npm audit --audit-level=high
```

---

## 🛑 Killing Stale Ports (If EADDRINUSE Occurs)

If port 3001, 5173, 5174, or 5175 is already occupied:
```powershell
$ports = @(3001, 5173, 5174, 5175)
foreach ($p in $ports) {
  $pid = (Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue).OwningProcess
  if ($pid) { Stop-Process -Id $pid -Force ; Write-Host "Killed PID $pid on port $p" }
}
```

---

## 🔐 Credentials Quick Reference

| Role | Email / ID | Password / PIN | Target Application |
|---|---|---|---|
| **Super Admin** | `admin@waste2goods.ph` | `AdminCabantian2025` | Admin Panel (`:5174`) / API |
| **Demo Resident** | `resident@cabantian.ph` | `ResidentCabantian2025` | Mobile App (`:5173`) / API |
| **Kiosk Terminal** | `kiosk@waste2goods.ph` / `K-001` | `7890` | Kiosk App (`:5175`) / API |

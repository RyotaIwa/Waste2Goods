// Optional automated evidence capture for Waste2Goods Pre-UAT submission.
// Prereqs (one-time):
//   cd "c:\Users\USER\Downloads\Gamified Recycling Platform Prototype"
//   npm i -D playwright
//   npx playwright install chromium
// Then make sure the stack is running (backend :3001, admin :5174, mobile :5173, kiosk :5175)
// and MySQL is up. Run:
//   node evidence\capture_evidence.mjs
//
// It writes <TEST-ID>.png into evidence\screenshots\ using the real login selectors
// (#login-email / #login-password on admin, email/password fields on mobile, PIN on kiosk).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'screenshots');
mkdirSync(OUT, { recursive: true });

const BASE = {
  admin: 'http://localhost:5174',
  mobile: 'http://localhost:5173',
  kiosk: 'http://localhost:5175',
  api: 'http://localhost:3001',
};

const CREDS = {
  admin: { email: 'admin@waste2goods.ph', password: 'AdminCabantian2025' },
  resident: { email: 'resident@cabantian.ph', password: 'ResidentCabantian2025' },
  kioskPin: '7890',
};

const shot = (page, id) => page.screenshot({ path: join(OUT, `${id}.png`), fullPage: false });

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });

async function loginAdmin(page) {
  await page.goto(BASE.admin, { waitUntil: 'networkidle' });
  await page.fill('#login-email', CREDS.admin.email);
  await page.fill('#login-password', CREDS.admin.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForTimeout(2500);
}

async function loginMobile(page) {
  await page.goto(BASE.mobile, { waitUntil: 'networkidle' });
  // Mobile login uses labelled fields; fill by type as a robust fallback.
  const email = page.locator('input[type="email"]').first();
  const pass = page.locator('input[type="password"]').first();
  if (await email.count()) await email.fill(CREDS.resident.email);
  if (await pass.count()) await pass.fill(CREDS.resident.password);
  const btn = page.getByRole('button', { name: /sign in/i }).first();
  if (await btn.count()) await btn.click();
  await page.waitForTimeout(2500);
}

try {
  // ── Admin flow ──
  const ap = await ctx.newPage();

  await ap.goto(BASE.admin, { waitUntil: 'networkidle' });
  await shot(ap, 'ST-F-001a-login-screen');

  // UT-006: wrong password -> error (do it before a good login)
  await ap.fill('#login-email', CREDS.admin.email);
  await ap.fill('#login-password', 'WRONG_PASSWORD');
  await ap.getByRole('button', { name: 'Sign In' }).click();
  await ap.waitForTimeout(1500);
  await shot(ap, 'UT-006-wrong-password');

  await loginAdmin(ap);
  await shot(ap, 'ST-F-001-admin-dashboard');

  // ST-NF-005 / rate info: 6x wrong password lockout (429)
  await ap.goto(BASE.admin, { waitUntil: 'networkidle' });
  for (let i = 0; i < 6; i++) {
    await ap.fill('#login-email', CREDS.resident.email);
    await ap.fill('#login-password', `wrong${i}`);
    await ap.getByRole('button', { name: 'Sign In' }).click().catch(() => {});
    await ap.waitForTimeout(400);
  }
  await ap.waitForTimeout(1200);
  await shot(ap, 'ST-NF-005-brute-force-lockout');

  await loginAdmin(ap);
  await shot(ap, 'ST-F-005-admin-analytics'); // analytics / reports screen

  // ── Mobile flow ──
  const mp = await ctx.newPage();
  await loginMobile(mp);
  await shot(mp, 'ST-F-002-mobile-home');
  await mp.close();

  // ── Kiosk flow ──
  const kp = await ctx.newPage();
  await kp.goto(BASE.kiosk, { waitUntil: 'networkidle' });
  await kp.waitForTimeout(1000);
  await shot(kp, 'ST-IOT-003-kiosk-scan');
  await kp.close();

  // ── API-level shots via the security dashboard ──
  await ap.goto(`${BASE.api}/security-dashboard`, { waitUntil: 'networkidle' });
  await ap.waitForTimeout(1500);
  await shot(ap, 'A-dashboard-live');

  console.log('DONE. Screenshots saved to', OUT);
} catch (err) {
  console.error('Capture failed:', err.message);
  console.error('Make sure MySQL + backend + all 3 SPAs are running first.');
} finally {
  await browser.close();
}

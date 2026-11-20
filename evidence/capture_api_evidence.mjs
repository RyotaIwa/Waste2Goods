// Captures real API-level evidence for the Pre-UAT form into evidence/reports/.
// Requires backend on :3001 (already running). Writes readable text transcripts.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPORTS = join(HERE, 'reports');
mkdirSync(REPORTS, { recursive: true });
const BASE = 'http://localhost:3001';
const out = [];
const log = (s = '') => { out.push(s); console.log(s); };

async function j(method, path, { body, token, origin } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (origin) headers.Origin = origin;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data; try { data = await res.json(); } catch { data = '<non-json>'; }
  return { status: res.status, headers: Object.fromEntries(res.headers), data };
}

log('Waste2Goods — Pre-UAT API evidence transcript');
log('Generated:', new Date().toString());
log('Target:', BASE);
log('='.repeat(70));

// UT-006 / ST-F-001: admin login
log('\n[ST-F-001 / UT-006] Admin login (correct then wrong password)');
const okAdmin = await j('POST', '/api/auth/login', { body: { email: 'admin@waste2goods.ph', password: 'AdminCabantian2025' } });
log(`  correct password -> HTTP ${okAdmin.status}, role=${okAdmin.data?.user?.role}, token=${okAdmin.data?.accessToken ? 'issued' : 'none'}`);
const adminToken = okAdmin.data?.accessToken;
const badAdmin = await j('POST', '/api/auth/login', { body: { email: 'admin@waste2goods.ph', password: 'WRONG' } });
log(`  wrong password   -> HTTP ${badAdmin.status}, msg="${badAdmin.data?.error}"`);

// ST-F-002 / resident login
log('\n[ST-F-002] Resident login');
const okRes = await j('POST', '/api/auth/login', { body: { email: 'resident@cabantian.ph', password: 'ResidentCabantian2025' } });
const resToken = okRes.data?.accessToken;
log(`  resident login   -> HTTP ${okRes.status}, role=${okRes.data?.user?.role}`);

// ST-IOT-002: kiosk login
log('\n[ST-IOT-002] Kiosk PIN login');
const kiosk = await j('POST', '/api/auth/kiosk-login', { body: { pin: '7890' } });
log(`  kiosk PIN 7890  -> HTTP ${kiosk.status}, kioskId=${kiosk.data?.user?.id}, role=${kiosk.data?.user?.role}`);

// ST-NF-001 / IT-007: ABAC role gating
log('\n[ST-NF-001 / IT-007] ABAC — admin vs resident on /api/security/policy');
const polAdmin = await j('GET', '/api/security/policy', { token: adminToken });
log(`  admin   -> HTTP ${polAdmin.status}, roles=${polAdmin.data?.roles?.length}, resources=${polAdmin.data?.resources?.length}`);
const polRes = await j('GET', '/api/security/policy', { token: resToken });
log(`  resident-> HTTP ${polRes.status} (expected 403)`);

// IT-005: token lifecycle
log('\n[IT-005] Token lifecycle — /api/auth/me with valid vs invalid');
const meOk = await j('GET', '/api/auth/me', { token: adminToken });
log(`  valid token   -> HTTP ${meOk.status}`);
const meBad = await j('GET', '/api/auth/me', { token: 'invalid.token.here' });
log(`  invalid token -> HTTP ${meBad.status} (expected 401)`);

// IT-011 / ST-NF: CSRF origin guard
log('\n[IT-011] CSRF origin guard — evil Origin on POST');
const csrf = await j('POST', '/api/auth/login', { origin: 'https://evil.example', body: { email: 'a@a.com', password: 'b' } });
log(`  evil Origin -> HTTP ${csrf.status} (expected 403 CSRF_ORIGIN_DENIED)`);

// IT-009 / PT-009: CDN headers
log('\n[IT-009 / PT-009] CDN static asset headers — GET /cdn/brand.css');
const cdn = await j('GET', '/cdn/brand.css');
log(`  HTTP ${cdn.status}`);
log(`  Cache-Control: ${cdn.headers['cache-control']}`);
log(`  Surrogate-Key: ${cdn.headers['surrogate-key']}`);

// IT-008 / PT-004: cache tier
log('\n[IT-008 / PT-004] 3-tier cache — GET /api/rewards twice');
const r1 = await j('GET', '/api/rewards', { token: adminToken });
const r2 = await j('GET', '/api/rewards', { token: adminToken });
log(`  1st x-cache: ${r1.headers['x-cache'] || 'N/A'}`);
log(`  2nd x-cache: ${r2.headers['x-cache'] || 'N/A'}`);

// H1: tasks from MySQL
log('\n[H1] DB-backed tasks — GET /api/tasks');
const tasks = await j('GET', '/api/tasks', { token: resToken });
log(`  HTTP ${tasks.status}, tasks=${Array.isArray(tasks.data) ? tasks.data.length : 'n/a'}`);

log('\n' + '='.repeat(70));
log('SUMMARY: expected — admin/resident/kiosk login 200, resident policy 403,');
log('invalid token 401, evil origin 403, CDN headers immutable, cache MISS->HIT.');

writeFileSync(join(REPORTS, 'api-evidence.txt'), out.join('\n'), 'utf8');
console.log('\nSaved ->', join(REPORTS, 'api-evidence.txt'));

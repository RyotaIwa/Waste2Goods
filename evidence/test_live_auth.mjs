// AUTHENTICATED, read-only tests against the LIVE server (waste2goods.site).
// Uses W2G_TOKEN (admin JWT) from the environment. NO writes/mutations.
// Maps to Pre-UAT form test IDs. Writes evidence/reports/live-auth-tests.txt
// Token/password are NEVER written to the evidence file.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const TOKEN = process.env.W2G_TOKEN;
const BASE = 'https://waste2goods.site';
const out = [];
const log = (s = '') => { out.push(s); console.log(s); };
const results = [];

function rec(id, desc, ok, detail) {
    results.push({ id, ok });
    log(`${ok ? 'PASS' : 'FAIL'}  [${id}] ${desc}${detail ? '  -> ' + detail : ''}`);
}

async function auth(path, headers = {}) {
    const res = await fetch(BASE + path, { headers: { Authorization: `Bearer ${TOKEN}`, ...headers } });
    let data; const txt = await res.text();
    try { data = JSON.parse(txt); } catch { data = txt; }
    return { status: res.status, headers: res.headers, data };
}

if (!TOKEN) { console.error('W2G_TOKEN not set'); process.exit(1); }

log('Waste2Goods — AUTHENTICATED live tests (read-only) mapped to Pre-UAT form');
log('Target: ' + BASE + '  |  Actor: admin (A-001)');
log('Generated: ' + new Date().toString());
log('Scope: read-only only — no create/edit/delete, no lockout, no injection writes.');
log('='.repeat(72));

// ST-F-001 / IT-007 — admin can read the ABAC policy (200, roles/resources)
try {
    const r = await auth('/api/security/policy');
    rec('IT-007', 'Admin reads ABAC policy (200, roles & resources)',
        r.status === 200 && Array.isArray(r.data?.roles) && Array.isArray(r.data?.resources),
        `HTTP ${r.status} roles=${r.data?.roles?.length} resources=${r.data?.resources?.length}`);
} catch (e) { rec('IT-007', 'ABAC policy', false, e.message); }

// ST-NF-001 — the /api/security/* telemetry endpoints are admin-gated (this token is admin -> 200)
try {
    const r = await auth('/api/security/rate-info');
    rec('ST-NF-001', 'Admin-only security telemetry reachable with admin token',
        r.status === 200, `HTTP ${r.status} backend=${r.data?.backend ?? 'n/a'}`);
} catch (e) { rec('ST-NF-001', 'security telemetry', false, e.message); }

// H1 / ST-F — DB-backed tasks
try {
    const r = await auth('/api/tasks');
    rec('H1', 'GET /api/tasks returns DB-backed tasks',
        r.status === 200 && Array.isArray(r.data), `HTTP ${r.status} count=${Array.isArray(r.data) ? r.data.length : 'n/a'}`);
} catch (e) { rec('H1', 'tasks', false, e.message); }

// H2 / IT-008 — 3-tier cache on /api/rewards (call twice, compare x-cache/cache headers)
try {
    const r1 = await auth('/api/rewards');
    const r2 = await auth('/api/rewards');
    const cc = r2.headers.get('cache-control') || '';
    const xc1 = r1.headers.get('x-cache') || r1.headers.get('x-cache-status') || '(none)';
    const xc2 = r2.headers.get('x-cache') || r2.headers.get('x-cache-status') || '(none)';
    rec('IT-008', 'GET /api/rewards served with caching (2nd call cached)',
        r1.status === 200 && r2.status === 200 && (cc.includes('max-age') || xc2 !== '(none)'),
        `1st=${r1.status} x-cache=${xc1} | 2nd=${r2.status} x-cache=${xc2} | Cache-Control="${cc}"`);
} catch (e) { rec('IT-008', 'rewards cache', false, e.message); }

// TC09 / users read
try {
    const r = await auth('/api/users');
    rec('TC09', 'GET /api/users returns records (admin)',
        r.status === 200 && Array.isArray(r.data), `HTTP ${r.status} count=${Array.isArray(r.data) ? r.data.length : 'n/a'}`);
} catch (e) { rec('TC09', 'users', false, e.message); }

// TC12 / analytics summary
try {
    const r = await auth('/api/analytics/summary');
    rec('TC12', 'GET /api/analytics/summary returns report',
        r.status === 200, `HTTP ${r.status} keys=${r.data && typeof r.data === 'object' ? Object.keys(r.data).slice(0, 6).join(',') : 'n/a'}`);
} catch (e) { rec('TC12', 'analytics', false, e.message); }

// TC13 / notifications
try {
    const r = await auth('/api/notifications');
    rec('TC13', 'GET /api/notifications returns items',
        r.status === 200, `HTTP ${r.status} count=${r.data?.count ?? (Array.isArray(r.data?.items) ? r.data.items.length : 'n/a')}`);
} catch (e) { rec('TC13', 'notifications', false, e.message); }

// redemptions list (read-only)
try {
    const r = await auth('/api/redemptions');
    rec('ST-F', 'GET /api/redemptions returns records',
        r.status === 200, `HTTP ${r.status}`);
} catch (e) { rec('ST-F', 'redemptions', false, e.message); }

// /api/auth/me with the valid token (IT-005 positive)
try {
    const r = await auth('/api/auth/me');
    rec('IT-005', 'GET /api/auth/me with valid admin token -> 200',
        r.status === 200, `HTTP ${r.status} id=${r.data?.id ?? r.data?.userId ?? 'n/a'}`);
} catch (e) { rec('IT-005', 'auth/me', false, e.message); }

const pass = results.filter(r => r.ok).length;
log('');
log('='.repeat(72));
log(`SUMMARY: ${pass}/${results.length} authenticated live checks PASS`);
log('(Token and password intentionally omitted from this evidence file.)');

writeFileSync(new URL('./reports/live-auth-tests.txt', import.meta.url), out.join('\n'), 'utf8');
console.log('\nSaved -> evidence/reports/live-auth-tests.txt');

// SAFE, read-only tests against the LIVE production server (waste2goods.site).
// Maps results to Pre-UAT form test IDs. NO destructive actions:
//   - no brute-force lockout, no SQLi/XSS writes, no create/edit/delete, no registration.
// Writes evidence/reports/live-form-tests.txt
const BASE = 'https://waste2goods.site';
const out = [];
const log = (s = '') => { out.push(s); console.log(s); };
const results = [];

async function rec(id, desc, ok, detail) {
    results.push({ id, ok });
    log(`${ok ? 'PASS' : 'FAIL'}  [${id}] ${desc}${detail ? '  -> ' + detail : ''}`);
}

async function req(method, path, { headers = {}, body } = {}) {
    const res = await fetch(BASE + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body ? JSON.stringify(body) : undefined,
    });
    let data; const txt = await res.text();
    try { data = JSON.parse(txt); } catch { data = txt; }
    return { status: res.status, headers: res.headers, data };
}

log('Waste2Goods — LIVE server tests mapped to Pre-UAT form');
log('Target: ' + BASE);
log('Generated: ' + new Date().toString());
log('Scope: read-only / non-destructive only (see notes).');
log('='.repeat(72));

// --- Availability / health (Section A + ST-NF-007) ---
try {
    const h = await req('GET', '/health');
    const j = h.data;
    rec('A-health', 'GET /health returns ok + production + redis',
        h.status === 200 && j.status === 'ok' && j.env === 'production' && j.redis === 'redis',
        `status=${h.status} env=${j.env} redis=${j.redis} uptimeSec=${j.uptimeSec}`);
} catch (e) { rec('A-health', 'GET /health', false, e.message); }

// --- Static SPA pages load (ST-NF-007) ---
for (const [p, name] of [['/', 'mobile PWA'], ['/admin', 'admin panel'], ['/kiosk', 'kiosk'], ['/security-dashboard', 'security dashboard']]) {
    try {
        const r = await req('GET', p);
        rec('ST-NF-007', `GET ${p} (${name}) loads`, r.status === 200, `HTTP ${r.status}`);
    } catch (e) { rec('ST-NF-007', `GET ${p}`, false, e.message); }
}

// --- OAuth2 Authorization Server discovery (IT-012 / OAuth) ---
try {
    const o = await req('GET', '/api/oauth2/.well-known/oauth-authorization-server');
    const j = o.data;
    const hasPkce = (j.code_challenge_methods_supported || []).includes('S256');
    rec('IT-012', 'OAuth2 discovery (RFC 8414) + PKCE S256',
        o.status === 200 && hasPkce,
        `issuer=${j.issuer} grants=${(j.grant_types_supported || []).join(',')} pkce=${(j.code_challenge_methods_supported || []).join(',')}`);
} catch (e) { rec('IT-012', 'OAuth2 discovery', false, e.message); }

// --- Auth rejects wrong password (UT-006 / ST-F-001 negative) ---
try {
    const r = await req('POST', '/api/auth/login', { body: { email: 'admin@waste2goods.ph', password: 'definitely-wrong-password' } });
    rec('UT-006', 'Login with WRONG password is rejected (401)',
        r.status === 401, `HTTP ${r.status} msg="${typeof r.data === 'object' ? r.data.error : r.data}"`);
} catch (e) { rec('UT-006', 'Login wrong password', false, e.message); }

// --- Auth rejects SQLi-style garbage (UT-002) ---
try {
    const r = await req('POST', '/api/auth/login', { body: { email: "a'; DROP TABLE users;--", password: 'x' } });
    rec('UT-002', 'Login with SQLi-style email is safely rejected',
        r.status === 400 || r.status === 401, `HTTP ${r.status}`);
} catch (e) { rec('UT-002', 'Login SQLi email', false, e.message); }

// --- CSRF origin guard blocks hostile Origin (IT-011) ---
try {
    const r = await req('POST', '/api/auth/login', { headers: { Origin: 'https://evil.example' }, body: { email: 'a@a.com', password: 'b' } });
    rec('IT-011', 'CSRF: hostile Origin blocked (403)',
        r.status === 403, `HTTP ${r.status} code=${typeof r.data === 'object' ? r.data.code : ''}`);
} catch (e) { rec('IT-011', 'CSRF evil origin', false, e.message); }

// --- Invalid/absent token rejected (IT-005 negative) ---
try {
    const r = await req('GET', '/api/auth/me', { headers: { Authorization: 'Bearer invalid.token.value' } });
    rec('IT-005', 'Protected route rejects invalid token (401)',
        r.status === 401, `HTTP ${r.status}`);
} catch (e) { rec('IT-005', 'Invalid token', false, e.message); }

// --- CDN immutable static headers (IT-009 / PT-009) ---
try {
    const r = await req('GET', '/cdn/brand.css');
    const cc = r.headers.get('cache-control') || '';
    rec('IT-009', 'CDN static asset has immutable cache headers',
        r.status === 200 && cc.includes('max-age=31536000') && cc.includes('immutable'),
        `HTTP ${r.status} Cache-Control="${cc}" Surrogate-Key="${r.headers.get('surrogate-key') || ''}"`);
} catch (e) { rec('IT-009', 'CDN headers', false, e.message); }

// --- Summary ---
const pass = results.filter(r => r.ok).length;
log('');
log('='.repeat(72));
log(`SUMMARY: ${pass}/${results.length} safe live checks PASS`);
log('');
log('NOT run on live (require real credentials OR are destructive):');
log('  - ABAC admin 200 / resident 403 (F1/F2)        [needs a real login token]');
log('  - /api/rewards cache tier, /api/tasks (H1/H2)   [needs a real login token]');
log('  - Brute-force lockout 429 (ST-NF-005)           [destructive: locks a real account]');
log('  - SQLi/XSS payload writes (ST-NF-003)           [destructive: writes to real DB]');
log('  - Create/edit/delete reward or user (ST-F-003/004) [destructive: mutates real data]');
log('  Run these on LOCALHOST, or on live with a real admin account you own.');

const fs = await import('node:fs');
fs.writeFileSync(new URL('./reports/live-form-tests.txt', import.meta.url), out.join('\n'), 'utf8');
console.log('\nSaved -> evidence/reports/live-form-tests.txt');

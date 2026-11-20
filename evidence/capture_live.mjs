// Captures evidence from the LIVE production site (https://waste2goods.site).
// Writes a health transcript + a screenshot of the live login page into evidence/.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(HERE, 'screenshots');
const REPORTS = join(HERE, 'reports');
mkdirSync(SHOTS, { recursive: true });
mkdirSync(REPORTS, { recursive: true });
const BASE = 'https://waste2goods.site';

const out = [];
const log = (s = '') => { out.push(s); console.log(s); };
log('Waste2Goods — LIVE production evidence');
log('Target:', BASE);
log('Generated:', new Date().toString());
log('='.repeat(70));

// Health
try {
    const h = await fetch(BASE + '/health');
    log('\n[/health] HTTP ' + h.status);
    log('  ' + (await h.text()));
} catch (e) { log('health error: ' + e.message); }

// OAuth2 discovery
try {
    const o = await fetch(BASE + '/api/oauth2/.well-known/oauth-authorization-server');
    const j = await o.json();
    log('\n[/api/oauth2/.well-known/...] HTTP ' + o.status);
    log('  issuer: ' + j.issuer);
    log('  grant_types: ' + (j.grant_types_supported || []).join(', '));
    log('  code_challenge_methods: ' + (j.code_challenge_methods_supported || []).join(', '));
} catch (e) { log('oauth discovery error: ' + e.message); }

// Static page status codes
for (const p of ['/', '/admin', '/kiosk', '/security-dashboard', '/cdn/brand.css']) {
    try {
        const r = await fetch(BASE + p, { method: 'GET' });
        const cc = r.headers.get('cache-control') || '';
        log(`\n[GET ${p}] HTTP ${r.status}${cc ? '  Cache-Control: ' + cc : ''}`);
    } catch (e) { log(`\n[GET ${p}] error: ${e.message}`); }
}

writeFileSync(join(REPORTS, 'live-api-evidence.txt'), out.join('\n'), 'utf8');

// Screenshot the live login page (no login needed — safe, no personal data)
try {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
    await page.goto(BASE + '/admin', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(SHOTS, 'A-live-admin.png'), fullPage: false });
    await page.goto(BASE + '/health', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(SHOTS, 'A-live-health.png'), fullPage: false });
    await browser.close();
    console.log('\nScreenshots: A-live-admin.png, A-live-health.png');
} catch (e) {
    console.log('screenshot error: ' + e.message);
}
console.log('Saved -> ' + join(REPORTS, 'live-api-evidence.txt'));

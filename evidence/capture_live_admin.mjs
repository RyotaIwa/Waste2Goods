// Captures an AUTHENTICATED screenshot of the live admin analytics page (read-only).
// Uses W2G_TOKEN from env to seed localStorage so the SPA loads logged-in.
// Only aggregate stats are captured (no personal PII). Writes A-live-admin-authed.png
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const TOKEN = process.env.W2G_TOKEN;
const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://waste2goods.site';
if (!TOKEN) { console.error('W2G_TOKEN not set'); process.exit(1); }

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
// Seed the token under the keys the SPA reads (best-effort; exact key may vary).
await ctx.addInitScript(([tok]) => {
    try {
        localStorage.setItem('w2g_token', tok);
        localStorage.setItem('token', tok);
        localStorage.setItem('accessToken', tok);
        localStorage.setItem('w2g-auth', JSON.stringify({ token: tok, accessToken: tok }));
    } catch {}
}, [TOKEN]);

const page = await ctx.newPage();
try {
    await page.goto(BASE + '/admin', { waitUntil: 'networkidle', timeout: 40000 });
    await page.waitForTimeout(4000);
    // Try to navigate to analytics if a nav item exists
    const ana = page.getByText(/reports|analytics/i).first();
    if (await ana.count()) { await ana.click().catch(() => {}); await page.waitForTimeout(2500); }
    await page.screenshot({ path: join(HERE, 'screenshots', 'A-live-admin-authed.png'), fullPage: false });
    console.log('Saved A-live-admin-authed.png');
} catch (e) {
    console.log('screenshot error: ' + e.message);
} finally {
    await browser.close();
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { can, normalizeRole, isOwner } from './authorization.js';
import { originAllowed, extractOrigin, csrfOriginGuard } from './csrf.js';
import { pkceChallengeFromVerifierS256 } from './oauth2-server.js';
import { CDN_HEADERS } from './cdn.js';
import { LoginSchema } from './validate.js';

test('ABAC: admin can read analytics, resident cannot', () => {
  assert.equal(can({ role: 'admin' }, 'read', 'analytics').allow, true);
  assert.equal(can({ role: 'resident' }, 'read', 'analytics').allow, false);
});

test('ABAC: resident cannot modify another user', () => {
  const result = can(
    { role: 'resident', userId: 'U-001' },
    'update',
    'user',
    { resourceOwnerId: 'U-999' },
  );
  assert.equal(result.allow, false);
});

test('ownership helper matches userId', () => {
  assert.equal(isOwner({ userId: 'U-001' }, 'U-001'), true);
  assert.equal(isOwner({ userId: 'U-001' }, 'U-002'), false);
  assert.equal(normalizeRole('ADMIN'), 'admin');
});

test('PKCE S256 matches RFC 7636 appendix B', () => {
  const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
  assert.equal(pkceChallengeFromVerifierS256(verifier), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
});

test('CSRF origin allowlist', () => {
  assert.equal(originAllowed('http://localhost:5173'), true);
  assert.equal(originAllowed('https://evil.example'), false);
  assert.equal(extractOrigin({ headers: { origin: 'http://localhost:3001' } }), 'http://localhost:3001');
});

test('CSRF guard blocks hostile Origin on POST', () => {
  const req = { method: 'POST', headers: { origin: 'https://evil.example' } };
  const res = {
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let nextCalled = false;
  csrfOriginGuard(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(res.code, 403);
  assert.equal(res.body.code, 'CSRF_ORIGIN_DENIED');
});

test('CDN headers are Cloudflare/CloudFront compatible', () => {
  assert.match(CDN_HEADERS['Cache-Control'], /max-age=31536000/);
  assert.ok(CDN_HEADERS['Surrogate-Key'].includes('static-assets'));
});

test('Zod login schema rejects injection-like garbage', () => {
  const bad = LoginSchema.safeParse({ email: "a'; DROP TABLE users;--", password: 'x' });
  assert.equal(bad.success, false);
  const good = LoginSchema.safeParse({ email: 'resident@cabantian.ph', password: 'ResidentCabantian2025' });
  assert.equal(good.success, true);
});

test('GitHub OAuth info returns valid authorization and callback endpoint metadata', async () => {
  const { githubOAuthInfo } = await import('./github-oauth.js');
  const info = githubOAuthInfo();
  assert.equal(info.authorize, 'GET /api/auth/github');
  assert.equal(info.callback, 'GET /api/auth/github/callback');
  assert.ok(typeof info.configured === 'boolean');
});

test('Google OAuth info returns valid authorization and callback endpoint metadata', async () => {
  const { googleOAuthInfo } = await import('./google-oauth.js');
  const info = googleOAuthInfo();
  assert.equal(info.authorize, 'GET /api/auth/google');
  assert.equal(info.callback, 'GET /api/auth/google/callback');
  assert.ok(typeof info.configured === 'boolean');
});

test('XSS sanitization: escapeHtml neutralizes HTML/script injection payloads', async () => {
  const { escapeHtml, sanitizeOAuthState } = await import('./escape-html.js');
  const attack = '<script>alert("XSS")</script>&foo=\'bar\'';
  const escaped = escapeHtml(attack);
  assert.equal(escaped, '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;&amp;foo=&#39;bar&#39;');
  assert.ok(!escaped.includes('<script>'));
  assert.ok(!escaped.includes('"'));

  const maliciousState = '12345"><script>alert(1)</script>';
  const cleanState = sanitizeOAuthState(maliciousState);
  assert.equal(cleanState, '12345scriptalert1script');
  assert.ok(!cleanState.includes('<'));
  assert.ok(!cleanState.includes('>'));
  assert.ok(!cleanState.includes('"'));
});

test('Log injection defense: sanitizeLog strips carriage returns and newlines', async () => {
  const { sanitizeLog } = await import('./escape-html.js');
  const attack = 'resident@example.com\r\n[CRITICAL] Fake forged admin log entry\n';
  const clean = sanitizeLog(attack);
  assert.equal(clean, 'resident@example.com [CRITICAL] Fake forged admin log entry');
  assert.ok(!clean.includes('\r'));
  assert.ok(!clean.includes('\n'));
});

test('Open redirect defense: sanitizeRedirectUrl blocks hostile phishing URLs', async () => {
  const { isSafeRedirectUrl, sanitizeRedirectUrl } = await import('./escape-html.js');
  assert.equal(isSafeRedirectUrl('http://localhost:5173/'), true);
  assert.equal(isSafeRedirectUrl('http://192.168.1.10:5173/'), true);
  assert.equal(isSafeRedirectUrl('/security-dashboard'), true);
  assert.equal(isSafeRedirectUrl('https://evil-phishing-site.com/steal-token'), false);
  assert.equal(isSafeRedirectUrl('javascript:alert(1)'), false);
  assert.equal(isSafeRedirectUrl('//evil.com'), false);

  assert.equal(sanitizeRedirectUrl('https://evil.com/login', '/'), '/');
  assert.equal(sanitizeRedirectUrl('http://localhost:5173/', '/'), 'http://localhost:5173/');
});






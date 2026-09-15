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

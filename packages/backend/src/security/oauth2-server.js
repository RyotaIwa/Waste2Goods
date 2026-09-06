import { URL } from 'node:url';
import { randomBytes, createHash } from 'node:crypto';
import {
  issueAuthorizationCode, consumeAuthorizationCode,
  signAccessToken, issueRefreshToken, rotateRefreshToken,
  revokeRefreshToken, revokeJti, introspectToken, authHardeningInfo,
  JWT_ISSUER,
} from './auth-jwt.js';
import { redisBackendMode } from './redis-client.js';
import {
  oauthAuthorizeLimiter, oauthTokenLimiter,
} from './rate-limit.js';

const CLIENT_REGISTRY = [
  {
    clientId: 'mobile-app',
    clientName: 'Waste2Goods Resident Mobile App',
    clientType: 'public',
    pkceRequired: true,
    allowedGrantTypes: ['authorization_code', 'refresh_token'],
    allowedScopes: ['profile:read', 'rewards:redeem', 'transactions:read', 'kiosk:session', 'notifications:read'],
    redirectUris: [
      'http://localhost:5173/oauth/callback',
      'http://127.0.0.1:5173/oauth/callback',
      'http://localhost:5173/auth/oauth/callback',
      'waste2goods://oauth/callback',
    ],
    allowedCorsOrigins: [
      /^http:\/\/localhost(:[0-9]+)?$/,
      /^http:\/\/127\.0\.0\.1(:[0-9]+)?$/,
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:[0-9]+)?$/,
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:[0-9]+)?$/,
      /^http:\/\/172\.\d{1,3}\.\d{1,3}\.\d{1,3}(:[0-9]+)?$/,
    ],
    logo: '📱',
  },
  {
    clientId: 'admin-panel',
    clientName: 'Waste2Goods Admin Panel',
    clientType: 'confidential',
    clientSecret: 'admin-panel-secret-local-only',
    pkceRequired: false,
    allowedGrantTypes: ['authorization_code', 'refresh_token', 'client_credentials'],
    allowedScopes: ['admin:read', 'admin:write', 'profile:read', 'analytics:read'],
    redirectUris: [
      'http://localhost:5174/oauth/callback',
      'http://127.0.0.1:5174/oauth/callback',
      'http://localhost:5174/auth/oauth/callback',
    ],
    allowedCorsOrigins: [
      /^http:\/\/localhost(:[0-9]+)?$/,
      /^http:\/\/127\.0\.0\.1(:[0-9]+)?$/,
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:[0-9]+)?$/,
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:[0-9]+)?$/,
      /^http:\/\/172\.\d{1,3}\.\d{1,3}\.\d{1,3}(:[0-9]+)?$/,
    ],
    logo: '🛡️',
  },
  {
    clientId: 'kiosk-app',
    clientName: 'Waste2Goods Kiosk Terminal',
    clientType: 'public',
    pkceRequired: true,
    allowedGrantTypes: ['authorization_code', 'refresh_token', 'pin_extension'],
    allowedScopes: ['kiosk:ping', 'kiosk:session', 'transactions:write', 'profile:read'],
    redirectUris: [
      'http://localhost:5175/oauth/callback',
      'http://127.0.0.1:5175/oauth/callback',
      'http://localhost:5175/auth/oauth/callback',
    ],
    allowedCorsOrigins: [
      /^http:\/\/localhost(:[0-9]+)?$/,
      /^http:\/\/127\.0\.0\.1(:[0-9]+)?$/,
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:[0-9]+)?$/,
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:[0-9]+)?$/,
      /^http:\/\/172\.\d{1,3}\.\d{1,3}\.\d{1,3}(:[0-9]+)?$/,
    ],
    logo: '🖥️',
  },
  {
    clientId: 'waste2goods-docs',
    clientName: 'Waste2Goods Documentation / Demo',
    clientType: 'confidential',
    clientSecret: 'docs-demo-secret',
    pkceRequired: true,
    allowedGrantTypes: ['authorization_code', 'refresh_token'],
    allowedScopes: ['profile:read'],
    redirectUris: [
      'urn:ietf:wg:oauth:2.0:oob',
      'http://localhost:3001/api/oauth2/demo/callback',
    ],
    allowedCorsOrigins: [/^http:\/\/localhost(:[0-9]+)?$/],
    logo: '📘',
  },
];

const GRANT_TYPES = ['authorization_code', 'refresh_token', 'client_credentials', 'pin_extension'];

function findClient(clientId) {
  return CLIENT_REGISTRY.find((c) => c.clientId === String(clientId || '').trim());
}

function uriMatches(allowedList, incoming) {
  if (!incoming) return false;
  for (const a of allowedList) {
    if (typeof a === 'string' && a === incoming) return true;
    if (a instanceof RegExp && a.test(incoming)) return true;
    if (typeof a === 'function' && a(incoming)) return true;
  }
  return false;
}

function buildScopeList(client, requestedScopeStr) {
  const requested = (requestedScopeStr || '')
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (requested.length === 0) return client.allowedScopes.slice(0, 2).join(' ');
  const filtered = requested.filter((s) => client.allowedScopes.includes(s));
  return filtered.join(' ');
}

function pkceChallengeFromVerifierS256(verifier) {
  return createHash('sha256').update(String(verifier || '')).digest('base64url');
}

function consentScreenHtml(client, requestedScope, state, authorizeQuery, sessionUser) {
  const scopes = (requestedScope || '').split(/\s+/).filter(Boolean);
  const scopeDescriptions = {
    'profile:read':       'Read your profile info (name, email, points, barangay)',
    'rewards:redeem':     'Redeem rewards with your earned recycling points',
    'transactions:read':  'View your recycling transaction history and stats',
    'transactions:write': 'Record drop-off weights at the kiosk on your behalf',
    'kiosk:ping':         'Keep kiosk connection alive during your drop-off session',
    'kiosk:session':      'Initiate and manage kiosk recycling sessions',
    'notifications:read': 'Read redemption and milestone notifications',
    'admin:read':         'Read admin-only data (users, transactions, analytics, redemptions)',
    'admin:write':        'Create/update rewards, redemptions, users, kiosk calibration',
    'analytics:read':     'Read platform-wide analytics, summaries and leaderboard data',
  };
  const scopeHtml = scopes.map((s) => `
    <li class="scope-row"><span class="scope-ico">🔒</span><div><strong>${s}</strong><p>${scopeDescriptions[s] || 'Scope ' + s}</p></div></li>
  `).join('');

  const userHtml = sessionUser
    ? `<p class="user-line">Signed in as: <strong>${sessionUser.name}</strong> &lt;${sessionUser.email || sessionUser.sub || 'anon'}&gt; · role: ${sessionUser.role}</p>`
    : `<p class="user-line warn">⚠️ Not signed in — you will be asked for credentials next.</p>`;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>Waste2Goods — Authorize ${client.clientName}</title>
    <style>
      *{box-sizing:border-box} body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto;background:linear-gradient(135deg,#0b3d2e,#117243 55%,#5b9f31);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;color:#0a0a0a}
      .card{width:100%;max-width:560px;background:#ffffff;border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.25);overflow:hidden}
      .head{padding:22px 26px;background:#0a6a3b;color:#fff;display:flex;align-items:center;gap:14px}
      .logo{width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font-size:26px}
      .title{font-size:18px;font-weight:700;line-height:1.25}
      .sub{font-size:12px;opacity:.85;margin-top:4px}
      .body{padding:22px 26px}
      .row{display:flex;align-items:center;gap:14px;padding:14px 12px;border:1px dashed #cfe3d6;border-radius:12px;background:#f2fbf5}
      .c-logo{font-size:30px}
      .auth-arrow{font-size:22px;opacity:.65}
      .scopes-title{font-size:13px;font-weight:700;color:#0a6a3b;margin:18px 2px 8px;letter-spacing:.5px;text-transform:uppercase}
      .scope-list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px}
      .scope-row{display:flex;gap:12px;padding:10px 12px;border-radius:10px;background:#f6f7f8;align-items:flex-start}
      .scope-ico{margin-top:2px;color:#0a6a3b}
      .scope-row strong{font-size:13px}
      .scope-row p{margin:2px 0 0;font-size:12px;color:#4d5660}
      .user-line{font-size:13px;background:#eef7ff;border:1px solid #d1e6ff;padding:10px 12px;border-radius:10px;color:#123;margin:14px 0 0}
      .user-line.warn{background:#fff5eb;border-color:#ffd9ad;color:#7a4a00}
      .actions{display:flex;gap:10px;margin-top:18px}
      button{border:0;border-radius:10px;padding:12px 14px;font-weight:700;cursor:pointer;font-size:14px;flex:1;transition:transform .05s}
      button:active{transform:translateY(1px)}
      .allow{background:linear-gradient(135deg,#0a6a3b,#19a05b);color:#fff;box-shadow:0 8px 18px rgba(10,106,59,.3)}
      .deny{background:#f2f3f5;color:#3a444f;border:1px solid #e2e5ea}
      .form{display:contents}
      .meta{font-size:11px;color:#6d7885;margin-top:14px;word-break:break-all}
      .chip{display:inline-block;padding:3px 8px;background:#e7efef;color:#0a6a3b;border-radius:999px;font-size:11px;font-weight:700;margin-right:6px}
    </style></head><body><div class="card">
      <div class="head">
        <div class="logo">♻️</div>
        <div>
          <div class="title">Waste2Goods — OAuth 2.0 Authorization</div>
          <div class="sub">Issuer: ${JWT_ISSUER} · backend: ${redisBackendMode()}</div>
        </div>
      </div>
      <div class="body">
        <div class="row">
          <div class="c-logo">${client.logo}</div>
          <div><strong>${client.clientName}</strong><p style="margin:2px 0 0;color:#4d5660;font-size:12px">Client ID: <code>${client.clientId}</code> · ${client.pkceRequired ? '<span class="chip">PKCE required</span>' : ''}<span class="chip">${client.clientType}</span></p></div>
          <div class="auth-arrow">➡️</div>
          <div class="c-logo">♻️</div>
          <div><strong>Waste2Goods Auth Server</strong><p style="margin:2px 0 0;color:#4d5660;font-size:12px">Issue access + refresh tokens</p></div>
        </div>
        <div class="scopes-title">The app is requesting these permissions:</div>
        <ul class="scope-list">${scopeHtml || '<li class="scope-row"><em>No scopes requested.</em></li>'}</ul>
        ${userHtml}
        <form class="form" method="POST" action="/api/oauth2/authorize/consent">
          ${Object.entries(authorizeQuery || {}).map(([k, v]) => `<input type="hidden" name="${k}" value="${String(v || '').replace(/"/g, '&quot;')}"/>`).join('')}
          <div class="actions">
            <button type="submit" class="deny" name="decision" value="deny">Cancel / Deny</button>
            <button type="submit" class="allow" name="decision" value="allow">✅ Allow — Issue Authorization Code</button>
          </div>
        </form>
        <div class="meta"><strong>state:</strong> ${state || '(none)'} · <strong>redirect_uri:</strong> ${authorizeQuery?.redirect_uri || ''}</div>
      </div></div></body></html>`;
}

export function getOAuthClients() {
  return CLIENT_REGISTRY.map(({ clientSecret, ...rest }) => rest);
}

export function oauthDiscovery() {
  const auth = authHardeningInfo();
  return {
    issuer: JWT_ISSUER,
    authorization_endpoint: '/api/oauth2/authorize',
    token_endpoint: '/api/oauth2/token',
    introspection_endpoint: '/api/oauth2/introspect',
    revocation_endpoint: '/api/oauth2/revoke',
    response_types_supported: ['code'],
    grant_types_supported: GRANT_TYPES,
    scopes_supported: Array.from(new Set(CLIENT_REGISTRY.flatMap((c) => c.allowedScopes))),
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none (PKCE public clients)'],
    code_challenge_methods_supported: ['S256', 'plain'],
    ui_locales_supported: ['en'],
    backend: redisBackendMode(),
    tokenHardening: auth.jwt,
  };
}

export function handleAuthorizeGet(req, res, sessionUser) {
  const {
    response_type, client_id, redirect_uri, scope, state, nonce,
    code_challenge, code_challenge_method,
  } = req.query;

  if (response_type !== 'code') {
    return callbackError(res, redirect_uri, 'unsupported_response_type', state || null, 'Only response_type=code supported (Authorization Code Flow)');
  }
  const client = findClient(client_id);
  if (!client) {
    return res.status(400).json({ error: 'invalid_client', error_description: 'Unknown client_id' });
  }
  if (!redirect_uri || !client.redirectUris.includes(String(redirect_uri).trim())) {
    return res.status(400).json({ error: 'invalid_redirect_uri', clientId: client.clientId, allowed: client.redirectUris });
  }
  if (client.pkceRequired && !code_challenge) {
    return res.status(400).json({ error: 'invalid_request', error_description: `PKCE code_challenge required for ${client.clientId}. Use code_challenge + code_challenge_method=S256.` });
  }
  const cleanScope = buildScopeList(client, scope);
  const html = consentScreenHtml(client, cleanScope, state, {
    response_type, client_id, redirect_uri, scope: cleanScope, state, nonce,
    code_challenge: code_challenge || null, code_challenge_method: code_challenge_method || (client.pkceRequired ? 'S256' : null),
  }, sessionUser);
  res.type('text/html; charset=utf-8');
  return res.status(200).send(html);
}

export async function handleAuthorizeConsentPost(req, res, sessionUser) {
  const {
    response_type, client_id, redirect_uri, scope, state, nonce,
    code_challenge, code_challenge_method, decision,
  } = { ...req.query, ...req.body };
  const client = findClient(client_id);
  if (!client) return res.status(400).json({ error: 'invalid_client' });
  if (!redirect_uri) return res.status(400).json({ error: 'invalid_redirect_uri' });
  if (decision !== 'allow') {
    return callbackError(res, redirect_uri, 'access_denied', state || null, 'User denied consent');
  }
  if (!sessionUser) {
    return callbackError(res, redirect_uri, 'login_required', state || null, 'Please authenticate via /api/auth/login before authorizing');
  }
  try {
    const cleanScope = buildScopeList(client, scope);
    const { authorizationCode } = await issueAuthorizationCode({
      sub: sessionUser.sub, userId: sessionUser.userId || null,
      adminId: sessionUser.adminId || null, kioskId: sessionUser.kioskId || null,
      role: sessionUser.role, name: sessionUser.name || '', barangayId: sessionUser.barangayId || null,
    }, {
      clientId: client.clientId, redirectUri: redirect_uri,
      scope: cleanScope, nonce: nonce || null,
      codeChallenge: code_challenge || null, codeChallengeMethod: code_challenge_method || 'S256',
    });
    const sep = String(redirect_uri).includes('?') ? '&' : '?';
    const redirectTo = `${redirect_uri}${sep}code=${encodeURIComponent(authorizationCode)}&state=${encodeURIComponent(state || '')}`;
    return res.redirect(302, redirectTo);
  } catch (err) {
    return callbackError(res, redirect_uri, 'server_error', state || null, err.message);
  }
}

export async function handleTokenPost(req, res) {
  const {
    grant_type, code, redirect_uri, client_id, client_secret,
    refresh_token, code_verifier,
  } = { ...req.query, ...req.body };

  if (!GRANT_TYPES.includes(String(grant_type || ''))) {
    return res.status(400).json({ error: 'unsupported_grant_type', error_description: `Supported: ${GRANT_TYPES.join(', ')}` });
  }

  if (grant_type === 'authorization_code') {
    const client = findClient(client_id);
    if (!client) return res.status(400).json({ error: 'invalid_client' });
    if (client.clientType === 'confidential') {
      if (client.clientSecret && client_secret && client_secret !== client.clientSecret) {
        return res.status(400).json({ error: 'invalid_client', error_description: 'Bad client_secret' });
      }
    }
    try {
      const tokens = await consumeAuthorizationCode(code || '', {
        redirectUri: redirect_uri || null,
        codeVerifier: code_verifier || null,
      });
      return res.json({
        access_token: tokens.accessToken,
        token_type: tokens.tokenType || 'Bearer',
        expires_in: Number(tokens.expiresIn),
        refresh_token: tokens.refreshToken,
        refresh_expires_in: Number(tokens.expiresInRefresh || 604800),
        scope: tokens.scope || null,
        jti: tokens.jti || null,
      });
    } catch (err) {
      return res.status(400).json({ error: 'invalid_grant', error_description: err.message });
    }
  }

  if (grant_type === 'refresh_token') {
    try {
      const tokens = await rotateRefreshToken(refresh_token || '');
      return res.json({
        access_token: tokens.accessToken,
        token_type: tokens.tokenType || 'Bearer',
        expires_in: Number(tokens.expiresIn),
        refresh_token: tokens.refreshToken,
        refresh_expires_in: Number(tokens.expiresInRefresh || 604800),
        scope: tokens.scope || null,
        jti: tokens.jti || null,
      });
    } catch (err) {
      return res.status(400).json({ error: 'invalid_grant', error_description: err.message });
    }
  }

  if (grant_type === 'client_credentials') {
    const client = findClient(client_id);
    if (!client) return res.status(400).json({ error: 'invalid_client' });
    if (client.clientType !== 'confidential' || client.clientSecret !== client_secret) {
      return res.status(401).json({ error: 'invalid_client', error_description: 'Confidential client credentials required' });
    }
    if (!client.allowedGrantTypes.includes('client_credentials')) {
      return res.status(400).json({ error: 'unauthorized_client' });
    }
    const token = signAccessToken({ role: 'kiosk', kioskId: `CC-${client.clientId}`, name: client.clientName, clientId: client.clientId }, { clientId: client.clientId, scope: buildScopeList(client, '') });
    return res.json({
      access_token: token.accessToken,
      token_type: token.tokenType || 'Bearer',
      expires_in: Number(token.expiresIn),
      scope: token.scope || null,
      jti: token.jti || null,
    });
  }

  if (grant_type === 'pin_extension') {
    const kioskPin = String(req.body?.pin || req.query?.pin || '');
    if (kioskPin !== String(process.env.KIOSK_PIN || '7890')) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid kiosk PIN' });
    }
    const token = signAccessToken({ role: 'kiosk', kioskId: 'KIOSK-01', name: 'Kiosk PIN Session', clientId: client_id || 'kiosk-app' }, { clientId: client_id || 'kiosk-app', scope: 'kiosk:ping kiosk:session transactions:write profile:read' });
    const refresh = await issueRefreshToken({ role: 'kiosk', kioskId: 'KIOSK-01', name: 'Kiosk PIN Session' }, { clientId: client_id || 'kiosk-app' });
    return res.json({
      access_token: token.accessToken,
      token_type: token.tokenType || 'Bearer',
      expires_in: Number(token.expiresIn),
      refresh_token: refresh.refreshToken,
      refresh_expires_in: Number(refresh.expiresIn),
      scope: token.scope,
      jti: token.jti,
    });
  }

  return res.status(400).json({ error: 'invalid_grant' });
}

export async function handleIntrospectPost(req, res) {
  const { token, token_type_hint, client_id, client_secret } = { ...req.query, ...req.body };
  if (client_id) {
    const client = findClient(client_id);
    if (!client) return res.status(401).json({ error: 'invalid_client' });
    if (client.clientType === 'confidential' && client.clientSecret !== client_secret) {
      return res.status(401).json({ error: 'invalid_client' });
    }
  }
  if (String(req.headers.authorization || '').startsWith('Bearer ')) {
    try {
      const headerToken = String(req.headers.authorization || '').slice(7);
      const check = introspectToken(headerToken, null);
      if (!check.active) return res.status(401).json({ error: 'invalid_token' });
    } catch { return res.status(401).json({ error: 'invalid_token' }); }
  }
  if (!token) return res.json({ active: false });
  const result = introspectToken(token || '', token_type_hint || null);
  return res.json(result);
}

export async function handleRevokePost(req, res) {
  const { token, token_type_hint, client_id, client_secret } = { ...req.query, ...req.body };
  if (client_id) {
    const client = findClient(client_id);
    if (!client) return res.status(401).json({ error: 'invalid_client' });
    if (client.clientType === 'confidential' && client.clientSecret !== client_secret) {
      return res.status(401).json({ error: 'invalid_client' });
    }
  }
  if (!token) return res.status(200).json({ revoked: false, reason: 'no token provided' });
  if (token_type_hint === 'access_token' || !token_type_hint) {
    try {
      const decoded = introspectToken(token, null);
      if (decoded.active && decoded.jti) await revokeJti(decoded.jti);
    } catch { /* ignore */ }
  }
  if (token_type_hint === 'refresh_token' || !token_type_hint) {
    try { await revokeRefreshToken(token); } catch { /* ignore */ }
  }
  return res.status(200).json({ revoked: true, revokedAt: new Date().toISOString() });
}

function callbackError(res, redirectUri, error, state, description) {
  if (!redirectUri) return res.status(400).json({ error, error_description: description || error, state });
  const sep = String(redirectUri).includes('?') ? '&' : '?';
  const q = new URLSearchParams({ error, state: state || '' });
  if (description) q.set('error_description', String(description));
  return res.redirect(302, `${redirectUri}${sep}${q.toString()}`);
}

export function oauth2RouterAttach(app, opts = {}) {
  const authenticate = opts.authenticate || ((req, res, next) => next());

  app.get('/api/oauth2/.well-known/oauth-authorization-server', (req, res) => res.json(oauthDiscovery()));
  app.get('/.well-known/oauth-authorization-server', (req, res) => res.json(oauthDiscovery()));

  app.get('/api/oauth2/clients', (req, res) => {
    res.json({ issuer: JWT_ISSUER, clients: getOAuthClients(), backend: redisBackendMode() });
  });

  app.get('/api/oauth2/authorize', oauthAuthorizeLimiter, authenticate, (req, res) => {
    const user = req.user || null;
    handleAuthorizeGet(req, res, user);
  });

  app.post('/api/oauth2/authorize/consent', oauthAuthorizeLimiter,
    expressUrlEncoded(), authenticate, (req, res) => {
      const user = req.user || null;
      handleAuthorizeConsentPost(req, res, user);
    });

  app.post('/api/oauth2/token', oauthTokenLimiter, expressJsonSafe(), (req, res) => {
    handleTokenPost(req, res);
  });

  app.post('/api/oauth2/introspect', oauthTokenLimiter, expressJsonSafe(), (req, res) => {
    handleIntrospectPost(req, res);
  });

  app.post('/api/oauth2/revoke', oauthTokenLimiter, expressJsonSafe(), (req, res) => {
    handleRevokePost(req, res);
  });

  app.get('/api/oauth2/demo/callback', (req, res) => {
    const code = req.query?.code || null;
    const state = req.query?.state || null;
    const error = req.query?.error || null;
    res.type('text/html');
    if (error) {
      return res.status(400).send(`<!doctype html><title>OAuth Error</title><body style="font-family:sans-serif;padding:24px"><h2 style="color:#a33">❌ OAuth error: ${error}</h2><pre style="background:#f5f5f5;padding:12px;border-radius:8px">${JSON.stringify(req.query, null, 2)}</pre><a href="/api/oauth2/clients">Back to clients</a></body></html>`);
    }
    res.status(200).send(`<!doctype html><title>OAuth Callback — Demo</title><body style="font-family:sans-serif;padding:24px;max-width:720px;margin:0 auto">
      <h1 style="color:#0a6a3b">🎯 Authorization Code Issued</h1>
      <p><strong>Next step:</strong> Exchange this <code>code</code> for tokens via POST /api/oauth2/token (grant_type=authorization_code). If PKCE was used, include the matching <code>code_verifier</code>.</p>
      <h3>Query received:</h3><pre style="background:#0e1b15;color:#39ff9a;padding:14px;border-radius:10px">${JSON.stringify({ code, state }, null, 2)}</pre>
      <hr/>
      <h3>Quick curl command (no PKCE — client <code>admin-panel</code> confidential):</h3>
<pre style="background:#0f172a;color:#e2e8f0;padding:14px;border-radius:10px;overflow:auto">curl -X POST http://localhost:3001/api/oauth2/token \\
  -H "Content-Type: application/json" \\
  -d '{"grant_type":"authorization_code","code":"${code || '<YOUR_CODE>'}","redirect_uri":"http://localhost:3001/api/oauth2/demo/callback","client_id":"admin-panel","client_secret":"admin-panel-secret-local-only","code_verifier":"<YOUR_VERIFIER_IF_PKCE>"}'</pre>
      <p><a href="/api/oauth2/clients">← OAuth clients list</a></p></body></html>`);
  });
}

function expressUrlEncoded() {
  try {
    const express = require ? null : null;
  } catch { /* ignore */ }
  return (req, res, next) => {
    if (req.headers['content-type'] && req.headers['content-type'].startsWith('application/x-www-form-urlencoded')) {
      let chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString('utf8');
          const params = new URLSearchParams(body);
          req.body = Object.fromEntries([...(params.entries()), ...Object.entries(req.body || {})]);
        } catch { /* ignore */ }
        next();
      });
      return;
    }
    next();
  };
}

function expressJsonSafe() {
  return (req, res, next) => {
    const ct = String(req.headers['content-type'] || '');
    if (ct.startsWith('application/json') || ct.startsWith('text/json')) {
      if (req.body && typeof req.body === 'object') return next();
      let chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        try { req.body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { req.body = req.body || {}; }
        next();
      });
      return;
    }
    if (ct.startsWith('application/x-www-form-urlencoded')) {
      let chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString('utf8');
          const params = new URLSearchParams(body);
          req.body = Object.fromEntries([...(params.entries()), ...Object.entries(req.body || {})]);
        } catch { /* ignore */ }
        next();
      });
      return;
    }
    next();
  };
}

export default {
  CLIENT_REGISTRY, GRANT_TYPES, findClient, getOAuthClients, oauthDiscovery,
  handleAuthorizeGet, handleAuthorizeConsentPost, handleTokenPost,
  handleIntrospectPost, handleRevokePost, oauth2RouterAttach,
  pkceChallengeFromVerifierS256,
};

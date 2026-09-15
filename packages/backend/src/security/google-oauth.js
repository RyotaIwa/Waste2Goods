import crypto from 'node:crypto';
import { redisSet, redisGet, redisDel, redisBackendMode } from './redis-client.js';
import { signAccessToken, issueRefreshToken } from './auth-jwt.js';
import { findOrCreateOAuthUser } from './oauth-user-store.js';

const STATE_PREFIX = 'google:oauth:state:';
const CODE_PREFIX = 'google:oauth:code:';
const DEMO_GOOGLE_USER = {
  id: 'GOOGLE-10928374',
  name: 'Google Demo Resident',
  email: 'resident@cabantian.ph',
  role: 'resident',
};

function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function callbackUrl(req) {
  return process.env.GOOGLE_CALLBACK_URL
    || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
}

async function saveState(state, payload) {
  await redisSet(`${STATE_PREFIX}${state}`, payload, 10 * 60);
}

async function loadState(state) {
  const raw = await redisGet(`${STATE_PREFIX}${state}`);
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

export function googleOAuthInfo() {
  return {
    provider: googleConfigured() ? 'accounts.google.com' : 'local-demo-idp (Google-compatible Authorization Code)',
    configured: googleConfigured(),
    authorize: 'GET /api/auth/google',
    callback: 'GET /api/auth/google/callback',
    flow: 'Authorization Code (RFC 6749) with CSRF state. Set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET to use live Google Cloud.',
    backend: redisBackendMode(),
  };
}

export function attachGoogleOAuth(app) {
  app.get('/api/auth/google', async (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    const returnTo = String(req.query.return_to || '/security-dashboard');
    await saveState(state, { returnTo, createdAt: Date.now() });

    if (googleConfigured()) {
      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: callbackUrl(req),
        response_type: 'code',
        scope: 'openid profile email',
        state,
        access_type: 'offline',
        prompt: 'consent',
      });
      return res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
    }

    return res.redirect(302, `/api/auth/google/demo?state=${encodeURIComponent(state)}`);
  });

  app.get('/api/auth/google/demo', (req, res) => {
    const state = String(req.query.state || '');
    res.type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>Sign in with Google (Demo IdP)</title>
<style>body{font-family:ui-sans-serif,system-ui;background:#f8fafc;color:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;max-width:440px;box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1)}
.google-btn{background:#ffffff;color:#1e293b;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;font-weight:600;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:10px;font-size:15px}
.google-btn:hover{background:#f1f5f9}
a{color:#2563eb}</style></head><body>
<div class="card">
  <h2 style="margin-top:0">Sign in with Google</h2>
  <p style="color:#64748b;font-size:14px">Local Demo Identity Provider (zero configuration). Simulates the exact RFC 6749 Authorization Code + <code>state</code> CSRF flow on localhost.</p>
  <form method="post" action="/api/auth/google/demo/approve">
    <input type="hidden" name="state" value="${state.replace(/"/g, '')}"/>
    <button class="google-btn" type="submit">
      <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
      Continue as ${DEMO_GOOGLE_USER.name}
    </button>
  </form>
  <p style="font-size:12px;color:#94a3b8;margin-top:16px">Set <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> in <code>.env</code> to redirect to live Google accounts.</p>
  <p style="font-size:13px"><a href="/security-dashboard">← Back to Security Dashboard</a></p>
</div></body></html>`);
  });

  app.post('/api/auth/google/demo/approve', async (req, res) => {
    const state = String(req.body?.state || req.query?.state || '');
    const saved = await loadState(state);
    if (!saved) {
      return res.status(400).type('html').send('<p>invalid_state — restart at /api/auth/google</p>');
    }
    const code = `googled_${crypto.randomBytes(12).toString('hex')}`;
    await redisSet(`${CODE_PREFIX}${code}`, { ...DEMO_GOOGLE_USER, state }, 10 * 60);
    const cb = `/api/auth/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    return res.redirect(302, cb);
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    const { code, state, error } = req.query;
    if (error) {
      return res.status(400).json({ error: String(error) });
    }
    const saved = await loadState(String(state || ''));
    if (!saved) {
      return res.status(400).json({ error: 'invalid_state', error_description: 'CSRF state missing or expired' });
    }
    await redisDel(`${STATE_PREFIX}${state}`);

    let profile = DEMO_GOOGLE_USER;
    if (googleConfigured() && code) {
      try {
        profile = await exchangeGoogleCode(String(code), callbackUrl(req));
      } catch (err) {
        return res.status(400).json({ error: 'google_token_exchange_failed', detail: err.message });
      }
    } else {
      const raw = await redisGet(`${CODE_PREFIX}${code}`);
      if (!raw) return res.status(400).json({ error: 'invalid_grant', error_description: 'Unknown demo authorization code' });
      await redisDel(`${CODE_PREFIX}${code}`);
      profile = typeof raw === 'string' ? JSON.parse(raw) : raw;
    }

    const userRecord = await findOrCreateOAuthUser(profile, { provider: 'google' });
    const access = signAccessToken({
      userId: userRecord.userId,
      role: userRecord.role,
      name: userRecord.name,
      email: userRecord.email,
      barangayId: userRecord.barangayId,
    });
    const refresh = await issueRefreshToken({
      userId: userRecord.userId,
      role: userRecord.role,
      name: userRecord.name,
      barangayId: userRecord.barangayId,
    });

    if (saved?.returnTo && (saved.returnTo.startsWith('http://') || saved.returnTo.startsWith('https://'))) {
      const sep = saved.returnTo.includes('?') ? '&' : '?';
      const redirectTarget = `${saved.returnTo}${sep}token=${encodeURIComponent(access.accessToken)}&refreshToken=${encodeURIComponent(refresh.refreshToken)}&userId=${encodeURIComponent(userRecord.userId)}&name=${encodeURIComponent(userRecord.name)}&email=${encodeURIComponent(userRecord.email)}`;
      return res.redirect(302, redirectTarget);
    }

    res.type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>Google OAuth Complete</title>
<style>body{font-family:ui-sans-serif,system-ui;max-width:760px;margin:40px auto;padding:0 16px;color:#0f172a}
pre{background:#0f172a;color:#86efac;padding:14px;border-radius:10px;overflow:auto;font-size:12px}
.btn{display:inline-block;background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px}
</style></head><body>
<h1>Google OAuth Authorization Code Exchanged</h1>
<p>Provider: <strong>${googleConfigured() ? 'accounts.google.com' : 'Local Demo IdP (Google OAuth 2.0 flow)'}</strong>. User ${userRecord.created ? 'created' : 'found'} in MySQL (userId=${userRecord.userId}). Code exchanged for Waste2Goods JWT:</p>
<pre>${JSON.stringify({
      user: { userId: userRecord.userId, name: userRecord.name, email: userRecord.email, role: userRecord.role, created: userRecord.created },
      access_token: access.accessToken,
      token_type: 'Bearer',
      expires_in: access.expiresIn,
      refresh_token: refresh.refreshToken,
      jti: access.jti,
    }, null, 2)}</pre>
<p>Use this access token as <code>Authorization: Bearer …</code> on protected APIs.</p>
<p><a class="btn" href="/security-dashboard">Go to Security Dashboard</a></p>
</body></html>`);
  });
}

async function exchangeGoogleCode(code, redirectUri) {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) {
    throw new Error(tokenJson.error_description || tokenJson.error || 'no access_token from Google');
  }
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const user = await userRes.json();
  return {
    id: `GOOGLE-${user.id}`,
    name: user.name || user.email,
    email: user.email,
  };
}

export default { attachGoogleOAuth, googleOAuthInfo };

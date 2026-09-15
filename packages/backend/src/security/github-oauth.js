import crypto from 'node:crypto';
import { redisSet, redisGet, redisDel, redisBackendMode } from './redis-client.js';
import { signAccessToken, issueRefreshToken } from './auth-jwt.js';
import { findOrCreateOAuthUser } from './oauth-user-store.js';

const STATE_PREFIX = 'gh:oauth:state:';
const CODE_PREFIX = 'gh:oauth:code:';
const DEMO_USER = {
  id: 'GH-4242',
  login: 'cabantian-recycler',
  name: 'GitHub Demo Resident',
  email: 'resident@cabantian.ph',
  role: 'resident',
};

function githubConfigured() {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

function callbackUrl(req) {
  return process.env.GITHUB_CALLBACK_URL
    || `${req.protocol}://${req.get('host')}/api/auth/github/callback`;
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

export function githubOAuthInfo() {
  return {
    provider: githubConfigured() ? 'github.com' : 'local-demo-idp (GitHub-compatible Authorization Code)',
    configured: githubConfigured(),
    authorize: 'GET /api/auth/github',
    callback: 'GET /api/auth/github/callback',
    flow: 'Authorization Code (RFC 6749) with CSRF state. Set GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET to use real GitHub.',
    backend: redisBackendMode(),
  };
}

export function attachGitHubOAuth(app) {
  app.get('/api/auth/github', async (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    const returnTo = String(req.query.return_to || '/security-dashboard');
    await saveState(state, { returnTo, createdAt: Date.now() });

    if (githubConfigured()) {
      const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: callbackUrl(req),
        scope: 'read:user user:email',
        state,
        allow_signup: 'false',
      });
      return res.redirect(302, `https://github.com/login/oauth/authorize?${params}`);
    }

    return res.redirect(302, `/api/auth/github/demo?state=${encodeURIComponent(state)}`);
  });

  app.get('/api/auth/github/demo', (req, res) => {
    const state = String(req.query.state || '');
    res.type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>Demo GitHub IdP</title>
<style>body{font-family:ui-sans-serif,system-ui;background:#0d1117;color:#e6edf3;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:28px;max-width:420px}
button{background:#238636;color:#fff;border:0;border-radius:8px;padding:10px 16px;font-weight:700;cursor:pointer;width:100%}
a{color:#58a6ff}</style></head><body>
<div class="card">
  <h1>Sign in with GitHub</h1>
  <p>Demo identity provider (no GitHub App secrets). Same Authorization Code + <code>state</code> CSRF pattern as github.com.</p>
  <form method="post" action="/api/auth/github/demo/approve">
    <input type="hidden" name="state" value="${state.replace(/"/g, '')}"/>
    <button type="submit">Continue as ${DEMO_USER.login}</button>
  </form>
  <p style="font-size:12px;color:#8b949e">Set <code>GITHUB_CLIENT_ID</code> / <code>GITHUB_CLIENT_SECRET</code> to use real GitHub.</p>
  <p><a href="/security-dashboard">Back to dashboard</a></p>
</div></body></html>`);
  });

  app.post('/api/auth/github/demo/approve', async (req, res) => {
    const state = String(req.body?.state || req.query?.state || '');
    const saved = await loadState(state);
    if (!saved) {
      return res.status(400).type('html').send('<p>invalid_state — restart at /api/auth/github</p>');
    }
    const code = `ghd_${crypto.randomBytes(12).toString('hex')}`;
    await redisSet(`${CODE_PREFIX}${code}`, { ...DEMO_USER, state }, 10 * 60);
    const cb = `/api/auth/github/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    return res.redirect(302, cb);
  });

  app.get('/api/auth/github/callback', async (req, res) => {
    const { code, state, error } = req.query;
    if (error) {
      return res.status(400).json({ error: String(error) });
    }
    const saved = await loadState(String(state || ''));
    if (!saved) {
      return res.status(400).json({ error: 'invalid_state', error_description: 'CSRF state missing or expired' });
    }
    await redisDel(`${STATE_PREFIX}${state}`);

    let profile = DEMO_USER;
    if (githubConfigured() && code) {
      try {
        profile = await exchangeGitHubCode(String(code), callbackUrl(req));
      } catch (err) {
        return res.status(400).json({ error: 'github_token_exchange_failed', detail: err.message });
      }
    } else {
      const raw = await redisGet(`${CODE_PREFIX}${code}`);
      if (!raw) return res.status(400).json({ error: 'invalid_grant', error_description: 'Unknown demo authorization code' });
      await redisDel(`${CODE_PREFIX}${code}`);
      profile = typeof raw === 'string' ? JSON.parse(raw) : raw;
    }

    const userRecord = await findOrCreateOAuthUser(profile, { provider: 'github' });
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

    res.type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>GitHub OAuth complete</title>
<style>body{font-family:ui-sans-serif,system-ui;max-width:760px;margin:40px auto;padding:0 16px;color:#0f172a}
pre{background:#0f172a;color:#86efac;padding:14px;border-radius:10px;overflow:auto;font-size:12px}</style></head><body>
<h1>GitHub Authorization Code exchanged</h1>
<p>Provider: <strong>${githubConfigured() ? 'github.com' : 'local demo IdP'}</strong>. User ${userRecord.created ? 'created' : 'found'} in MySQL (userId=${userRecord.userId}). Code was one-time; this page holds the resulting Waste2Goods JWT.</p>
<pre>${JSON.stringify({
      user: { userId: userRecord.userId, login: profile.login || profile.name, email: userRecord.email, role: userRecord.role, created: userRecord.created },
      access_token: access.accessToken,
      token_type: 'Bearer',
      expires_in: access.expiresIn,
      refresh_token: refresh.refreshToken,
      jti: access.jti,
    }, null, 2)}</pre>
<p>Use the access token as <code>Authorization: Bearer …</code> on APIs. <a href="/security-dashboard">Dashboard</a></p>
</body></html>`);
  });
}

async function exchangeGitHubCode(code, redirectUri) {
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) {
    throw new Error(tokenJson.error_description || tokenJson.error || 'no access_token from GitHub');
  }
  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'waste2goods' },
  });
  const user = await userRes.json();
  return {
    id: `GH-${user.id}`,
    login: user.login,
    name: user.name || user.login,
    email: user.email || `${user.login}@users.noreply.github.com`,
  };
}

export default { attachGitHubOAuth, githubOAuthInfo };

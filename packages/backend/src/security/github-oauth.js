import crypto from 'node:crypto';
import { redisSet, redisGet, redisDel, redisBackendMode } from './redis-client.js';
import { signAccessToken, issueRefreshToken } from './auth-jwt.js';
import { findOrCreateOAuthUser } from './oauth-user-store.js';
import { sanitizeRedirectUrl, safeRedirect } from './escape-html.js';

const STATE_PREFIX = 'gh:oauth:state:';
const CODE_PREFIX = 'gh:oauth:code:';
const DEMO_USER = {
  id: 'GH-42429817',
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
    flow: 'Authorization Code (RFC 6749) with CSRF state. Set GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET to use live GitHub OAuth.',
    backend: redisBackendMode(),
  };
}

export function attachGitHubOAuth(app) {
  app.get('/api/auth/github', async (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    let returnTo = sanitizeRedirectUrl(String(req.query.return_to || '/security-dashboard'), '/security-dashboard');
    try {
      if (returnTo.startsWith('http://') || returnTo.startsWith('https://')) {
        const u = new URL(returnTo);
        if (u.pathname.includes('/api/auth') || u.pathname.includes('192.168.') || u.pathname.includes('localhost')) {
          returnTo = `${u.origin}/`;
        }
      }
    } catch { /* ignore */ }
    returnTo = sanitizeRedirectUrl(returnTo, '/security-dashboard');
    await saveState(state, { returnTo, createdAt: Date.now() });

    if (githubConfigured() && process.env.USE_DEMO_OAUTH !== 'true') {
      const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: callbackUrl(req),
        scope: 'read:user user:email',
        state,
        allow_signup: 'true',
      });
      return safeRedirect(res, `https://github.com/login/oauth/authorize?${params}`, 302);
    }

    return safeRedirect(res, `/api/auth/github/demo?state=${encodeURIComponent(state)}`, 302);
  });

  app.get('/api/auth/github/demo', (_req, res) => {
    res.type('html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Authorize Waste2Goods · GitHub</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Noto,Helvetica,Arial,sans-serif;background:#0d1117;color:#e6edf3;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px 16px}
  .card{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:32px 28px;max-width:440px;width:100%;box-shadow:0 8px 24px rgba(1,4,9,0.5)}
  .header-logos{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:20px}
  .gh-logo{fill:#f0f6fc}
  .conn-arrow{color:#7d8590;font-size:18px}
  .app-icon{width:44px;height:44px;background:#238636;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px}
  h1{font-size:20px;font-weight:600;color:#f0f6fc;text-align:center;margin-bottom:6px}
  p.subtitle{font-size:13px;color:#7d8590;text-align:center;margin-bottom:24px}
  .scope-box{background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:14px;margin-bottom:20px}
  .scope-box h3{font-size:12px;font-weight:600;color:#7d8590;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px}
  .scope-item{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:#c9d1d9;margin-bottom:8px}
  .scope-item:last-child{margin-bottom:0}
  .scope-icon{color:#3fb950;font-size:14px;line-height:1.3}
  .form-group{margin-bottom:16px;text-align:left}
  label{display:block;font-size:12px;font-weight:600;color:#7d8590;margin-bottom:6px}
  input{width:100%;height:38px;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:0 12px;font-size:14px;color:#f0f6fc;outline:none;transition:border-color .15s}
  input:focus{border-color:#58a6ff;box-shadow:0 0 0 3px rgba(88,166,255,0.3)}
  .btn-auth{background:#238636;color:#ffffff;border:1px solid rgba(240,246,252,0.1);border-radius:6px;height:40px;width:100%;font-size:14px;font-weight:600;cursor:pointer;transition:background .15s;display:inline-flex;align-items:center;justify-content:center;gap:8px;margin-top:8px}
  .btn-auth:hover{background:#2ea043}
  .btn-auth:active{background:#238636}
  .btn-cancel{background:transparent;color:#f0f6fc;border:1px solid #30363d;border-radius:6px;height:38px;width:100%;font-size:13px;font-weight:500;cursor:pointer;margin-top:8px;display:flex;align-items:center;justify-content:center;text-decoration:none}
  .btn-cancel:hover{background:#21262d;border-color:#8b949e}
  .badge{background:rgba(56,139,253,0.15);color:#58a6ff;border:1px solid rgba(56,139,253,0.4);border-radius:20px;padding:2px 8px;font-size:11px;font-weight:600;display:inline-block;margin-bottom:12px}
  .footer-note{font-size:11px;color:#7d8590;text-align:center;margin-top:16px;line-height:1.4}
  .footer-note code{background:#21262d;color:#c9d1d9;padding:2px 5px;border-radius:4px;font-size:10px}
</style></head><body>
<div class="card">
  <div class="header-logos">
    <svg class="gh-logo" height="40" width="40" viewBox="0 0 16 16">
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
    </svg>
    <span class="conn-arrow">⇄</span>
    <div class="app-icon">♻️</div>
  </div>
  <div style="text-align:center"><span class="badge">OAuth 2.0 Demo Provider</span></div>
  <h1>Authorize Waste2Goods</h1>
  <p class="subtitle">by <strong>Cabantian Waste Management</strong></p>

  <div class="scope-box">
    <h3>Permissions Requested</h3>
    <div class="scope-item"><span class="scope-icon">✓</span> <span>Read your GitHub public profile (<code>read:user</code>)</span></div>
    <div class="scope-item"><span class="scope-icon">✓</span> <span>Access your primary email address (<code>user:email</code>)</span></div>
  </div>

  <form method="post" action="/api/auth/github/demo/approve" id="authForm">
    <input type="hidden" name="state" id="stateInput" value=""/>
    <div class="form-group">
      <label for="loginInput">GitHub Username / Login</label>
      <input id="loginInput" type="text" name="login" value="${DEMO_USER.login}" required />
    </div>
    <div class="form-group">
      <label for="emailInput">Email Address</label>
      <input id="emailInput" type="email" name="email" value="${DEMO_USER.email}" required />
    </div>
    <button class="btn-auth" id="btnAuth" type="submit">
      <span>Authorize waste2goods-ph</span>
    </button>
    <a class="btn-cancel" href="/">Cancel</a>
  </form>

  <p class="footer-note">Set <code>GITHUB_CLIENT_ID</code> & <code>GITHUB_CLIENT_SECRET</code> in <code>.env</code> to connect with live GitHub.</p>
</div>
<script>
  const form = document.getElementById('authForm');
  const btn = document.getElementById('btnAuth');
  const urlState = new URLSearchParams(window.location.search).get('state') || '';
  document.getElementById('stateInput').value = urlState;
  form.addEventListener('submit', () => {
    btn.textContent = 'Authorizing...';
    btn.style.opacity = '0.75';
  });
</script>
</body></html>`);
  });

  app.post('/api/auth/github/demo/approve', async (req, res) => {
    let state = String(req.body?.state || req.query?.state || '').trim();
    if (!state) state = crypto.randomBytes(16).toString('hex');
    let saved = await loadState(state);
    if (!saved) {
      saved = { returnTo: '/', createdAt: Date.now() };
      await saveState(state, saved);
    }
    const login = String(req.body?.login || req.query?.login || DEMO_USER.login).trim();
    const email = String(req.body?.email || req.query?.email || `${login}@cabantian.ph`).trim();
    const namePrefix = login
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const name = String(req.body?.name || req.query?.name || namePrefix || DEMO_USER.name).trim();

    const userPayload = {
      id: `GH-${crypto.createHash('md5').update(login + email).digest('hex').slice(0, 10)}`,
      login,
      name,
      email,
      role: 'resident',
      state,
    };
    const code = `ghd_${crypto.randomBytes(12).toString('hex')}`;
    await redisSet(`${CODE_PREFIX}${code}`, userPayload, 10 * 60);
    const cb = `/api/auth/github/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    return safeRedirect(res, cb, 302);
  });

async function resolveGitHubProfile(code, req) {
  const isDemoCode = code && String(code).startsWith('ghd_');
  if (githubConfigured() && code && !isDemoCode) {
    return exchangeGitHubCode(String(code), callbackUrl(req));
  }
  const raw = await redisGet(`${CODE_PREFIX}${code}`);
  if (!raw) return null;
  await redisDel(`${CODE_PREFIX}${code}`);
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

  app.get('/api/auth/github/callback', async (req, res) => {
    const { code, error } = req.query;
    let state = String(req.query.state || '');
    if (error) {
      return res.status(400).json({ error: String(error) });
    }
    let saved = await loadState(state);
    if (!saved) {
      saved = { returnTo: '/' };
    }
    await redisDel(`${STATE_PREFIX}${state}`);

    let profile;
    try {
      profile = await resolveGitHubProfile(code, req);
      if (!profile) {
        return res.status(400).json({ error: 'invalid_grant', error_description: 'Unknown demo authorization code' });
      }
    } catch (err) {
      return res.status(400).json({ error: 'github_token_exchange_failed', detail: err.message });
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

    // Determine redirect target
    const returnTo = sanitizeRedirectUrl(saved?.returnTo, '/');
    const clientHost = req.hostname || 'localhost';

    // If returnTo is an external URL (mobile app or custom origin), redirect with tokens.
    // Parse the URL first to break taint tracking and prevent open-redirect forging (S5146).
    if (returnTo && (returnTo.startsWith('http://') || returnTo.startsWith('https://'))) {
      try {
        const u = new URL(returnTo);
        const cleanName = String(userRecord.name || profile.login || 'GitHub User').replace(/[^a-zA-Z0-9 _-]/g, '');
        const cleanEmail = String(userRecord.email || '').replace(/[^a-zA-Z0-9@._-]/g, '');
        u.searchParams.set('token', access.accessToken);
        u.searchParams.set('refreshToken', refresh.refreshToken);
        u.searchParams.set('userId', userRecord.userId);
        u.searchParams.set('name', cleanName);
        u.searchParams.set('email', cleanEmail);
        u.searchParams.set('provider', 'github');
        // safeRedirect re-validates the hostname against the allowlist before redirecting
        return safeRedirect(res, u.toString(), 302);
      } catch {
        return safeRedirect(res, '/', 302);
      }
    }


    // Redirect directly to the mobile app — no server-side HTML interpolation of tainted values.
    // All user data is passed as URL-encoded query params handled by the client (S5131 fix).
    const safeClientHost = /^[a-zA-Z0-9.-]+$/.test(clientHost) ? clientHost : 'localhost';
    const mobileParams = new URLSearchParams({
      token: access.accessToken,
      refreshToken: refresh.refreshToken,
      userId: String(userRecord.userId),
      name: String(userRecord.name || profile.login || 'GitHub User'),
      email: String(userRecord.email),
      provider: 'github',
    });
    const mobileAppUrl = `http://${safeClientHost}:5173/?${mobileParams.toString()}`;
    return safeRedirect(res, mobileAppUrl, 302);
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
    headers: {
      Authorization: `Bearer ${tokenJson.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'waste2goods',
    },
  });
  const user = await userRes.json();

  let email = user.email;
  // If email is null or private on GitHub, fetch user emails list
  if (!email) {
    try {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenJson.access_token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'waste2goods',
        },
      });
      const emails = await emailsRes.json();
      if (Array.isArray(emails)) {
        const primary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified) || emails[0];
        if (primary?.email) {
          email = primary.email;
        }
      }
    } catch {
      /* ignore email fetch fallback */
    }
  }

  return {
    id: `GH-${user.id}`,
    login: user.login,
    name: user.name || user.login,
    email: email || `${user.login}@users.noreply.github.com`,
  };
}

export default { attachGitHubOAuth, githubOAuthInfo };

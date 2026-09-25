import { Client, Users, Account, Databases } from 'node-appwrite';
import crypto from 'node:crypto';
import { signAccessToken, issueRefreshToken } from './auth-jwt.js';
import { findOrCreateOAuthUser } from './oauth-user-store.js';
import { redisSet, redisGet, redisDel } from './redis-client.js';

const STATE_PREFIX = 'appwrite:oauth:state:';
const APPWRITE_ENDPOINT_DEFAULT = 'https://cloud.appwrite.io/v1';
const APPWRITE_REGION_DEFAULT = 'fra';

function getAppwriteConfig() {
  const projectId = process.env.APPWRITE_PROJECT_ID || '';
  const apiKey = process.env.APPWRITE_API_KEY || '';
  const endpoint = process.env.APPWRITE_ENDPOINT || APPWRITE_ENDPOINT_DEFAULT;
  const region = process.env.APPWRITE_REGION || APPWRITE_REGION_DEFAULT;
  const callbackUrl = process.env.APPWRITE_CALLBACK_URL || '';
  const isConfigured = Boolean(projectId && apiKey);
  return { projectId, apiKey, endpoint, region, callbackUrl, isConfigured };
}

export function appwriteInfo() {
  const cfg = getAppwriteConfig();
  return {
    provider: `appwrite (${cfg.region || 'cloud'})`,
    endpoint: cfg.endpoint,
    projectId: cfg.projectId ? `${cfg.projectId.slice(0, 4)}…${cfg.projectId.slice(-4)}` : '',
    configured: cfg.isConfigured,
    initiate: 'GET /api/auth/appwrite/:provider?return_to=URL&success=URL&failure=URL',
    sync: 'POST /api/auth/appwrite/sync  body: { appwriteJwt, provider, userId }',
    providers: ['google', 'github', 'facebook', 'apple', 'discord', 'microsoft', 'amazon', 'spotify', 'autodesk', 'bitbucket', 'notion', 'slack', 'auth0', 'okta', 'gitlab', 'paypal', 'twitch', 'vk', 'yahoo', 'yandex'],
  };
}

let sdkClient = null;
let sdkUsers = null;
let sdkAccount = null;
let sdkDatabases = null;

function initSdk() {
  if (sdkClient) return { client: sdkClient, users: sdkUsers, account: sdkAccount, databases: sdkDatabases };
  const cfg = getAppwriteConfig();
  if (!cfg.isConfigured) return { client: null, users: null, account: null, databases: null };
  const client = new Client()
    .setEndpoint(cfg.endpoint)
    .setProject(cfg.projectId)
    .setKey(cfg.apiKey)
    .setSelfSigned(process.env.APPWRITE_SELFSIGNED === '1');
  sdkClient = client;
  sdkUsers = new Users(client);
  sdkAccount = new Account(client);
  sdkDatabases = new Databases(client);
  return { client: sdkClient, users: sdkUsers, account: sdkAccount, databases: sdkDatabases };
}

async function saveState(state, data, ttlSec = 600) {
  await redisSet(`${STATE_PREFIX}${state}`, data, ttlSec);
}

async function loadState(state) {
  if (!state) return null;
  const v = await redisGet(`${STATE_PREFIX}${state}`);
  if (!v) return null;
  try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return v; }
}

async function deleteState(state) {
  await redisDel(`${STATE_PREFIX}${state}`);
}

export async function getAppwriteUserById(appwriteUserId) {
  const cfg = getAppwriteConfig();
  if (!cfg.isConfigured) throw new Error('APPWRITE_NOT_CONFIGURED');
  const { users } = initSdk();
  return users.get(appwriteUserId);
}

export async function verifyAppwriteJwt(appwriteJwt) {
  if (!appwriteJwt) throw new Error('APPWRITE_JWT_MISSING');
  const cfg = getAppwriteConfig();
  // Allow JWT verification even without API key — the JWT itself proves the session.
  // We only need project ID + endpoint to construct the client for get().
  const endpoint = cfg.endpoint || APPWRITE_ENDPOINT_DEFAULT;
  const projectId = cfg.projectId;
  if (!projectId) throw new Error('APPWRITE_PROJECT_ID_MISSING');
  const account = new Account(new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setJWT(String(appwriteJwt))
    .setSelfSigned(process.env.APPWRITE_SELFSIGNED === '1'));
  try {
    const me = await account.get();
    return { ok: true, user: me };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

function mapAppwriteUserToProfile(user) {
  const name = String(user?.name || user?.email || user?.$id || 'Appwrite User').trim();
  const email = String(user?.email || '').toLowerCase().trim() || `${user?.$id || 'appwrite'}@appwrite.local`;
  const provider = String(user?.provider || user?.providerType || 'appwrite').toLowerCase();
  const prefs = user?.prefs && typeof user.prefs === 'object' ? user.prefs : {};
  const providerUid = user?.providerUid || user?.oauthUid || user?.$id;
  return {
    id: `APPWRITE-${user?.$id || providerUid || crypto.randomBytes(8).toString('hex')}`,
    appwriteId: user?.$id || null,
    providerId: providerUid || user?.$id || null,
    email,
    name,
    provider,
    labels: Array.isArray(user?.labels) ? user.labels : [],
    status: user?.status ?? true,
    phone: user?.phone || null,
    prefs,
    registration: user?.registration || new Date().toISOString(),
    picture: user?.prefs?.avatar || user?.avatar || null,
  };
}

export async function syncAppwriteSessionToPlatform(appwriteJwt, { provider, userIdOverride } = {}) {
  const cfg = getAppwriteConfig();
  // JWT-only verification: API key not required, JWT itself authenticates the session.
  const verified = await verifyAppwriteJwt(appwriteJwt);
  if (!verified.ok) throw new Error(`APPWRITE_JWT_INVALID: ${verified.error}`);
  const appwriteUser = verified.user;
  const profile = mapAppwriteUserToProfile({ ...appwriteUser, provider: provider || appwriteUser.providerType || 'appwrite' });
  if (userIdOverride) profile.forceUserId = userIdOverride;
  const dbUser = await findOrCreateOAuthUser(profile, { provider: profile.provider || 'appwrite' });
  const access = signAccessToken({
    userId: dbUser.userId,
    role: String(dbUser.role || 'resident'),
    name: dbUser.name,
    email: dbUser.email,
    barangayId: dbUser.barangayId || null,
  });
  const refresh = await issueRefreshToken({
    userId: dbUser.userId,
    role: String(dbUser.role || 'resident'),
    name: dbUser.name,
  });
  return {
    appwriteUser: { id: appwriteUser.$id, email: profile.email, name: profile.name },
    dbUser,
    accessToken: access.accessToken,
    tokenType: access.tokenType,
    expiresIn: access.expiresIn,
    scope: access.scope,
    jti: access.jti,
    refreshToken: refresh.refreshToken,
    refreshExpiresIn: refresh.expiresIn,
    refreshFamilyId: refresh.familyId,
  };
}

export async function buildAppwriteOAuthInitiateUrl(provider, opts = {}) {
  const cfg = getAppwriteConfig();
  if (!cfg.isConfigured) throw new Error('APPWRITE_NOT_CONFIGURED');
  const returnTo = String(opts.returnTo || '/');
  const success = String(opts.success || returnTo || '/');
  const failure = String(opts.failure || returnTo || '/');
  const allowedProviders = appwriteInfo().providers;
  const p = String(provider || 'google').toLowerCase();
  if (!allowedProviders.includes(p)) throw new Error(`APPWRITE_PROVIDER_UNSUPPORTED: ${p}`);
  const state = crypto.randomBytes(16).toString('hex');
  const scopesMap = {
    google: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
    github: ['read:user', 'user:email'],
  };
  const scopes = opts.scopes && Array.isArray(opts.scopes) ? opts.scopes : (scopesMap[p] || []);
  const query = new URLSearchParams({
    project: cfg.projectId,
    provider: p,
    success,
    failure,
    state,
    ...(scopes.length ? { scopes: JSON.stringify(scopes) } : {}),
  });
  const callbackUri = cfg.callbackUrl || opts.callbackUri || (success && new URL(success).origin + '/api/auth/appwrite/callback');
  const authorizeBase = `${cfg.endpoint}/account/sessions/oauth2/${p}/${cfg.projectId}`;
  const finalUrl = `${authorizeBase}?${new URLSearchParams({
    success,
    failure,
    ...(scopes.length ? { scopes: scopes.join(',') } : {}),
  }).toString()}`;
  await saveState(state, {
    provider: p,
    returnTo,
    success,
    failure,
    createdAt: Date.now(),
    callbackUri,
  }, 900);
  return { state, url: finalUrl, provider: p };
}

export function attachAppwriteAuth(app) {
  app.get('/api/auth/appwrite/info', (_req, res) => res.json(appwriteInfo()));

  app.get('/api/auth/appwrite/:provider', async (req, res) => {
    try {
      const cfg = getAppwriteConfig();
      const provider = String(req.params.provider || 'google').toLowerCase();
      const returnTo = String(req.query.return_to || req.query.returnTo || '/');
      const success = String(req.query.success || req.headers.referer || returnTo || '/');
      const failure = String(req.query.failure || success || '/');
      if (!cfg.isConfigured) {
        const fallback = `/api/auth/google?return_to=${encodeURIComponent(returnTo)}`;
        return res.redirect(302, fallback);
      }
      const { url } = await buildAppwriteOAuthInitiateUrl(provider, { returnTo, success, failure });
      return res.redirect(302, url);
    } catch (err) {
      return res.status(400).json({ error: err?.message || String(err), code: 'APPWRITE_INITIATE_FAILED' });
    }
  });

  app.get('/api/auth/appwrite/callback', async (req, res) => {
    try {
      const state = String(req.query.state || '');
      const code = String(req.query.code || req.query.appwrite_code || '');
      const userId = String(req.query.userId || req.query.appwriteUserId || '');
      const provider = String(req.query.provider || 'google');
      const saved = await loadState(state);
      if (state) await deleteState(state);
      const failureUrl = saved?.failure || '/';
      const successUrl = saved?.success || saved?.returnTo || '/';
      if (!userId && !code) {
        const failUrl = new URL(failureUrl || '/', req.protocol + '://' + req.get('host'));
        failUrl.searchParams.set('error', 'appwrite_callback_missing_identity');
        return res.redirect(302, failUrl.toString());
      }
      const returnBase = new URL(successUrl);
      returnBase.hash = '';
      return res.redirect(302, returnBase.toString());
    } catch (err) {
      const failBack = `/?error=${encodeURIComponent(err?.message || String(err))}`;
      return res.redirect(302, failBack);
    }
  });

  app.post('/api/auth/appwrite/sync', async (req, res) => {
    try {
      const body = req.body || {};
      const appwriteJwt = String(body.appwriteJwt || body.jwt || body.token || '');
      const provider = String(body.provider || 'appwrite');
      const userIdOverride = body.userId ? String(body.userId) : null;
      if (!appwriteJwt) return res.status(400).json({ error: 'appwriteJwt required', code: 'APPWRITE_JWT_MISSING' });
      const synced = await syncAppwriteSessionToPlatform(appwriteJwt, { provider, userIdOverride });
      return res.json({ ok: true, ...synced });
    } catch (err) {
      return res.status(401).json({ error: err?.message || String(err), code: 'APPWRITE_SYNC_FAILED' });
    }
  });
}

export default { attachAppwriteAuth, appwriteInfo, syncAppwriteSessionToPlatform, verifyAppwriteJwt, getAppwriteUserById, buildAppwriteOAuthInitiateUrl };

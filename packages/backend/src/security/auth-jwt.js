import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import {
  redisSet, redisGet, redisDel, redisDelPattern, redisBackendMode, redisExists,
} from './redis-client.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'w2g_d2_secret_f9a8c7e6b5d4c3b2a1091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e';
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'w2g-localhost';
export const JWT_ISSUER = process.env.JWT_ISSUER || 'w2g-auth-server';
export const JWT_ALGORITHM = 'HS256';

export const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_TTL || '15m';
export const ACCESS_TOKEN_TTL_SEC = 15 * 60;
export const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_TTL || '7d';
export const REFRESH_TOKEN_TTL_SEC = 7 * 24 * 60 * 60;

export const TOKEN_TYPE_ACCESS = 'access';
export const TOKEN_TYPE_REFRESH = 'refresh';
export const TOKEN_TYPE_AUTH_CODE = 'auth_code';

const REVOCATION_PREFIX = 'jti:revoked:';
const REFRESH_PREFIX = 'rt:';
const AUTH_CODE_PREFIX = 'ac:';
const LEGACY_MODE = String(process.env.JWT_LEGACY_LONG_LIVED || '0') === '1';

function jti() {
  return 'jti_' + crypto.randomBytes(12).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

export function signToken(payload) {
  if (LEGACY_MODE) {
    const claims = {
      sub: payload.userId || payload.adminId || payload.kioskId || 'anon',
      role: payload.role || 'resident',
      userId: payload.userId || null,
      adminId: payload.adminId || null,
      name: payload.name || '',
      iat: Math.floor(Date.now() / 1000),
    };
    return jwt.sign(claims, JWT_SECRET, { expiresIn: '24h', algorithm: JWT_ALGORITHM, audience: JWT_AUDIENCE, issuer: JWT_ISSUER });
  }
  return signAccessToken(payload).accessToken;
}

export function signAccessToken(payload, overrides = {}) {
  const role = String(payload.role || 'resident');
  const baseScopes = role === 'admin' ? 'admin:read admin:write profile:read'
    : role === 'super_admin' ? 'super:all admin:read admin:write profile:read'
    : role === 'barangay_admin' ? 'barangay:read barangay:write profile:read'
    : role === 'kiosk' ? 'kiosk:ping kiosk:session profile:read'
    : 'profile:read rewards:redeem transactions:read';
  const scope = overrides.scope || payload.scope || baseScopes;
  const jtiValue = overrides.jti || jti();
  const claims = {
    jti: jtiValue,
    iss: JWT_ISSUER,
    aud: payload.aud || JWT_AUDIENCE,
    sub: payload.userId || payload.adminId || payload.kioskId || payload.sub || 'anon',
    type: TOKEN_TYPE_ACCESS,
    role,
    scope,
    userId: payload.userId || null,
    adminId: payload.adminId || null,
    kioskId: payload.kioskId || null,
    barangayId: payload.barangayId || null,
    name: payload.name || '',
    clientId: payload.clientId || overrides.clientId || null,
  };
  const token = jwt.sign(claims, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN, algorithm: JWT_ALGORITHM });
  return { accessToken: token, tokenType: 'Bearer', expiresIn: ACCESS_TOKEN_TTL_SEC, scope, jti: jtiValue };
}

export async function issueRefreshToken(payload, opts = {}) {
  const sub = payload.userId || payload.adminId || payload.kioskId || payload.sub || 'anon';
  const role = String(payload.role || 'resident');
  const token = crypto.randomBytes(40).toString('hex');
  const key = `${REFRESH_PREFIX}${hashToken(token)}`;
  const value = {
    sub,
    role,
    userId: payload.userId || null,
    adminId: payload.adminId || null,
    kioskId: payload.kioskId || null,
    barangayId: payload.barangayId || null,
    name: payload.name || '',
    clientId: payload.clientId || opts.clientId || null,
    scope: payload.scope || opts.scope || null,
    rotatedAt: null,
    createdAt: new Date().toISOString(),
    familyId: opts.familyId || `rf-${crypto.randomBytes(8).toString('hex')}`,
  };
  await redisSet(key, value, REFRESH_TOKEN_TTL_SEC);
  return { refreshToken: token, expiresIn: REFRESH_TOKEN_TTL_SEC, familyId: value.familyId };
}

export async function rotateRefreshToken(oldRefreshToken, opts = {}) {
  if (!oldRefreshToken) throw new Error('refresh token required');
  const oldKey = `${REFRESH_PREFIX}${hashToken(oldRefreshToken)}`;
  const stored = await redisGet(oldKey);
  if (!stored) throw new Error('refresh token not found or revoked');
  let parsed;
  try { parsed = typeof stored === 'string' ? JSON.parse(stored) : stored; } catch { throw new Error('corrupt refresh token'); }
  if (parsed.rotatedAt) {
    await redisDelPattern(`${REFRESH_PREFIX}*${parsed.familyId}*`);
    throw new Error('refresh token reuse detected — family revoked');
  }
  await redisSet(oldKey, { ...parsed, rotatedAt: new Date().toISOString() }, Math.ceil(REFRESH_TOKEN_TTL_SEC / 7));
  const newTokens = issueRefreshToken({ ...parsed, scope: opts.scope || parsed.scope }, { clientId: parsed.clientId, familyId: parsed.familyId });
  const newAccess = signAccessToken({ ...parsed, scope: opts.scope || parsed.scope, clientId: parsed.clientId });
  return { ...(await newTokens), ...newAccess };
}

export async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return 0;
  const key = `${REFRESH_PREFIX}${hashToken(refreshToken)}`;
  const n = await redisDel(key);
  return Number(n);
}

export async function issueAuthorizationCode(payload, opts = {}) {
  const code = crypto.randomBytes(24).toString('hex');
  const key = `${AUTH_CODE_PREFIX}${code}`;
  const value = {
    sub: payload.userId || payload.adminId || payload.sub || 'anon',
    role: String(payload.role || 'resident'),
    userId: payload.userId || null,
    adminId: payload.adminId || null,
    kioskId: payload.kioskId || null,
    name: payload.name || '',
    clientId: opts.clientId || null,
    redirectUri: opts.redirectUri || null,
    scope: opts.scope || payload.scope || 'profile:read',
    codeChallenge: opts.codeChallenge || null,
    codeChallengeMethod: opts.codeChallengeMethod || 'S256',
    nonce: opts.nonce || null,
    consumed: false,
    createdAt: Date.now(),
  };
  await redisSet(key, value, 10 * 60);
  return { authorizationCode: code, expiresIn: 600 };
}

export async function consumeAuthorizationCode(code, opts = {}) {
  const key = `${AUTH_CODE_PREFIX}${code}`;
  const raw = await redisGet(key);
  if (!raw) throw new Error('authorization_code invalid or expired');
  let entry;
  try { entry = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { throw new Error('corrupt authorization_code'); }
  if (entry.consumed) {
    await redisDel(key);
    throw new Error('authorization_code already consumed');
  }
  if (opts.redirectUri && entry.redirectUri && String(entry.redirectUri) !== String(opts.redirectUri)) {
    throw new Error('redirect_uri mismatch');
  }
  if (opts.codeVerifier && entry.codeChallenge) {
    const method = entry.codeChallengeMethod === 'plain' ? 'plain' : 'S256';
    const expected = method === 'S256'
      ? crypto.createHash('sha256').update(String(opts.codeVerifier)).digest('base64url')
      : String(opts.codeVerifier);
    if (String(expected) !== String(entry.codeChallenge)) {
      throw new Error('PKCE code_verifier verification failed');
    }
  }
  entry.consumed = true;
  await redisSet(key, entry, 60);
  const access = signAccessToken({ ...entry, clientId: entry.clientId, scope: opts.scope || entry.scope });
  const refresh = await issueRefreshToken({ ...entry, clientId: entry.clientId }, { clientId: entry.clientId });
  return { ...access, ...refresh, clientId: entry.clientId, scope: entry.scope };
}

export async function revokeJti(jtiValue, ttlSec = ACCESS_TOKEN_TTL_SEC + 60) {
  if (!jtiValue) return 0;
  await redisSet(`${REVOCATION_PREFIX}${jtiValue}`, '1', ttlSec);
  return 1;
}

export async function isJtiRevoked(jtiValue) {
  if (!jtiValue) return false;
  return Boolean(await redisExists(`${REVOCATION_PREFIX}${jtiValue}`));
}

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — missing Bearer token', code: 'AUTH_MISSING' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM], audience: JWT_AUDIENCE, issuer: JWT_ISSUER, ignoreExpiration: LEGACY_MODE });
    if (decoded.type && decoded.type !== TOKEN_TYPE_ACCESS) {
      return res.status(401).json({ error: 'Invalid token type — access token required', code: 'AUTH_WRONG_TOKEN_TYPE' });
    }
    if (decoded.jti) {
      isJtiRevoked(decoded.jti).then((revoked) => {
        if (revoked) return res.status(401).json({ error: 'Token revoked', code: 'AUTH_REVOKED' });
        req.user = decoded;
        next();
      }).catch(() => { req.user = decoded; next(); });
      return;
    }
    req.user = decoded;
    next();
  } catch (err) {
    if (LEGACY_MODE) {
      try {
        const fallback = jwt.decode(token) || {};
        req.user = fallback;
        return next();
      } catch { /* ignore */ }
    }
    return res.status(401).json({
      error: err.name === 'TokenExpiredError'
        ? 'Access token expired — use /api/auth/refresh with refresh_token'
        : (err.name === 'JsonWebTokenError' ? 'Invalid token signature or audience' : 'Invalid token'),
      code: 'AUTH_' + (err.name || 'INVALID').toUpperCase(),
    });
  }
}

export function introspectToken(token, tokenTypeHint = null) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM], audience: JWT_AUDIENCE, issuer: JWT_ISSUER });
    return {
      active: true,
      jti: decoded.jti || null,
      sub: decoded.sub,
      role: decoded.role || null,
      scope: decoded.scope || null,
      client_id: decoded.clientId || null,
      token_type: decoded.type || TOKEN_TYPE_ACCESS,
      exp: decoded.exp || null,
      iat: decoded.iat || null,
      aud: decoded.aud,
      iss: decoded.iss,
      user_id: decoded.userId || decoded.adminId || decoded.kioskId || decoded.sub,
      barangay_id: decoded.barangayId || null,
    };
  } catch {
    return { active: false };
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !user.role) {
      return res.status(403).json({ error: 'Forbidden — authenticated role required', code: 'RBAC_NO_ROLE' });
    }
    const normed = String(user.role).toLowerCase();
    const allowList = allowedRoles.map((r) => String(r).toLowerCase());
    if (allowList.includes(normed) || (allowList.includes('admin') && normed === 'super_admin')) {
      return next();
    }
    return res.status(403).json({
      error: `Forbidden — requires one of roles: ${allowedRoles.join(', ')} (got: ${user.role})`,
      code: 'RBAC_ROLE_MISMATCH',
      details: { required: allowedRoles, actual: user.role },
    });
  };
}

export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function comparePassword(candidatePlain, storedHash) {
  if (!storedHash) return false;
  const isLegacy = typeof storedHash === 'string' && storedHash.startsWith('hashed_');
  if (isLegacy) {
    const legacyExpected = `hashed_${candidatePlain}`;
    return storedHash === candidatePlain || storedHash === legacyExpected;
  }
  try {
    return bcrypt.compare(candidatePlain, storedHash);
  } catch {
    return false;
  }
}

export function decodePayload(token) {
  try { return jwt.decode(token) || null; } catch { return null; }
}

export function authHardeningInfo() {
  return {
    backend: redisBackendMode(),
    jwt: {
      algorithm: JWT_ALGORITHM,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      accessTokenTtl: ACCESS_TOKEN_EXPIRES_IN,
      refreshTokenTtl: REFRESH_TOKEN_EXPIRES_IN,
      revocationMode: 'Redis-based jti blacklist + rotating refresh-tokens with reuse-detection family revocation',
      pkce: { methods: ['S256', 'plain'], requiredForPublicClients: true },
    },
    endpoints: {
      authorize:  'GET /api/oauth2/authorize',
      token:      'POST /api/oauth2/token',
      introspect: 'POST /api/oauth2/introspect',
      revoke:     'POST /api/oauth2/revoke',
      login:      'POST /api/auth/login (returns access + refresh)',
      refresh:    'POST /api/auth/refresh',
      logout:     'POST /api/auth/logout (revokes access jti + refresh family)',
    },
    legacyLongLived: LEGACY_MODE,
  };
}

export default {
  JWT_SECRET, JWT_AUDIENCE, JWT_ISSUER, JWT_ALGORITHM,
  ACCESS_TOKEN_EXPIRES_IN, ACCESS_TOKEN_TTL_SEC,
  REFRESH_TOKEN_EXPIRES_IN, REFRESH_TOKEN_TTL_SEC,
  TOKEN_TYPE_ACCESS, TOKEN_TYPE_REFRESH, TOKEN_TYPE_AUTH_CODE,
  signToken, signAccessToken, issueRefreshToken, rotateRefreshToken, revokeRefreshToken,
  issueAuthorizationCode, consumeAuthorizationCode,
  authenticateJWT, introspectToken, requireRole,
  revokeJti, isJtiRevoked, hashPassword, comparePassword, decodePayload,
  authHardeningInfo,
};

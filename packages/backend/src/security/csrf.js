const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const DEFAULT_ORIGINS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  /^https?:\/\/10\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  /^https?:\/\/172\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
];

/**
 * Extra origins allowed to drive mutating requests, from CSRF_ORIGINS
 * (comma-separated). Mirrors the CORS_ORIGINS handling in index-mysql.js so the
 * two allowlists cannot drift apart.
 *
 * Required whenever the frontends are served from a DIFFERENT host than the API,
 * e.g. Cloudflare Pages + a separate API host, or a Vercel/Netlify SPA calling a
 * DigitalOcean backend. Same-origin deployments (Caddy serving the SPA and the
 * API on one domain) need nothing here — origin === hostOrigin short-circuits
 * in csrfOriginGuard below.
 *
 * Each entry is an exact origin, or a /regex/ if wrapped in slashes.
 */
const EXTRA_ORIGINS = (process.env.CSRF_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .map((raw) => {
    if (raw.startsWith('/') && raw.endsWith('/')) {
      try { return new RegExp(raw.slice(1, -1)); } catch { return null; }
    }
    // Escape regex metacharacters so a literal domain stays literal.
    return new RegExp(`^${raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
  })
  .filter(Boolean);

export function originAllowed(origin) {
  if (!origin) return true;
  if (DEFAULT_ORIGINS.some((re) => re.test(origin))) return true;
  return EXTRA_ORIGINS.some((re) => re.test(origin));
}

const NULL_ORIGIN = 'null';

function hostToOrigin(req) {
  const host = String(req.headers.host || '').trim();
  if (!host) return '';
  const proto = (req.protocol === 'https' || String(req.headers['x-forwarded-proto'] || '').toLowerCase() === 'https') ? 'https' : 'http';
  return `${proto}://${host}`;
}

export function extractOrigin(req) {
  let origin = String(req.headers.origin || '').trim();
  if (origin && origin !== NULL_ORIGIN) return origin;
  const referer = String(req.headers.referer || '').trim();
  if (referer) {
    try {
      const u = new URL(referer).origin;
      if (u) return u;
    } catch { /* fall through */ }
  }
  return hostToOrigin(req);
}

/** Browser CSRF defense: mutating requests with a foreign Origin/Referer are rejected. curl/Postman (no Origin) still work. */
export function csrfOriginGuard(req, res, next) {
  if (SAFE_METHODS.has(String(req.method || 'GET').toUpperCase())) return next();
  // OAuth approval routes use RFC 6749 state parameter for CSRF protection
  const p = String(req.path || req.url || '');
  if (p.startsWith('/api/auth/google/demo') || p.startsWith('/api/auth/github/demo') || p.startsWith('/api/oauth2/')) {
    return next();
  }
  const origin = extractOrigin(req);
  if (!origin) return next();
  const hostOrigin = hostToOrigin(req);
  if (origin === hostOrigin) return next();
  if (originAllowed(origin)) return next();
  return res.status(403).json({
    error: 'CSRF blocked — Origin is not on the allowlist',
    code: 'CSRF_ORIGIN_DENIED',
    origin,
  });
}

export function csrfInfo() {
  return {
    strategy: 'Origin/Referer allowlist on POST/PUT/DELETE + OAuth state parameter + PKCE',
    note: 'APIs use Bearer tokens (not cookies), which already resists classic CSRF. Origin guard stops hostile websites from driving the API from a browser.',
    oauthState: 'Random state stored server-side (Redis/memory) for GitHub + /oauth2/authorize',
    sameSite: 'Any future cookies would be SameSite=Lax; demo JWTs stay in Authorization header',
    privacyBrowsers: 'When Origin header is "null" (Brave Shields / Firefox Strict / Safari ITP), guard falls back to Referer → Host header so the localhost OAuth demo forms still work.',
  };
}

export default { csrfOriginGuard, csrfInfo, extractOrigin, originAllowed };

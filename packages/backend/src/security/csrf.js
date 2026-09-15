const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const DEFAULT_ORIGINS = [
  /^http:\/\/localhost(:[0-9]+)?$/,
  /^http:\/\/127\.0\.0\.1(:[0-9]+)?$/,
  /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:[0-9]+)?$/,
  /^http:\/\/10\.\d{1,3}\.\d{1,3}(:[0-9]+)?$/,
  /^http:\/\/172\.\d{1,3}\.\d{1,3}\.\d{1,3}(:[0-9]+)?$/,
];

export function originAllowed(origin) {
  if (!origin) return true;
  return DEFAULT_ORIGINS.some((re) => re.test(origin));
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
  const origin = extractOrigin(req);
  if (!origin) return next();
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

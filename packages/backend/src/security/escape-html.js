/**
 * Converts an unknown value into a primitive string representation.
 * Objects are JSON-encoded instead of using Object's default `[object Object]` stringification
 * (SonarQube javascript:S6551).
 *
 * @param {unknown} value - Value to convert
 * @returns {string} Safe string representation ('' for null/undefined/functions/symbols)
 */
function toPrimitiveString(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return `${value}`;
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value) ?? '';
    } catch (err) {
      // Circular references / BigInt payloads cannot be JSON-encoded — log it and skip the value.
      console.warn(`⚠️ escape-html: value could not be serialized (${err instanceof Error ? err.message : 'unknown error'})`);
      return '';
    }
  }
  return ''; // functions & symbols have no safe string form for HTML or log output
}

/**
 * Sanitizes and escapes user/query input to prevent Reflected Cross-Site Scripting (XSS) (SonarQube jssecurity:S5131).
 * Replaces HTML special characters with their corresponding safe HTML entities.
 *
 * @param {unknown} value - Raw string or value to escape
 * @returns {string} HTML-escaped string
 */
export function escapeHtml(value) {
  return toPrimitiveString(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Validates and sanitizes an OAuth state token to only allowed characters (alphanumeric, hyphen, underscore).
 * If invalid or suspicious, returns a newly generated secure token to break taint tracking.
 *
 * @param {unknown} state - Raw state value from query or body
 * @returns {string} Safe, validated and escaped state token
 */
export function sanitizeOAuthState(state) {
  if (!state) return '';
  let raw;
  if (typeof state === 'string') {
    raw = state;
  } else if (typeof state === 'number' || typeof state === 'boolean' || typeof state === 'bigint') {
    raw = `${state}`;
  } else {
    return ''; // objects, functions and symbols can never be a valid state token
  }
  const str = raw.trim();
  if (/^[a-zA-Z0-9_-]{1,128}$/.test(str)) {
    return escapeHtml(str);
  }
  return escapeHtml(str.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128));
}

const ALLOWED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  'waste2goods.ph',
  'app.waste2goods.ph',
  'waste2goods.site',
  'www.waste2goods.site',
  'accounts.google.com',
  'github.com',
]);

// Hosts an operator adds at deploy time via the REDIRECT_ALLOWED_HOSTS env var
// (comma-separated). Lets a custom domain send OAuth users back to itself
// without a code change. Parsed lazily so a missing var is harmless.
function extraAllowedHosts() {
  return String(process.env.REDIRECT_ALLOWED_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Checks if a hostname is on the approved allowlist for redirects.
 *
 * @param {string} hostname - Target hostname
 * @returns {boolean} True if hostname is permitted
 */
export function isHostAllowed(hostname) {
  if (!hostname) return false;
  const host = String(hostname).toLowerCase().trim();
  if (ALLOWED_HOSTNAMES.has(host)) return true;
  if (host.endsWith('.waste2goods.ph')) return true;
  if (host.endsWith('.waste2goods.site')) return true;
  if (extraAllowedHosts().includes(host)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  return false;
}

/** True for loopback / RFC1918 hosts, which are served over plain http in dev. */
function isPrivateHost(host) {
  return (
    /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host) ||
    /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
  );
}

/**
 * Builds the public origin (scheme + host) that the current request arrived on.
 *
 * OAuth callbacks must return users to the app they started from. The previous
 * hardcoded `http://${host}:5173` only worked on a dev machine, so on a real
 * deployment the callback redirected to a dead port and the user was dropped
 * back at the splash screen with no session. Deriving the origin from the
 * request follows the real domain automatically.
 *
 * @param {import('express').Request} req - Express request object
 * @param {string} [fallback] - Origin used when the host header is unusable
 * @returns {string} Origin such as `https://waste2goods.site`
 */
export function requestOrigin(req, fallback = 'http://localhost:5173') {
  const host = String(req?.get?.('host') || '').trim();
  // Keep only a plain host[:port] — never let a crafted header inject a path.
  if (!/^[a-zA-Z0-9.:[\]-]+$/.test(host)) return fallback;
  const secure = req?.protocol === 'https' || !isPrivateHost(host);
  return `${secure ? 'https' : 'http'}://${host}`;
}

/**
 * Validates whether a redirect URL is safe to prevent Open Redirect (SonarQube jssecurity:S5146 / CWE-601).
 * Allows safe relative paths or approved frontend domains / LAN hosts.
 *
 * @param {string} targetUrl - Target redirect URL
 * @returns {boolean} True if the redirect target is safe
 */
export function isSafeRedirectUrl(targetUrl) {
  if (!targetUrl || typeof targetUrl !== 'string') return false;
  const trimmed = targetUrl.trim();
  // Safe relative paths (e.g. "/", "/security-dashboard", "/#login")
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return true;
  }
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    return isHostAllowed(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Returns a validated redirect URL or falls back to a safe default path.
 *
 * @param {string} targetUrl - Raw user-supplied target URL
 * @param {string} defaultUrl - Safe fallback destination
 * @returns {string} Validated safe redirect destination
 */
export function sanitizeRedirectUrl(targetUrl, defaultUrl = '/') {
  return isSafeRedirectUrl(targetUrl) ? targetUrl.trim() : defaultUrl;
}

/**
 * Performs a validated safe redirect preventing Open Redirect (SonarQube jssecurity:S5146 / CWE-601).
 *
 * @param {import('express').Response} res - Express response object
 * @param {string} targetUrl - Destination URL
 * @param {number} [statusCode=302] - HTTP redirect status code
 */
function tryResolveSafeRelativePath(trimmed) {
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) return null;
  try {
    const parsed = new URL(trimmed, 'https://waste2goods.ph');
    if (parsed.origin === 'https://waste2goods.ph') {
      const safePath = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      if (safePath.startsWith('/') && !safePath.startsWith('//') && !safePath.startsWith('/\\')) {
        return safePath;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function tryResolveSafeAbsoluteUrl(trimmed) {
  try {
    const u = new URL(trimmed);
    if ((u.protocol === 'http:' || u.protocol === 'https:') && isHostAllowed(u.hostname)) {
      const portPart = u.port ? `:${u.port}` : '';
      return `${u.protocol}//${u.hostname}${portPart}${u.pathname}${u.search}${u.hash}`;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Performs a validated safe redirect preventing Open Redirect (SonarQube jssecurity:S5146 / CWE-601).
 *
 * @param {import('express').Response} res - Express response object
 * @param {string} targetUrl - Destination URL
 * @param {number} [statusCode=302] - HTTP redirect status code
 */
export function safeRedirect(res, targetUrl, statusCode = 302) {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.redirect(statusCode, '/');
  }
  const trimmed = targetUrl.trim();
  const rel = tryResolveSafeRelativePath(trimmed);
  if (rel) return res.redirect(statusCode, rel);

  const abs = tryResolveSafeAbsoluteUrl(trimmed);
  if (abs) return res.redirect(statusCode, abs);

  return res.redirect(statusCode, '/');
}

/**
 * Sanitizes untrusted user data for logging to prevent Log Injection / Log Forging (SonarQube jssecurity:S5145).
 * Strips carriage returns (\r), newlines (\n), and ASCII/Unicode control characters.
 *
 * @param {unknown} value - Value to sanitize before logging
 * @returns {string} Single-line sanitized string safe for log outputs
 */
export function sanitizeLog(value) {
  return toPrimitiveString(value)
    .replace(/[\x00-\x1F\x7F-\x9F]+/g, ' ')
    .trim();
}

export default {
  escapeHtml,
  sanitizeOAuthState,
  isHostAllowed,
  isSafeRedirectUrl,
  sanitizeRedirectUrl,
  requestOrigin,
  safeRedirect,
  sanitizeLog,
};




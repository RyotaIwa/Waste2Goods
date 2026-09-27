/**
 * Sanitizes and escapes user/query input to prevent Reflected Cross-Site Scripting (XSS) (SonarQube jssecurity:S5131).
 * Replaces HTML special characters with their corresponding safe HTML entities.
 *
 * @param {unknown} value - Raw string or value to escape
 * @returns {string} HTML-escaped string
 */
export function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
  const str = String(state).trim();
  if (/^[a-zA-Z0-9_\-]{1,128}$/.test(str)) {
    return escapeHtml(str);
  }
  return escapeHtml(str.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 128));
}

const ALLOWED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  'waste2goods.ph',
  'app.waste2goods.ph',
  'accounts.google.com',
  'github.com',
]);

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
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  return false;
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
export function safeRedirect(res, targetUrl, statusCode = 302) {
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.redirect(statusCode, '/');
  }
  const trimmed = targetUrl.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return res.redirect(statusCode, trimmed);
  }
  try {
    const u = new URL(trimmed);
    if ((u.protocol === 'http:' || u.protocol === 'https:') && isHostAllowed(u.hostname)) {
      return res.redirect(statusCode, u.toString());
    }
  } catch {
    /* fallback to safe default */
  }
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
  if (value == null) return '';
  return String(value)
    .replace(/[\r\n\x00-\x1F\x7F-\x9F]+/g, ' ')
    .trim();
}

export default {
  escapeHtml,
  sanitizeOAuthState,
  isHostAllowed,
  isSafeRedirectUrl,
  sanitizeRedirectUrl,
  safeRedirect,
  sanitizeLog,
};




import { redisSet, redisGetJson, redisDel } from './redis-client.js';

/**
 * APK OAuth hand-off. The deep link back into the app (site.waste2goods.app://auth) is not
 * reliable: some browsers never follow a redirect to a custom scheme, so the login finishes in the
 * browser but the app never gets the tokens. Instead, the app makes a random nonce when it starts
 * the login, and the OAuth callback also stores the session under that nonce. When the app comes
 * back to the foreground it collects the session once from GET /api/auth/app-session/:nonce.
 * The nonce is a 128-bit secret only the app knows; the stored session can be read once and
 * expires after 10 minutes.
 */
const PREFIX = 'oauth:app-handoff:';
const TTL_SEC = 600;
const NONCE_RE = /^[a-f0-9]{32,64}$/;

/** The app's nonce from the OAuth start request, or '' when there is none or it is malformed. */
export function appNonceFrom(req) {
  const n = String(req.query?.app_nonce || '').toLowerCase();
  return NONCE_RE.test(n) ? n : '';
}

export async function stashAppSession(nonce, params) {
  if (!nonce || !NONCE_RE.test(nonce)) return;
  await redisSet(PREFIX + nonce, params, TTL_SEC);
}

export function attachAppHandoff(app) {
  app.get('/api/auth/app-session/:nonce', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const nonce = String(req.params.nonce || '').toLowerCase();
    if (!NONCE_RE.test(nonce)) return res.status(400).json({ error: 'invalid nonce' });
    const data = await redisGetJson(PREFIX + nonce);
    if (!data) return res.status(404).json({ pending: true });
    await redisDel(PREFIX + nonce);
    return res.json(data);
  });
}

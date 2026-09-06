import {
  redisSet, redisGet, redisGetJson, redisDel, redisDelPattern,
  redisBackendMode, redisStats, redisExists, redisExpire, redisTtl,
} from './redis-client.js';

const DEFAULT_TTL_SEC = 60;
const TAG_SET_PREFIX = 'tag:';
const NAMESPACE_CACHE = 'cache:';

function cacheKeyFor(scope, url) {
  const s = scope || 'pub';
  return `${NAMESPACE_CACHE}${s}:${url}`;
}

function tagKeyFor(tagName) {
  return `${NAMESPACE_CACHE}${TAG_SET_PREFIX}${tagName}`;
}

function scopeFromUser(req) {
  const r = req.user?.role;
  if (r === 'admin') return 'adm';
  if (r === 'kiosk') return 'kio';
  if (r === 'resident') return 'res';
  return 'pub';
}

export function cacheRoute(ttlSec = DEFAULT_TTL_SEC, opts = {}) {
  const tags = Array.isArray(opts.tags) ? opts.tags : [];
  const surrogate = opts.surrogateKey || null;
  const cachePrivate = Boolean(opts.private);
  return async function cacheRouteMiddleware(req, res, next) {
    if (req.method !== 'GET') return next();
    const scope = scopeFromUser(req);
    const url = req.originalUrl || req.url;
    const key = cacheKeyFor(scope, url);
    try {
      const cached = await redisGetJson(key);
      if (cached) {
        res.setHeader('X-W2G-Cache', 'HIT');
        res.setHeader('X-W2G-Cache-Scope', scope);
        res.setHeader('X-W2G-Cache-TTL', String(await redisTtl(key)));
        if (surrogate) res.setHeader('Surrogate-Key', `${surrogate} w2g-${scope}`);
        if (cachePrivate) res.setHeader('Cache-Control', 'private, max-age=0, s-maxage=' + Math.max(ttlSec, 1));
        else res.setHeader('Cache-Control', `public, max-age=${Math.max(1, Math.floor(ttlSec / 2))}, s-maxage=${ttlSec}, stale-while-revalidate=${Math.max(ttlSec, 30)}`);
        return res.status(200).json(cached);
      }
    } catch { /* fall through to DB on cache layer failure */ }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const statusOk = res.statusCode >= 200 && res.statusCode < 300;
      if (statusOk && body && typeof body === 'object') {
        redisSet(key, body, ttlSec).then(async () => {
          for (const t of tags) {
            await redisExpire(tagKeyFor(t), Math.max(ttlSec, 600));
          }
        }).catch(() => {});
      }
      res.setHeader('X-W2G-Cache', 'MISS');
      res.setHeader('X-W2G-Cache-Scope', scope);
      if (surrogate) res.setHeader('Surrogate-Key', `${surrogate} w2g-${scope}`);
      if (cachePrivate) res.setHeader('Cache-Control', 'private, max-age=0, s-maxage=' + Math.max(ttlSec, 1));
      else res.setHeader('Cache-Control', `public, max-age=${Math.max(1, Math.floor(ttlSec / 2))}, s-maxage=${ttlSec}, stale-while-revalidate=${Math.max(ttlSec, 30)}`);
      res.setHeader('Surrogate-Control', `max-age=${ttlSec}, stale-while-revalidate=${Math.max(ttlSec, 60)}`);
      return originalJson(body);
    };
    next();
  };
}

export async function invalidatePattern(pattern) {
  try {
    const n = await redisDelPattern(`${NAMESPACE_CACHE}*${pattern}*`);
    return n;
  } catch { return 0; }
}

export async function invalidateTag(tagName) {
  try {
    return await invalidatePattern(tagName);
  } catch { return 0; }
}

export async function warmCacheEntry(path, body, ttlSec = DEFAULT_TTL_SEC, scope = 'pub') {
  try {
    const key = cacheKeyFor(scope, path);
    await redisSet(key, body, ttlSec);
    return key;
  } catch { return null; }
}

export async function cacheStats() {
  try {
    const stats = await redisStats();
    const patterns = [
      { name: 'public',   match: `${NAMESPACE_CACHE}pub:*` },
      { name: 'resident', match: `${NAMESPACE_CACHE}res:*` },
      { name: 'admin',    match: `${NAMESPACE_CACHE}adm:*` },
      { name: 'kiosk',    match: `${NAMESPACE_CACHE}kio:*` },
    ];
    return {
      backend: redisBackendMode(),
      totalKeys: stats.namespacedKeys,
      namespace: NAMESPACE_CACHE,
      defaultTtlSec: DEFAULT_TTL_SEC,
      cacheLevels: [
        'L1: Express-response (in-app memory / Redis namespaced)',
        'L2: Redis (namespaced by role adm/res/kio/pub + TTLs 15s-60s)',
        'L3: Surrogate-Key / Surrogate-Control headers for CDN (Cloudflare/Fastly)',
      ],
      cdnHeaders: {
        emitted: true,
        cacheControl: 'public, max-age, s-maxage, stale-while-revalidate',
        surrogateControl: 'max-age, stale-while-revalidate',
        surrogateKey: '<resource-tag> w2g-<scope>',
        notes: 'CDN-ready; add Cloudflare in front — enable Tiered Cache + Cache Rules by Surrogate-Key.',
      },
      redis: stats,
    };
  } catch (err) {
    return { backend: redisBackendMode(), error: err.message };
  }
}

export const CacheBust = {
  users:       async () => { await invalidatePattern('/users');       await invalidatePattern('/leaderboard'); await invalidatePattern('/analytics'); return 'users'; },
  transactions:async () => { await invalidatePattern('/transactions');await invalidatePattern('/analytics');   await invalidatePattern('/users'); await invalidatePattern('/summary'); return 'transactions'; },
  rewards:     async () => { await invalidatePattern('/rewards');     await invalidatePattern('/redemptions'); await invalidatePattern('/analytics'); return 'rewards'; },
  redemptions: async () => { await invalidatePattern('/redemptions'); await invalidatePattern('/rewards');     await invalidatePattern('/analytics'); await invalidatePattern('/users'); return 'redemptions'; },
  kiosks:      async () => { await invalidatePattern('/kiosks'); return 'kiosks'; },
  all:         async () => {
    try {
      await redisDelPattern(`${NAMESPACE_CACHE}*`);
      return 'all';
    } catch { return 'all-fallback'; }
  },
};

export default {
  cacheRoute, invalidatePattern, invalidateTag, warmCacheEntry, cacheStats, CacheBust,
};

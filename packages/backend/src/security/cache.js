import mcache from 'memory-cache';

const DEFAULT_TTL_SEC = 60;

export function cacheRoute(ttlSec = DEFAULT_TTL_SEC) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    const scope = (req.user?.role === 'admin') ? 'adm:' : 'res:';
    const key = scope + (req.originalUrl || req.url);
    const cached = mcache.get(key);
    if (cached) {
      res.setHeader('X-W2G-Cache', 'HIT');
      return res.json(cached);
    }
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        mcache.put(key, body, ttlSec * 1000);
      }
      res.setHeader('X-W2G-Cache', 'MISS');
      return originalJson(body);
    };
    next();
  };
}

export function invalidatePattern(pattern) {
  try {
    const keys = mcache.keys();
    for (const k of keys) {
      if (typeof k === 'string' && k.includes(pattern)) mcache.del(k);
    }
  } catch { /* ignore */ }
}

export const CacheBust = {
  users:       () => { invalidatePattern('/users');       invalidatePattern('/leaderboard'); invalidatePattern('/analytics'); },
  transactions:() => { invalidatePattern('/transactions');invalidatePattern('/analytics');   invalidatePattern('/users'); invalidatePattern('/summary'); },
  rewards:     () => { invalidatePattern('/rewards');     invalidatePattern('/redemptions'); invalidatePattern('/analytics'); },
  redemptions: () => { invalidatePattern('/redemptions'); invalidatePattern('/rewards');     invalidatePattern('/analytics'); invalidatePattern('/users'); },
  kiosks:      () => { invalidatePattern('/kiosks'); },
  all:         () => {
    try { for (const k of mcache.keys()) mcache.del(k); } catch {}
  },
};

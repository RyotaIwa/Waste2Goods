import rateLimit, { MemoryStore } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClientModule, {
  isRedisEnabled, redisBackendMode, redisIncr, redisGet,
} from './redis-client.js';

const redisStoreCache = new Map();

/**
 * Resolve (and memoize) a Redis-backed store for one limiter tier.
 *
 * Resolution is lazy — it is retried on every call — because `isRedisEnabled()`
 * only becomes true once ioredis has emitted its async 'ready' event. Building
 * these stores at module-eval time would therefore always miss Redis and silently
 * pin every tier to per-process memory.
 */
function resolveRedisStore(prefix) {
  if (!isRedisEnabled()) return undefined;
  if (redisStoreCache.has(prefix)) return redisStoreCache.get(prefix);
  let store;
  try {
    const factory = redisClientModule.makeRateLimitRedisStore;
    if (typeof factory === 'function') {
      const built = factory(`rl:${prefix}:`);
      if (built) store = built;
    }
    if (!store) {
      store = new RedisStore({
        prefix: `w2g:rl:${prefix}:`,
        sendCommand: async (command, ...args) => {
          const fallback = await redisIncr(`${prefix}:${args[0] || 'k'}`, 1, 60);
          return [String(fallback)];
        },
      });
    }
  } catch {
    store = undefined;
  }
  // Only memoize a real store — caching `undefined` would pin the tier to memory
  // forever and defeat the lazy retry that lets us pick Redis up after it connects.
  if (store) redisStoreCache.set(prefix, store);
  return store;
}

/**
 * Rate-limit store that uses Redis when it is reachable and degrades to a local
 * in-memory store otherwise.
 *
 * Redis is the "stronger" mode: the counter lives in shared storage, so limits
 * hold across server restarts and across multiple app instances. When Redis is
 * down we deliberately keep serving traffic from memory instead of throwing —
 * availability over strictness — and surface that downgrade via rateLimitInfo().
 */
class RedisAwareStore {
  constructor(prefix) {
    this.prefix = prefix;
    this.localKeys = false;
    this.memory = new MemoryStore();
  }

  init(options) {
    this.memory.init(options);
    return true;
  }

  get backend() {
    return resolveRedisStore(this.prefix) ? 'redis' : 'memory';
  }

  #redis() {
    return resolveRedisStore(this.prefix);
  }

  async increment(key) {
    const redis = this.#redis();
    if (!redis) return this.memory.increment(key);
    try {
      return await redis.increment(key);
    } catch {
      return this.memory.increment(key);
    }
  }

  async get(key) {
    const redis = this.#redis();
    if (!redis) return this.memory.get(key);
    try {
      return await redis.get(key);
    } catch {
      return this.memory.get(key);
    }
  }

  async decrement(key) {
    const redis = this.#redis();
    if (!redis) return this.memory.decrement(key);
    try {
      return await redis.decrement(key);
    } catch {
      return this.memory.decrement(key);
    }
  }

  async resetKey(key) {
    const redis = this.#redis();
    this.memory.resetKey(key);
    if (!redis) return;
    try {
      return await redis.resetKey(key);
    } catch { /* best-effort */ }
  }

  async resetAll() {
    const redis = this.#redis();
    this.memory.resetAll();
    if (!redis) return;
    try {
      return await redis.resetAll();
    } catch { /* best-effort */ }
  }
}

// Tier names double as the Redis key prefix, so every tier gets its own counter
// namespace. Keep this list in sync with the `redisAwareStore(...)` calls below.
const TIER_NAMES = [
  'global', 'auth', 'authFailure', 'write',
  'analyticsHeavy', 'kiosk', 'oauthAuthorize', 'oauthToken',
];

function storeBackends() {
  const out = {};
  for (const tier of TIER_NAMES) {
    out[tier] = resolveRedisStore(tier) ? 'redis' : 'memory';
  }
  return out;
}

const redisAwareStore = (tier) => new RedisAwareStore(tier);


const standardOpts = {
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req) => req.user?.sub || req.ip || 'anon',
};

const ipKeyGen = (req) => req.ip || 'anon';
const userOrIpKeyGen = (req) => req.user?.sub || req.ip || 'anon';

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  store: redisAwareStore('global'),
  message: { error: 'Too many requests — try again in 1 minute (Global: 1000/ip/min)' },
  keyGenerator: ipKeyGen,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  skipSuccessfulRequests: true,
  store: redisAwareStore('auth'),
  message: { error: 'Too many login/register attempts — try again in 15 minutes (Auth: 10/ip/15min)' },
  keyGenerator: ipKeyGen,
});

export const authFailureLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  skipSuccessfulRequests: true,
  store: redisAwareStore('authFailure'),
  message: { error: 'Account login temporarily locked — 5 consecutive failures. Reset via email or try again in 5 minutes.' },
  keyGenerator: (req) => `fail:${(req.body?.email || '').toLowerCase().trim() || ipKeyGen(req)}`,
});

export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  store: redisAwareStore('write'),
  message: { error: 'Too many write operations per minute — slow down (Writes: 30/user/min)' },
  keyGenerator: userOrIpKeyGen,
});

export const analyticsHeavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  store: redisAwareStore('analyticsHeavy'),
  message: { error: 'Too many analytics queries — analytics endpoint: 60 req/user/min' },
  keyGenerator: userOrIpKeyGen,
});

export const kioskLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  store: redisAwareStore('kiosk'),
  message: { error: 'Kiosk rate limit exceeded (120/min)' },
  keyGenerator: (req) => `kiosk:${req.user?.sub || req.ip || 'kiosk-unknown'}`,
});

export const oauthAuthorizeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  store: redisAwareStore('oauthAuthorize'),
  message: { error: 'OAuth authorization rate limited (30/5min)' },
  keyGenerator: ipKeyGen,
});

export const oauthTokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  store: redisAwareStore('oauthToken'),
  message: { error: 'OAuth token endpoint rate limited (60/min)' },
  keyGenerator: ipKeyGen,
});

export function delayPenaltyMiddleware(windowSec = 60, threshold = 5, extraMsPerStep = 250, maxDelayMs = 3000) {
  return async function delayPenalty(req, res, next) {
    const k = `delay:${req.route?.path || req.path}:${req.ip}`;
    try {
      let current = Number(await redisGet(k) || 0);
      current += 1;
      await redisIncr(k, 1, windowSec);
      if (current > threshold) {
        const steps = Math.min(current - threshold, Math.floor(maxDelayMs / extraMsPerStep));
        const delay = steps * extraMsPerStep;
        await new Promise((r) => setTimeout(r, delay));
      }
    } catch { /* never block on rate infra failure */ }
    next();
  };
}

export function rateLimitInfo() {
  const tiers = [
    { name: 'global',          limit: '1000', window: '60s',  scope: 'IP',         keyPrefix: 'rl:global:' },
    { name: 'auth',            limit: '10',   window: '15m',  scope: 'IP',         keyPrefix: 'rl:auth:' },
    { name: 'authFailure',     limit: '5',    window: '5m',   scope: 'Email + IP', keyPrefix: 'rl:fail:' },
    { name: 'write',           limit: '30',   window: '60s',  scope: 'User or IP', keyPrefix: 'rl:write:' },
    { name: 'analyticsHeavy',  limit: '60',   window: '60s',  scope: 'User or IP', keyPrefix: 'rl:analytics:' },
    { name: 'kiosk',           limit: '120',  window: '60s',  scope: 'Kiosk User', keyPrefix: 'rl:kiosk:' },
    { name: 'oauthAuthorize',  limit: '30',   window: '5m',   scope: 'IP',         keyPrefix: 'rl:oauth-auth:' },
    { name: 'oauthToken',      limit: '60',   window: '60s',  scope: 'IP',         keyPrefix: 'rl:oauth-token:' },
  ];
  return {
    backend: redisBackendMode(),
    storeBackends: storeBackends(),
    storeMode: isRedisEnabled()
      ? 'Redis shared store — counters survive restarts and are shared across app instances'
      : 'In-memory store — counters are per-process and reset on restart (set REDIS_ENABLED=true + start Redis for shared limits)',
    progressiveDelayPolicy: { threshold: 5, stepMs: 250, maxMs: 3000, windowSec: 60 },
    tiers,
  };
}

export default {
  globalLimiter, authLimiter, authFailureLimiter, writeLimiter,
  analyticsHeavyLimiter, kioskLimiter, oauthAuthorizeLimiter, oauthTokenLimiter,
  delayPenaltyMiddleware, rateLimitInfo,
};

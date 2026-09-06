import { createHash } from 'node:crypto';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || process.env.REDIS_URI;
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const REDIS_DB = Number(process.env.REDIS_DB || 0);
const REDIS_ENABLED = ['1', 'true', 'yes', 'on'].includes(String(process.env.REDIS_ENABLED || ''));

const NAMESPACE = 'w2g:';

const inMemoryStore = new Map();
const inMemoryExpiry = new Map();

function memKeys() {
  return Array.from(inMemoryStore.keys());
}

function memPut(key, value, ttlMs = 0) {
  const k = String(key);
  inMemoryStore.set(k, typeof value === 'string' ? value : JSON.stringify(value));
  if (ttlMs > 0) inMemoryExpiry.set(k, Date.now() + ttlMs);
}

function memGet(key) {
  const k = String(key);
  const expAt = inMemoryExpiry.get(k);
  if (expAt && expAt < Date.now()) {
    inMemoryStore.delete(k);
    inMemoryExpiry.delete(k);
    return null;
  }
  return inMemoryStore.get(k) || null;
}

function memDel(key) {
  const k = String(key);
  inMemoryStore.delete(k);
  inMemoryExpiry.delete(k);
  return 1;
}

function memDelPattern(pattern) {
  const regex = new RegExp(pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.'));
  let count = 0;
  for (const k of memKeys()) {
    if (regex.test(k)) { memDel(k); count++; }
  }
  return count;
}

function memIncr(key, by = 1) {
  const current = Number(memGet(key) || 0);
  const next = current + by;
  memPut(key, String(next));
  return next;
}

function memExpire(key, ttlSec) {
  if (!inMemoryStore.has(String(key))) return 0;
  inMemoryExpiry.set(String(key), Date.now() + ttlSec * 1000);
  return 1;
}

function memTtl(key) {
  const k = String(key);
  if (!inMemoryStore.has(k)) return -2;
  const expAt = inMemoryExpiry.get(k);
  if (!expAt) return -1;
  const remainingMs = expAt - Date.now();
  return remainingMs <= 0 ? -2 : Math.ceil(remainingMs / 1000);
}

let redisInstance = null;
let redisOk = false;
let lastError = null;

function buildRedisClient() {
  if (!REDIS_ENABLED && !REDIS_URL) return null;
  try {
    const opts = {
      host: REDIS_HOST,
      port: REDIS_PORT,
      db: REDIS_DB,
      password: REDIS_PASSWORD,
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      connectTimeout: 1500,
      lazyConnect: false,
      showFriendlyErrorStack: false,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
    };
    const client = REDIS_URL ? new Redis(REDIS_URL, opts) : new Redis(opts);
    client.on('ready', () => { redisOk = true; console.log('🔴 Redis connected: namespace=' + NAMESPACE); });
    client.on('error', (err) => { redisOk = false; lastError = err.message; });
    client.on('close', () => { redisOk = false; });
    return client;
  } catch (err) {
    lastError = err.message;
    return null;
  }
}

if (REDIS_ENABLED || REDIS_URL) {
  redisInstance = buildRedisClient();
}

function ns(key) {
  return key.startsWith(NAMESPACE) ? key : NAMESPACE + key;
}

function stripNs(prefixed) {
  return prefixed.startsWith(NAMESPACE) ? prefixed.slice(NAMESPACE.length) : prefixed;
}

export function isRedisEnabled() {
  return Boolean(redisInstance) && redisOk;
}

export function redisBackendMode() {
  return isRedisEnabled() ? 'redis' : 'memory';
}

export async function redisSet(key, value, ttlSec = 0) {
  const k = ns(key);
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  try {
    if (isRedisEnabled()) {
      if (ttlSec > 0) await redisInstance.set(k, payload, 'EX', Number(ttlSec));
      else await redisInstance.set(k, payload);
      return true;
    }
  } catch (err) { lastError = err.message; }
  memPut(k, payload, ttlSec > 0 ? ttlSec * 1000 : 0);
  return true;
}

export async function redisGet(key) {
  const k = ns(key);
  try {
    if (isRedisEnabled()) {
      const v = await redisInstance.get(k);
      return v;
    }
  } catch (err) { lastError = err.message; }
  return memGet(k);
}

export async function redisGetJson(key) {
  const raw = await redisGet(key);
  if (raw == null) return null;
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return null; }
}

export async function redisDel(key) {
  const k = ns(key);
  try {
    if (isRedisEnabled()) {
      const n = await redisInstance.del(k);
      return n;
    }
  } catch (err) { lastError = err.message; }
  return memDel(k) ? 1 : 0;
}

export async function redisDelPattern(pattern) {
  const scopedPattern = ns(pattern);
  try {
    if (isRedisEnabled()) {
      let cursor = '0';
      let total = 0;
      do {
        const [nextCursor, keys] = await redisInstance.scan(cursor, 'MATCH', scopedPattern, 'COUNT', 200);
        cursor = nextCursor;
        if (keys.length > 0) total += await redisInstance.del(...keys);
      } while (cursor !== '0');
      return total;
    }
  } catch (err) { lastError = err.message; }
  return memDelPattern(scopedPattern);
}

export async function redisIncr(key, by = 1, ttlSec = 0) {
  const k = ns(key);
  try {
    if (isRedisEnabled()) {
      const v = await redisInstance.incrby(k, by);
      if (ttlSec > 0) await redisInstance.expire(k, ttlSec, 'NX');
      return v;
    }
  } catch (err) { lastError = err.message; }
  const v = memIncr(k, by);
  if (ttlSec > 0) memExpire(k, ttlSec);
  return v;
}

export async function redisExpire(key, ttlSec) {
  const k = ns(key);
  try {
    if (isRedisEnabled()) { return Number(await redisInstance.expire(k, ttlSec)); }
  } catch (err) { lastError = err.message; }
  return memExpire(k, ttlSec);
}

export async function redisTtl(key) {
  const k = ns(key);
  try {
    if (isRedisEnabled()) { return Number(await redisInstance.ttl(k)); }
  } catch (err) { lastError = err.message; }
  return memTtl(k);
}

export async function redisExists(key) {
  const k = ns(key);
  try {
    if (isRedisEnabled()) { return Number(await redisInstance.exists(k)) > 0; }
  } catch (err) { lastError = err.message; }
  return memGet(k) !== null;
}

export async function redisStats() {
  let totalKeys = 0;
  try {
    if (isRedisEnabled()) {
      const info = await redisInstance.info('keyspace');
      const m = info.match(/db0:keys=(\d+)/);
      totalKeys = m ? Number(m[1]) : 0;
    } else {
      totalKeys = memKeys().filter(k => k.startsWith(NAMESPACE)).length;
    }
  } catch (err) { lastError = err.message; totalKeys = memKeys().length; }
  return {
    backend: redisBackendMode(),
    namespace: NAMESPACE,
    connected: isRedisEnabled(),
    lastError,
    redisEnabledEnv: Boolean(REDIS_ENABLED || REDIS_URL),
    host: isRedisEnabled() ? `${REDIS_HOST}:${REDIS_PORT}` : null,
    db: REDIS_DB,
    namespacedKeys: totalKeys,
  };
}

export function makeRateLimitRedisStore() {
  if (!isRedisEnabled()) return undefined;
  try {
    const { RedisStore } = require?.('rate-limit-redis') ||
      (globalThis.__rate_limit_redis_loaded);
    if (!RedisStore) return undefined;
    return new RedisStore({
      sendCommand: async (...args) => redisInstance.call(...args),
      prefix: ns('rl:'),
    });
  } catch {
    return undefined;
  }
}

export default {
  isRedisEnabled, redisBackendMode, redisSet, redisGet, redisGetJson,
  redisDel, redisDelPattern, redisIncr, redisExpire, redisTtl,
  redisExists, redisStats, makeRateLimitRedisStore, NAMESPACE,
};

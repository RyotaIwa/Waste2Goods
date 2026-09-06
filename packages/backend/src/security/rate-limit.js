import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import {
  isRedisEnabled, redisBackendMode, redisIncr, redisExpire, redisGet,
} from './redis-client.js';

function buildRedisStore(prefix) {
  if (!isRedisEnabled()) return undefined;
  try {
    return new RedisStore({
      prefix: `w2g:rl:${prefix}:`,
      sendCommand: async (command, ...args) => {
        const Redis = (await import('ioredis')).default;
        const i = Redis.default || Redis;
        const client = (await import('./redis-client.js')).default;
        if (client && client._raw) return client._raw.call(...[command, ...args]);
        const fallback = await redisIncr(`${prefix}:${args[0] || 'k'}`, 1, 60);
        return [String(fallback)];
      },
    });
  } catch {
    return undefined;
  }
}

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
  message: { error: 'Account login temporarily locked — 5 consecutive failures. Reset via email or try again in 5 minutes.' },
  keyGenerator: (req) => `fail:${(req.body?.email || '').toLowerCase().trim() || ipKeyGen(req)}`,
});

export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { error: 'Too many write operations per minute — slow down (Writes: 30/user/min)' },
  keyGenerator: userOrIpKeyGen,
});

export const analyticsHeavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { error: 'Too many analytics queries — analytics endpoint: 60 req/user/min' },
  keyGenerator: userOrIpKeyGen,
});

export const kioskLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { error: 'Kiosk rate limit exceeded (120/min)' },
  keyGenerator: (req) => `kiosk:${req.user?.sub || req.ip || 'kiosk-unknown'}`,
});

export const oauthAuthorizeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { error: 'OAuth authorization rate limited (30/5min)' },
  keyGenerator: ipKeyGen,
});

export const oauthTokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
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
    progressiveDelayPolicy: { threshold: 5, stepMs: 250, maxMs: 3000, windowSec: 60 },
    tiers,
  };
}

export default {
  globalLimiter, authLimiter, authFailureLimiter, writeLimiter,
  analyticsHeavyLimiter, kioskLimiter, oauthAuthorizeLimiter, oauthTokenLimiter,
  delayPenaltyMiddleware, rateLimitInfo,
};

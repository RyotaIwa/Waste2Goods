/**
 * Redis health-check / verification script.
 *
 * Answers the question "is Redis actually being used, and does it work?"
 * by exercising the SAME client the app uses (`src/security/redis-client.js`)
 * with a real SET -> GET -> TTL -> INCR -> DEL round-trip.
 *
 * Usage (from packages/backend):
 *   node redis-check.mjs
 *
 * Exit codes:
 *   0 = Redis backend active and all round-trip assertions passed
 *   1 = running on the in-memory fallback (Redis not reachable / not enabled)
 *
 * Note: this imports ONLY the Redis client — no MySQL, no Express — so it is
 * safe to run before XAMPP is started.
 */

import 'dotenv/config'; // must come first: loads packages/backend/.env onto process.env
import {
  redisStats, redisSet, redisGet, redisTtl,
  redisIncr, redisDel, isRedisEnabled,
} from './src/security/redis-client.js';

const TEST_KEY = `healthcheck:${Date.now()}`;
const READY_TIMEOUT_MS = 6000;

/**
 * ioredis connects asynchronously: `redis-client.js` only reports
 * `backend: 'redis'` once the socket has emitted its 'ready' event.
 * This script is short-lived, so without this wait it would race the
 * handshake and always look like the in-memory fallback.
 */
async function waitForRedisReady(timeoutMs = READY_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (isRedisEnabled()) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return isRedisEnabled();
}

function line(ok, label, detail = '') {
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`  [${mark}] ${label}${detail ? ' - ' + detail : ''}`);
}

async function run() {
  console.log('Waste2Goods - Redis verification\n');
  console.log('Running against the live redis-client.js module (same code path as the API).\n');

  // 1. Configuration / connection state
  const configured = ['1', 'true', 'yes', 'on'].includes(String(process.env.REDIS_ENABLED || '').toLowerCase())
    || Boolean(process.env.REDIS_URL || process.env.REDIS_URI);
  const ready = configured ? await waitForRedisReady() : false;
  if (configured && !ready) {
    console.log(`(waited ${READY_TIMEOUT_MS}ms for the Redis handshake - it did not complete)\n`);
  }
  const stats = await redisStats();
  console.log('Connection state:');
  console.log(`  backend mode        : ${stats.backend}`);
  console.log(`  REDIS_ENABLED env   : ${stats.redisEnabledEnv}`);
  console.log(`  namespace           : ${stats.namespace}`);
  console.log(`  host                : ${stats.host ?? '(not connected - using in-memory fallback)'}`);
  console.log(`  db                  : ${stats.db}`);
  console.log(`  namespaced keys     : ${stats.namespacedKeys}`);
  if (stats.lastError) console.log(`  last error          : ${stats.lastError}`);
  console.log('');

  const connected = isRedisEnabled();
  let allPassed = true;
  const expect = (cond, label, detail = '') => {
    line(cond, label, detail);
    if (!cond) allPassed = false;
  };

  console.log('Round-trip operations:');

  // 2. SET with TTL
  const wrote = await redisSet(TEST_KEY, JSON.stringify({ hello: 'w2g' }), 30);
  expect(wrote === true, `SET ${stats.namespace}${TEST_KEY} (EX 30s)`);

  // 3. GET returns the stored payload
  const raw = await redisGet(TEST_KEY);
  expect(raw !== null, 'GET returned a value', raw === null ? 'null' : String(raw).slice(0, 60));

  // 4. TTL is a live countdown (0 < ttl <= 30)
  const ttl = await redisTtl(TEST_KEY);
  expect(ttl > 0 && ttl <= 30, 'TTL is set and counting down', `ttl=${ttl}s`);

  // 5. INCR produces an atomic counter
  const incrKey = `${TEST_KEY}:counter`;
  const first = await redisIncr(incrKey, 1, 30);
  const second = await redisIncr(incrKey, 1, 30);
  expect(Number(second) === Number(first) + 1, 'INCR is atomic (1 then 2)', `values=${first},${second}`);

  // 6. DEL removes the keys
  const deleted = await redisDel(TEST_KEY);
  await redisDel(incrKey);
  const afterDelete = await redisGet(TEST_KEY);
  expect(afterDelete === null, 'DEL removed the key', `del=${deleted}, get=${afterDelete === null ? 'null' : 'still present'}`);

  console.log('');
  console.log('Result:');
  if (!connected) {
    console.log('  [!] Redis is NOT being used - the app is running on its in-memory fallback.');
    console.log('      The round-trip logic above still works (that is the fallback doing its job),');
    console.log('      but cache/rate-limit state is per-process and lost on restart.');
    console.log('');
    console.log('  Fix it with:');
    console.log('    1. Start Redis:  docker run -d -p 6379:6379 --name w2g-redis redis:alpine');
    console.log('    2. Enable it:    REDIS_ENABLED=true in packages/backend/.env');
    console.log('    3. Restart the backend and run this check again.');
    console.log('    (or run:  pwsh -File scripts/redis.ps1 up)');
    process.exit(1);
  }

  if (!allPassed) {
    console.log('  [x] Redis is connected but one or more round-trip assertions FAILED (see above).');
    process.exit(1);
  }

  console.log(`  [ok] Redis backend ACTIVE at ${stats.host} (db ${stats.db}) - all round-trip checks passed.`);
  console.log(`     Cache, rate-limit counters, revoked JWTs and OAuth state now live in Redis under "${stats.namespace}".`);
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Redis check crashed:', err?.message || err);
  process.exit(1);
});

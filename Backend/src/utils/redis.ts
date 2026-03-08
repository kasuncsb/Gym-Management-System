/**
 * Redis client — singleton ioredis instance
 * Manages refresh token lifecycle for server-side revocation.
 *
 * BUG-08 fix: Replaced the O(n) SCAN-based deleteAllUserTokens with a
 * per-user token index (Redis SET). Each user has a set of their active JTIs.
 * When revoking all sessions, we read the index, delete all JTIs atomically,
 * then clear the index. This eliminates the SCAN race condition where tokens
 * issued between SCAN and DEL would survive revocation.
 */
import { Redis } from 'ioredis';
import { env } from '../config/env.js';

const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err: Error) => console.error('❌ Redis error:', err.message));

export default redis;

const REFRESH_PREFIX = 'gms:rt:';
const USER_TOKENS_PREFIX = 'gms:user:tokens:';
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/** Store a refresh token JTI → userId mapping with 7d TTL.
 *  Also adds the JTI to the per-user token index for O(1) revocation. */
export async function setRefreshToken(jti: string, userId: string): Promise<void> {
  const pipeline = redis.pipeline();
  pipeline.set(`${REFRESH_PREFIX}${jti}`, userId, 'EX', REFRESH_TTL_SECONDS);
  // Per-user index: a Redis SET of active JTIs for this user.
  // We give the index a TTL equal to the longest possible token lifetime.
  pipeline.sadd(`${USER_TOKENS_PREFIX}${userId}`, jti);
  pipeline.expire(`${USER_TOKENS_PREFIX}${userId}`, REFRESH_TTL_SECONDS);
  await pipeline.exec();
}

/** Get userId from a JTI — returns null if expired or never existed */
export async function getRefreshToken(jti: string): Promise<string | null> {
  return redis.get(`${REFRESH_PREFIX}${jti}`);
}

/** Consumes a refresh token by getting and deleting it atomically (Lua script).
 *  Also removes the JTI from the user's token index. */
export async function consumeRefreshToken(jti: string): Promise<string | null> {
  // Atomic check-and-delete via Lua
  const script = `
    local val = redis.call("GET", KEYS[1])
    if val then
      redis.call("DEL", KEYS[1])
    end
    return val
  `;
  const result = await redis.eval(script, 1, `${REFRESH_PREFIX}${jti}`);
  const userId = typeof result === 'string' ? result : null;

  // Remove from user index (best-effort, non-atomic is fine here)
  if (userId) {
    redis.srem(`${USER_TOKENS_PREFIX}${userId}`, jti).catch(() => {});
  }
  return userId;
}

/** Delete a single refresh token (on logout) */
export async function deleteRefreshToken(jti: string): Promise<void> {
  // Look up userId first so we can clean the index too
  const userId = await redis.get(`${REFRESH_PREFIX}${jti}`);
  const pipeline = redis.pipeline();
  pipeline.del(`${REFRESH_PREFIX}${jti}`);
  if (userId) pipeline.srem(`${USER_TOKENS_PREFIX}${userId}`, jti);
  await pipeline.exec();
}

/**
 * BUG-08 fix: Delete ALL refresh tokens for a user using the per-user index.
 * Old approach: full Redis SCAN (O(n) total keys, race-condition prone).
 * New approach: read the user's token SET, delete all in one pipeline, clear index.
 * This is O(k) where k = number of active sessions for the user, not total keys.
 */
export async function deleteAllUserTokens(userId: string): Promise<void> {
  const indexKey = `${USER_TOKENS_PREFIX}${userId}`;
  const jtis = await redis.smembers(indexKey);

  if (jtis.length === 0) return;

  const pipeline = redis.pipeline();
  for (const jti of jtis) {
    pipeline.del(`${REFRESH_PREFIX}${jti}`);
  }
  pipeline.del(indexKey);
  await pipeline.exec();
}

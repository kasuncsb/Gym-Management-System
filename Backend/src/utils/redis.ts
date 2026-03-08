/**
 * Redis client — singleton ioredis instance
 * Manages refresh token lifecycle for server-side revocation.
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
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/** Store a refresh token JTI → userId mapping with 7d TTL */
export async function setRefreshToken(jti: string, userId: string): Promise<void> {
  await redis.set(`${REFRESH_PREFIX}${jti}`, userId, 'EX', REFRESH_TTL_SECONDS);
}

/** Get userId from a JTI — returns null if expired or never existed */
export async function getRefreshToken(jti: string): Promise<string | null> {
  return redis.get(`${REFRESH_PREFIX}${jti}`);
}

/** Consumes a refresh token by getting and deleting it in one step (simulate or use getdel) */
export async function consumeRefreshToken(jti: string): Promise<string | null> {
  // Using a Lua script ensures atomic check-and-delete
  const script = `
    local val = redis.call("GET", KEYS[1])
    if val then
      redis.call("DEL", KEYS[1])
    end
    return val
  `;
  const result = await redis.eval(script, 1, `${REFRESH_PREFIX}${jti}`);
  return typeof result === 'string' ? result : null;
}

/** Delete a single refresh token (on use or logout) */
export async function deleteRefreshToken(jti: string): Promise<void> {
  await redis.del(`${REFRESH_PREFIX}${jti}`);
}

/**
 * Delete ALL refresh tokens for a user.
 * Used on password change or suspected compromise.
 * Note: This requires a SCAN — fine for a single-branch system.
 */
export async function deleteAllUserTokens(userId: string): Promise<void> {
  let cursor = '0';
  const keysToDelete: string[] = [];

  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${REFRESH_PREFIX}*`, 'COUNT', 100);
    cursor = nextCursor;
    for (const key of keys) {
      const val = await redis.get(key);
      if (val === userId) keysToDelete.push(key);
    }
  } while (cursor !== '0');

  if (keysToDelete.length > 0) {
    await redis.del(...keysToDelete);
  }
}

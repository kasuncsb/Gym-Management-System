// In-Memory Cache Utility — Phase 3
// Simple TTL-based cache for hot queries (plans, branches, stats)

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(cleanupIntervalMs = 60000) {
    // Clean expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
  }

  /** Get a cached value, or undefined if expired/missing */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data as T;
  }

  /** Set a value with TTL in seconds */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /** Delete a specific key */
  delete(key: string): void {
    this.store.delete(key);
  }

  /** Invalidate all keys matching a prefix */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  /** Clear all cache */
  clear(): void {
    this.store.clear();
  }

  /** Get cache stats */
  stats() {
    let active = 0;
    let expired = 0;
    const now = Date.now();
    for (const entry of this.store.values()) {
      if (now > entry.expiresAt) expired++;
      else active++;
    }
    return { active, expired, total: this.store.size };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Singleton instance
export const cache = new MemoryCache();

/**
 * Decorator-style helper: get from cache or execute fn and cache result.
 * Usage: const plans = await cacheOrFetch('plans:all', 300, () => db.select()...)
 */
export async function cacheOrFetch<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== undefined) return cached;

  const data = await fetchFn();
  cache.set(key, data, ttlSeconds);
  return data;
}

import { Redis } from 'ioredis';
import { logger } from './logger.js';

const createRedisClient = (): Redis => {
  const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 3) return null; // stop retrying, fallback to no-cache
      return Math.min(times * 200, 1000);
    },
  });

  client.on('connect', () => logger.info('✅ Redis connected'));
  client.on('error', (err) => {
    logger.warn({ err: err.message }, '⚠️  Redis unavailable — caching disabled');
  });

  client.connect().catch(() => {/* handled by error event */});
  return client;
};

export const redis = createRedisClient();

export async function cacheGet(key: string): Promise<string | null> {
  try { return await redis.get(key); } catch { return null; }
}

export async function cacheSet(key: string, ttl: number, value: string): Promise<void> {
  try { await redis.setex(key, ttl, value); } catch { /* silent */ }
}

export async function cacheDel(key: string): Promise<void> {
  try { await redis.del(key); } catch { /* silent */ }
}

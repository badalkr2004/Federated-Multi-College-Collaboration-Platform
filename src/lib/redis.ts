import Redis from 'ioredis';
import { env } from '../config/env.js';
import { logger } from './logger.js';

let redisClient: Redis | null = null;

function createRedisClient(): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  client.on('connect', () => logger.info('Redis connected'));
  client.on('error', (err) => logger.warn({ err }, 'Redis error — caching disabled'));

  return client;
}

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

// Safe helpers that gracefully fail if Redis is down
export async function cacheGet(key: string): Promise<string | null> {
  try {
    return await getRedis().get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  try {
    await getRedis().setex(key, ttlSeconds, value);
  } catch {
    // Redis down — skip caching, don't crash
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await getRedis().del(key);
  } catch {
    // ignore
  }
}

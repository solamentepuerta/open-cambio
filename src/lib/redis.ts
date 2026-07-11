import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;
  if (!redisClient) redisClient = new Redis({ url, token });
  return redisClient;
}

export async function safeRedisGet<T>(key: string): Promise<T | null> {
  try {
    return (await getRedis()?.get<T>(key)) ?? null;
  } catch (error) {
    console.warn("Redis get failed", error);
    return null;
  }
}

export async function safeRedisSet<T>(
  key: string,
  value: T,
  ttlSeconds?: number,
): Promise<boolean> {
  try {
    const redis = getRedis();
    if (!redis) return false;
    if (ttlSeconds) await redis.set(key, value, { ex: ttlSeconds });
    else await redis.set(key, value);
    return true;
  } catch (error) {
    console.warn("Redis set failed", error);
    return false;
  }
}

export async function safeRedisTtl(key: string): Promise<number | null> {
  try {
    const redis = getRedis();
    if (!redis) return null;
    return await redis.ttl(key);
  } catch (error) {
    console.warn("Redis ttl failed", error);
    return null;
  }
}

export async function acquireRedisLock(
  key: string,
  ttlSeconds: number,
): Promise<string | null> {
  try {
    const redis = getRedis();
    if (!redis) return null;
    const token = crypto.randomUUID();
    const result = await redis.set(key, token, { ex: ttlSeconds, nx: true });
    return result === "OK" ? token : null;
  } catch (error) {
    console.warn("Redis lock failed", error);
    return null;
  }
}

export async function releaseRedisLock(key: string, token: string): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;
    await redis.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      [key],
      [token],
    );
  } catch (error) {
    console.warn("Redis unlock failed", error);
  }
}

import { Redis } from "@upstash/redis";

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function safeRedisGet<T>(key: string): Promise<T | null> {
    try {
        return await redis.get<T>(key);
    } catch (err) {
        console.warn("⚠ Redis get failed, returning null", err);
        return null;
    }
}

export async function safeRedisSet<T>(key: string, value: T): Promise<boolean> {
    try {
        await redis.set(key, value);
        return true;
    } catch (err) {
        console.warn("⚠ Redis set failed", err);
        return false;
    }
}

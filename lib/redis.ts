import { Redis } from 'ioredis';

// Create a Redis client
const getRedisClient = (): Redis => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  return new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number): number => {
      // Retry connection after increasing delay
      return Math.min(times * 50, 2000);
    },
  });
};

// Create a singleton Redis client
let redisClient: Redis | null = null;

export const getRedis = (): Redis => {
  if (!redisClient) {
    redisClient = getRedisClient();
  }
  return redisClient;
};

// Cache middleware
export async function cacheData<T>(
  key: string,
  fetchData: () => Promise<T>,
  expirationInSeconds: number = 3600
): Promise<T> {
  const redis = getRedis();
  
  try {
    // Try to get data from cache
    const cachedData = await redis.get(key);
    
    if (cachedData) {
      return JSON.parse(cachedData) as T;
    }
    
    // If not in cache, fetch the data
    const freshData = await fetchData();
    
    // Store in cache
    await redis.set(
      key,
      JSON.stringify(freshData),
      'EX',
      expirationInSeconds
    );
    
    return freshData;
  } catch (error: any) {
    console.error('Redis cache error:', error);
    // Fallback to fetching data directly if caching fails
    return fetchData();
  }
}

// Invalidate cache
export async function invalidateCache(keyPattern: string): Promise<void> {
  const redis = getRedis();
  
  try {
    const keys = await redis.keys(keyPattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error: any) {
    console.error('Redis invalidation error:', error);
  }
}

// Rate limiting function
export async function rateLimit(
  identifier: string,
  maxRequests: number,
  windowInSeconds: number
): Promise<boolean> {
  const redis = getRedis();
  const key = `ratelimit:${identifier}`;
  
  try {
    // Increment the counter
    const count = await redis.incr(key);
    
    // Set expiration if this is the first request
    if (count === 1) {
      await redis.expire(key, windowInSeconds);
    }
    
    // Check if rate limit is exceeded
    return count <= maxRequests;
  } catch (error: any) {
    console.error('Rate limit error:', error);
    // Allow the request if rate limiting fails
    return true;
  }
}

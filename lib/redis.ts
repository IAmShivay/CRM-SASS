import { createClient } from 'redis';

// Redis client configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis client
let redisClient: ReturnType<typeof createClient> | null = null;

// Initialize Redis client
export const initRedis = async () => {
  try {
    if (!redisClient) {
      redisClient = createClient({
        url: redisUrl,
      });

      redisClient.on('error', (err:any) => {
        console.error('Redis client error:', err);
      });

      await redisClient.connect();
      console.log('Redis client connected');
    }
    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    return null;
  }
};

// Get data from cache
export const getFromCache = async <T>(key: string): Promise<T | null> => {
  try {
    const client = await initRedis();
    if (!client) return null;

    const data = await client.get(key);
    return data ? JSON.parse(data) as T : null;
  } catch (error) {
    console.error('Error getting data from Redis cache:', error);
    return null;
  }
};

// Set data in cache with expiration
export const setInCache = async <T>(
  key: string,
  data: T,
  expirationInSeconds: number = 3600 // Default: 1 hour
): Promise<boolean> => {
  try {
    const client = await initRedis();
    if (!client) return false;

    await client.set(key, JSON.stringify(data), {
      EX: expirationInSeconds,
    });
    return true;
  } catch (error) {
    console.error('Error setting data in Redis cache:', error);
    return false;
  }
};

// Delete data from cache
export const deleteFromCache = async (key: string): Promise<boolean> => {
  try {
    const client = await initRedis();
    if (!client) return false;

    await client.del(key);
    return true;
  } catch (error) {
    console.error('Error deleting data from Redis cache:', error);
    return false;
  }
};

// Clear cache with pattern
export const clearCachePattern = async (pattern: string): Promise<boolean> => {
  try {
    const client = await initRedis();
    if (!client) return false;

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Error clearing cache pattern:', error);
    return false;
  }
};

// Close Redis connection
export const closeRedisConnection = async (): Promise<boolean> => {
  try {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
      console.log('Redis connection closed');
    }
    return true;
  } catch (error) {
    console.error('Error closing Redis connection:', error);
    return false;
  }
};

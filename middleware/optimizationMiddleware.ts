import { NextResponse, NextRequest } from 'next/server';
import { getFromCache, setInCache } from '../lib/redis';

// Cache TTL in seconds for different types of data
const CACHE_TTL = {
  STATIC: 86400, // 24 hours
  DYNAMIC: 300,  // 5 minutes
  USER: 600      // 10 minutes
};

// Paths that should be cached
const CACHEABLE_PATHS = [
  '/api/forms',
  '/api/lead-sources',
  '/api/marketing/campaigns',
  '/api/marketing/templates'
];

// Check if a request is cacheable
const isCacheable = (req: NextRequest): boolean => {
  const url = new URL(req.url);
  const method = req.method;
  
  // Only cache GET requests
  if (method !== 'GET') return false;
  
  // Check if path is in cacheable paths
  return CACHEABLE_PATHS.some(path => url.pathname.startsWith(path));
};

// Generate a cache key based on the request
const generateCacheKey = (req: NextRequest): string => {
  const url = new URL(req.url);
  const path = url.pathname;
  const searchParams = url.searchParams.toString();
  
  return `api:${path}${searchParams ? `?${searchParams}` : ''}`;
};

// Middleware function to handle caching
export async function optimizationMiddleware(req: NextRequest) {
  // Skip non-cacheable requests
  if (!isCacheable(req)) {
    return NextResponse.next();
  }
  
  const cacheKey = generateCacheKey(req);
  
  // Try to get from cache
  const cachedData = await getFromCache<any>(cacheKey);
  
  if (cachedData) {
    // Return cached response
    const response = NextResponse.json(cachedData);
    response.headers.set('X-Cache', 'HIT');
    return response;
  }
  
  // No cache hit, continue to API handler
  const response = NextResponse.next();
  
  // Add a header to indicate this request should be cached
  response.headers.set('X-Should-Cache', cacheKey);
  response.headers.set('X-Cache', 'MISS');
  
  return response;
}

// Function to cache the response after API handler
export async function cacheResponse(response: NextResponse, req: NextRequest) {
  const shouldCache = response.headers.get('X-Should-Cache');
  
  if (shouldCache && response.status === 200) {
    try {
      const data = await response.json();
      
      // Determine TTL based on path
      const url = new URL(req.url);
      const path = url.pathname;
      
      let ttl = CACHE_TTL.DYNAMIC;
      if (path.includes('/user/')) {
        ttl = CACHE_TTL.USER;
      } else if (path.includes('/static/')) {
        ttl = CACHE_TTL.STATIC;
      }
      
      // Cache the response
      await setInCache(shouldCache, data, ttl);
      
      // Return a new response with the data
      return NextResponse.json(data);
    } catch (error) {
      console.error('Error caching response:', error);
    }
  }
  
  return response;
}

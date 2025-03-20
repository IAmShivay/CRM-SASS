import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";
import { getFromCache, setInCache } from './lib/redis';
import { closeRealtimeSubscriptions } from './lib/supabaseServer';

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

export async function middleware(req: NextRequest) {
  // Initialize response
  const res = NextResponse.next();
  
  // Try to get from cache for API routes
  if (isCacheable(req)) {
    const cacheKey = generateCacheKey(req);
    const cachedData = await getFromCache<any>(cacheKey);
    
    if (cachedData) {
      // Return cached response
      const cachedResponse = NextResponse.json(cachedData);
      cachedResponse.headers.set('X-Cache', 'HIT');
      return cachedResponse;
    }
    
    // Mark for caching after processing
    res.headers.set('X-Should-Cache', cacheKey);
  }

  // Create Supabase client
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthRoute = ["/login", "/signup"].includes(req.nextUrl.pathname);
  const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard");

  // If user is already logged in and on an auth route, redirect to dashboard
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // If user is not logged in and trying to access a protected route, redirect to login
  if (!session && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // For API responses that should be cached
  const shouldCache = res.headers.get('X-Should-Cache');
  if (shouldCache && res.status === 200) {
    try {
      // Clone the response to read the body
      const clonedRes = res.clone();
      const data = await clonedRes.json();
      
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
    } catch (error) {
      console.error('Error caching response:', error);
    }
  }

  // Clean up any realtime subscriptions to prevent memory leaks
  if (req.nextUrl.pathname.startsWith('/api/')) {
    closeRealtimeSubscriptions();
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*", // Protect dashboard and its subroutes
    "/profile/:path*", // Protect profile routes
    "/settings/:path*", // Protect settings
    "/api/:path*",      // Apply optimization to API routes
  ],
};

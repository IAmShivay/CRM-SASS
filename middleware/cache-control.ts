import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/redis';

// Cache control middleware
export async function cacheControlMiddleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const response = NextResponse.next();

  // Apply different caching strategies based on path
  if (path.startsWith('/_next/static') || path.startsWith('/static')) {
    // Static assets - cache for a long time
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (path.startsWith('/api/')) {
    // API routes - no caching by default
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    
    // Apply rate limiting for API routes
    const ip = req.ip || 'unknown';
    const identifier = `${ip}:${path}`;
    
    const isAllowed = await rateLimit(identifier, 100, 60); // 100 requests per minute
    
    if (!isAllowed) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      });
    }
  } else {
    // Regular pages - moderate caching
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  }

  return response;
}

import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cacheControlMiddleware } from "./middleware/cache-control";

export async function middleware(req: NextRequest) {
  // Apply cache control and rate limiting
  const cacheResponse = await cacheControlMiddleware(req);
  if (cacheResponse.status === 429) {
    return cacheResponse;
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  await supabase.auth.getSession();

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

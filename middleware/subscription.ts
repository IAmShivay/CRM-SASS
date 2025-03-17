import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { SUBSCRIPTION_PLANS, PlanTier } from '@/lib/types/subscription';

// Routes that require specific subscription plans
const PROTECTED_ROUTES = {
  // Routes that require Professional or higher plan
  professionalRoutes: [
    '/dashboard/ai',
    '/dashboard/email-marketing',
    '/dashboard/call-center',
    '/dashboard/sms-marketing',
  ],
  // Routes that require Enterprise plan
  enterpriseRoutes: [
    '/dashboard/advanced-analytics',
    '/dashboard/custom-integrations',
  ]
};

export async function middleware(request: NextRequest) {
  // Create a Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Get the current user and check if they're logged in
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // If not logged in and trying to access a protected route, redirect to login
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Get the user's subscription plan from user_metadata
  const userPlan = session.user.user_metadata?.subscription?.planId as PlanTier || 'starter';
  
  // Check if the user has the required subscription for the route
  const path = request.nextUrl.pathname;
  
  // Check for professional routes
  if (PROTECTED_ROUTES.professionalRoutes.some(route => path.startsWith(route))) {
    if (userPlan === 'starter') {
      // Redirect to subscription page if trying to access a professional feature with starter plan
      return NextResponse.redirect(new URL('/dashboard/subscription', request.url));
    }
  }
  
  // Check for enterprise routes
  if (PROTECTED_ROUTES.enterpriseRoutes.some(route => path.startsWith(route))) {
    if (userPlan === 'starter' || userPlan === 'professional') {
      // Redirect to subscription page if trying to access an enterprise feature without enterprise plan
      return NextResponse.redirect(new URL('/dashboard/subscription', request.url));
    }
  }
  
  // Check workspace limit
  if (path.includes('/dashboard/workspaces/create')) {
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id')
      .eq('user_id', session.user.id);
      
    const workspaceCount = workspaces?.length || 0;
    const workspaceLimit = SUBSCRIPTION_PLANS[userPlan].workspaceLimit;
    
    if (workspaceCount >= workspaceLimit) {
      // Redirect to subscription page if the user has reached their workspace limit
      return NextResponse.redirect(new URL('/dashboard/subscription?reason=workspace_limit', request.url));
    }
  }

  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
  ],
};

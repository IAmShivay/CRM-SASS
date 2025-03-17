import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { PlanTier, SUBSCRIPTION_PLANS } from '@/lib/types/subscription';
import Stripe from 'stripe';
import { recordPayment } from '@/lib/services/database/subscription';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    const { planId, customerId, successUrl, cancelUrl } = await req.json();
    
    // Validate the plan
    if (!Object.keys(SUBSCRIPTION_PLANS).includes(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }
    
    // Get the authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the plan details
    const plan = SUBSCRIPTION_PLANS[planId as PlanTier];
    
    // Create or retrieve the Stripe customer
    let stripeCustomerId = customerId;
    
    if (!stripeCustomerId) {
      // Check if user already has a Stripe customer ID in metadata
      const stripeId = session.user.user_metadata?.stripe_customer_id;
      
      if (stripeId) {
        stripeCustomerId = stripeId;
      } else {
        // Create a new Stripe customer
        const customer = await stripe.customers.create({
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email,
          metadata: {
            supabaseUserId: session.user.id,
          },
        });
        
        stripeCustomerId = customer.id;
        
        // Save the Stripe customer ID to the user's metadata
        await supabase.auth.updateUser({
          data: {
            stripe_customer_id: customer.id,
          },
        });
      }
    }
    
    // Create the checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.name} Plan`,
              description: `Subscription to SCRAFT CRM ${plan.name} Plan`,
            },
            unit_amount: plan.price * 100, // Convert to cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription/cancel`,
      metadata: {
        userId: session.user.id,
        planId,
      },
    });
    
    // Record the pending payment in our database
    await recordPayment(
      session.user.id,
      'stripe',
      plan.price,
      'usd',
      'pending',
      undefined,
      undefined,
      checkoutSession.id,
      {
        planId,
        checkoutSessionId: checkoutSession.id
      }
    );
    
    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred creating the checkout session' },
      { status: 500 }
    );
  }
}

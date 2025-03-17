import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { PlanTier, SUBSCRIPTION_PLANS } from '@/lib/types/subscription';

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
    
    // Initialize PayPal client
    const base = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
    
    // Get access token
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    const tokenResponse = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    });
    
    const { access_token } = await tokenResponse.json();
    
    if (!access_token) {
      throw new Error('Failed to get PayPal access token');
    }
    
    // Create order
    const orderResponse = await fetch(`${base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: plan.price.toString(),
            },
            description: `SCRAFT CRM ${plan.name} Plan Subscription`,
          },
        ],
        application_context: {
          brand_name: 'SCRAFT CRM',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription/success`,
          cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription/cancel`,
        },
      }),
    });
    
    const order = await orderResponse.json();
    
    if (order.error) {
      throw new Error(order.error.message);
    }
    
    // Find the approval URL
    const approvalUrl = order.links.find((link: any) => link.rel === 'approve').href;
    
    // Save order information to user metadata
    await supabase.auth.updateUser({
      data: {
        paypal_order: {
          id: order.id,
          planId,
          status: order.status,
          created_at: new Date().toISOString(),
        },
      },
    });
    
    return NextResponse.json({
      orderID: order.id,
      approvalUrl,
    });
  } catch (error: any) {
    console.error('PayPal order creation error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred creating the PayPal order' },
      { status: 500 }
    );
  }
}

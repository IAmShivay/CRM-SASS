import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { PlanTier, SUBSCRIPTION_PLANS } from '@/lib/types/subscription';
import crypto from 'crypto';

// Initialize Razorpay
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

export async function POST(req: Request) {
  try {
    const { planId, customerId, customerName, customerEmail } = await req.json();
    
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
    
    // Create a Razorpay order
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: plan.price * 100, // Amount in smallest currency unit (paise for INR)
        currency: 'INR',
        receipt: `order_rcptid_${Date.now()}`,
        notes: {
          planId,
          userId: session.user.id,
        },
      }),
    });
    
    const order = await response.json();
    
    if (order.error) {
      throw new Error(order.error.description);
    }
    
    // Save order information to user metadata
    await supabase.auth.updateUser({
      data: {
        razorpay_order: {
          id: order.id,
          planId,
          status: order.status,
          created_at: new Date().toISOString(),
        },
      },
    });
    
    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
    });
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred creating the Razorpay order' },
      { status: 500 }
    );
  }
}

// Verify Razorpay payment
export async function PUT(req: Request) {
  try {
    const { orderId, paymentId, signature } = await req.json();
    
    // Get the authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the payment signature
    const generatedSignature = crypto
      .createHmac('sha256', keySecret!)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    
    if (generatedSignature !== signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }
    
    // Get the order details from user metadata
    const razorpayOrder = session.user.user_metadata?.razorpay_order;
    
    if (!razorpayOrder || razorpayOrder.id !== orderId) {
      return NextResponse.json(
        { error: 'Order not found or mismatch' },
        { status: 400 }
      );
    }
    
    // Get the plan details
    const planId = razorpayOrder.planId as PlanTier;
    const plan = SUBSCRIPTION_PLANS[planId];
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }
    
    // Calculate subscription end date (30 days from now)
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);
    
    // Update user subscription in metadata
    await supabase.auth.updateUser({
      data: {
        subscription: {
          planId,
          status: 'active',
          currentPeriodEnd: currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: false,
          paymentMethod: 'razorpay',
          paymentId,
        },
        razorpay_order: {
          ...razorpayOrder,
          status: 'paid',
          paymentId,
          signature,
          updated_at: new Date().toISOString(),
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      subscription: {
        planId,
        status: 'active',
        currentPeriodEnd: currentPeriodEnd.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Razorpay payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred verifying the payment' },
      { status: 500 }
    );
  }
}

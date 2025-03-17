import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createSubscription, recordPayment, updateSubscription, getUserSubscription } from '@/lib/services/database/subscription';
import { PlanTier } from '@/lib/types/subscription';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('x-razorpay-signature') as string;
    
    // Verify the webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
      .update(payload)
      .digest('hex');
    
    if (expectedSignature !== signature) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }
    
    const event = JSON.parse(payload);
    const eventType = event.event;
    const paymentId = event.payload.payment?.entity?.id;
    const orderId = event.payload.payment?.entity?.order_id || event.payload.order?.entity?.id;
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Handle different event types
    switch (eventType) {
      case 'payment.authorized': {
        // Payment has been authorized
        if (!orderId || !paymentId) {
          throw new Error('Missing order ID or payment ID in Razorpay webhook');
        }
        
        // Get user data from metadata
        const { data: users, error: userError } = await supabase
          .from('auth.users')
          .select('id, user_metadata')
          .eq('user_metadata->razorpay_order->id', orderId);
        
        if (userError || !users || users.length === 0) {
          throw new Error('User not found for Razorpay order');
        }
        
        const user = users[0];
        const userId = user.id;
        const orderData = user.user_metadata?.razorpay_order;
        
        if (!orderData || !orderData.planId) {
          throw new Error('Missing plan ID in order data');
        }
        
        const planId = orderData.planId as PlanTier;
        
        // Create a subscription in our database
        const subscription = await createSubscription(
          userId,
          planId,
          'razorpay',
          paymentId,
          30 // 30 days for monthly subscription
        );
        
        // Record the payment
        await recordPayment(
          userId,
          'razorpay',
          event.payload.payment.entity.amount / 100, // Convert from paise to rupees
          event.payload.payment.entity.currency,
          'completed',
          subscription.id,
          paymentId,
          orderId,
          {
            planId,
            razorpayOrderId: orderId
          }
        );
        
        // Update user metadata with subscription info
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            subscription: {
              planId,
              status: 'active',
              currentPeriodEnd: subscription.current_period_end,
              cancelAtPeriodEnd: false,
              paymentMethod: 'razorpay',
              subscriptionId: subscription.id,
            }
          }
        });
        
        break;
      }
      
      case 'payment.failed': {
        // Payment has failed
        if (!orderId || !paymentId) {
          throw new Error('Missing order ID or payment ID in Razorpay webhook');
        }
        
        // Get user data from metadata
        const { data: users, error: userError } = await supabase
          .from('auth.users')
          .select('id, user_metadata')
          .eq('user_metadata->razorpay_order->id', orderId);
        
        if (userError || !users || users.length === 0) {
          throw new Error('User not found for Razorpay order');
        }
        
        const user = users[0];
        const userId = user.id;
        
        // Record the failed payment
        await recordPayment(
          userId,
          'razorpay',
          event.payload.payment.entity.amount / 100, // Convert from paise to rupees
          event.payload.payment.entity.currency,
          'failed',
          undefined,
          paymentId,
          orderId,
          {
            error: event.payload.payment.entity.error_code,
            description: event.payload.payment.entity.error_description
          }
        );
        
        break;
      }
      
      case 'refund.processed': {
        // Refund has been processed
        const refundId = event.payload.refund.entity.id;
        const refundPaymentId = event.payload.refund.entity.payment_id;
        
        if (!refundPaymentId) {
          throw new Error('Missing payment ID in Razorpay refund webhook');
        }
        
        // Find the user with this payment ID
        const { data: users, error: userError } = await supabase
          .from('auth.users')
          .select('id, user_metadata')
          .eq('user_metadata->subscription->paymentId', refundPaymentId);
        
        if (userError || !users || users.length === 0) {
          throw new Error('User not found for Razorpay payment');
        }
        
        const user = users[0];
        const userId = user.id;
        
        // Get the subscription from our database
        const dbSubscription = await getUserSubscription(userId);
        
        if (dbSubscription) {
          // Update subscription in our database
          await updateSubscription(dbSubscription.id, {
            status: 'canceled',
          });
          
          // Record the refund
          await recordPayment(
            userId,
            'razorpay',
            event.payload.refund.entity.amount / 100, // Convert from paise to rupees
            event.payload.refund.entity.currency,
            'refunded',
            dbSubscription.id,
            refundPaymentId,
            undefined,
            {
              refundId: refundId
            }
          );
          
          // Update user metadata
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              subscription: {
                planId: 'starter', // Revert to starter plan
                status: 'canceled',
                currentPeriodEnd: new Date().toISOString(),
                cancelAtPeriodEnd: true,
                paymentMethod: 'razorpay',
                subscriptionId: dbSubscription.id,
              }
            }
          });
        }
        
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Razorpay webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

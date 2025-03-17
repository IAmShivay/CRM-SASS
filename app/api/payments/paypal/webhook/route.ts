import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createSubscription, recordPayment, updateSubscription, getUserSubscription } from '@/lib/services/database/subscription';
import { PlanTier } from '@/lib/types/subscription';

export async function POST(req: Request) {
  try {
    const event = await req.json();
    const eventType = event.event_type;
    const resource = event.resource;
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify webhook signature
    const webhookId = req.headers.get('paypal-auth-algo');
    const transmissionId = req.headers.get('paypal-transmission-id');
    const certUrl = req.headers.get('paypal-cert-url');
    const transmissionSig = req.headers.get('paypal-transmission-sig');
    const transmissionTime = req.headers.get('paypal-transmission-time');
    
    // In a production environment, you should verify the webhook signature
    // using PayPal's verification process
    
    // Handle different event types
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        // Payment has been captured successfully
        const orderId = resource.supplementary_data?.related_ids?.order_id;
        const paymentId = resource.id;
        
        if (!orderId) {
          throw new Error('Missing order ID in PayPal webhook');
        }
        
        // Get user data from metadata
        const { data: users, error: userError } = await supabase
          .from('auth.users')
          .select('id, user_metadata')
          .eq('user_metadata->paypal_order->id', orderId);
        
        if (userError || !users || users.length === 0) {
          throw new Error('User not found for PayPal order');
        }
        
        const user = users[0];
        const userId = user.id;
        const orderData = user.user_metadata?.paypal_order;
        
        if (!orderData || !orderData.planId) {
          throw new Error('Missing plan ID in order data');
        }
        
        const planId = orderData.planId as PlanTier;
        
        // Create a subscription in our database
        const subscription = await createSubscription(
          userId,
          planId,
          'paypal',
          paymentId,
          30 // 30 days for monthly subscription
        );
        
        // Record the payment
        await recordPayment(
          userId,
          'paypal',
          resource.amount?.value || 0,
          resource.amount?.currency_code || 'USD',
          'completed',
          subscription.id,
          paymentId,
          orderId,
          {
            planId,
            paypalOrderId: orderId
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
              paymentMethod: 'paypal',
              subscriptionId: subscription.id,
            }
          }
        });
        
        break;
      }
      
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REFUNDED': {
        // Payment has been denied or refunded
        const orderId = resource.supplementary_data?.related_ids?.order_id;
        const paymentId = resource.id;
        
        if (!orderId) {
          throw new Error('Missing order ID in PayPal webhook');
        }
        
        // Get user data from metadata
        const { data: users, error: userError } = await supabase
          .from('auth.users')
          .select('id, user_metadata')
          .eq('user_metadata->paypal_order->id', orderId);
        
        if (userError || !users || users.length === 0) {
          throw new Error('User not found for PayPal order');
        }
        
        const user = users[0];
        const userId = user.id;
        
        // Get the subscription from our database
        const dbSubscription = await getUserSubscription(userId);
        
        if (dbSubscription && dbSubscription.payment_id === paymentId) {
          // Update subscription in our database
          await updateSubscription(dbSubscription.id, {
            status: 'canceled',
          });
          
          // Record the payment status
          await recordPayment(
            userId,
            'paypal',
            resource.amount?.value || 0,
            resource.amount?.currency_code || 'USD',
            eventType === 'PAYMENT.CAPTURE.DENIED' ? 'failed' : 'refunded',
            dbSubscription.id,
            paymentId,
            orderId
          );
          
          // Update user metadata
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              subscription: {
                planId: 'starter', // Revert to starter plan
                status: 'canceled',
                currentPeriodEnd: new Date().toISOString(),
                cancelAtPeriodEnd: true,
                paymentMethod: 'paypal',
                subscriptionId: dbSubscription.id,
              }
            }
          });
        }
        
        break;
      }
      
      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        // Subscription has been cancelled or expired
        const subscriptionId = resource.id;
        
        // Get user data from metadata
        const { data: users, error: userError } = await supabase
          .from('auth.users')
          .select('id, user_metadata')
          .eq('user_metadata->subscription->paymentId', subscriptionId);
        
        if (userError || !users || users.length === 0) {
          throw new Error('User not found for PayPal subscription');
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
          
          // Update user metadata
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              subscription: {
                planId: 'starter', // Revert to starter plan
                status: 'canceled',
                currentPeriodEnd: new Date().toISOString(),
                cancelAtPeriodEnd: true,
                paymentMethod: 'paypal',
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
    console.error('Error processing PayPal webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

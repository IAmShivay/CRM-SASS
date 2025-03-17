import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { createSubscription, recordPayment, updateSubscription, getUserSubscription } from '@/lib/services/database/subscription';
import { PlanTier } from '@/lib/types/subscription';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Get user ID and plan ID from metadata
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId as PlanTier;
        
        if (!userId || !planId) {
          throw new Error('Missing user ID or plan ID in session metadata');
        }
        
        // Create a subscription in our database
        const subscription = await createSubscription(
          userId,
          planId,
          'stripe',
          session.subscription as string,
          30 // 30 days for monthly subscription
        );
        
        // Update payment record to completed
        await recordPayment(
          userId,
          'stripe',
          session.amount_total ? session.amount_total / 100 : 0, // Convert from cents
          session.currency || 'usd',
          'completed',
          subscription.id,
          session.subscription as string,
          session.id,
          {
            planId,
            checkoutSessionId: session.id
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
              paymentMethod: 'stripe',
              subscriptionId: subscription.id,
            }
          }
        });
        
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        
        // Get the subscription from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = stripeSubscription.metadata.userId;
        
        if (!userId) {
          throw new Error('Missing user ID in subscription metadata');
        }
        
        // Get the subscription from our database
        const dbSubscription = await getUserSubscription(userId);
        
        if (dbSubscription) {
          // Calculate new period end date
          const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000).toISOString();
          
          // Update subscription in our database
          await updateSubscription(dbSubscription.id, {
            current_period_end: currentPeriodEnd,
            status: 'active',
          });
          
          // Record the payment
          await recordPayment(
            userId,
            'stripe',
            invoice.amount_paid / 100, // Convert from cents
            invoice.currency,
            'completed',
            dbSubscription.id,
            subscriptionId,
            invoice.id
          );
          
          // Update user metadata
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              subscription: {
                planId: dbSubscription.plan_id,
                status: 'active',
                currentPeriodEnd,
                cancelAtPeriodEnd: dbSubscription.cancel_at_period_end,
                paymentMethod: 'stripe',
                subscriptionId: dbSubscription.id,
              }
            }
          });
        }
        
        break;
      }
      
      case 'customer.subscription.updated': {
        const stripeSubscription = event.data.object as Stripe.Subscription;
        const userId = stripeSubscription.metadata.userId;
        
        if (!userId) {
          throw new Error('Missing user ID in subscription metadata');
        }
        
        // Get the subscription from our database
        const dbSubscription = await getUserSubscription(userId);
        
        if (dbSubscription) {
          // Update subscription in our database
          await updateSubscription(dbSubscription.id, {
            cancel_at_period_end: stripeSubscription.cancel_at_period_end,
            status: stripeSubscription.status,
          });
          
          // Update user metadata
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              subscription: {
                planId: dbSubscription.plan_id,
                status: stripeSubscription.status,
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
                cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
                paymentMethod: 'stripe',
                subscriptionId: dbSubscription.id,
              }
            }
          });
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const stripeSubscription = event.data.object as Stripe.Subscription;
        const userId = stripeSubscription.metadata.userId;
        
        if (!userId) {
          throw new Error('Missing user ID in subscription metadata');
        }
        
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
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
                cancelAtPeriodEnd: true,
                paymentMethod: 'stripe',
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
    console.error('Error processing Stripe webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

import { loadStripe } from '@stripe/stripe-js';
import { PlanTier } from '@/lib/types/subscription';

// Initialize Stripe with your publishable key
// In production, this should be loaded from environment variables
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export interface StripeCheckoutOptions {
  planId: PlanTier;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
}

export const createStripeCheckoutSession = async (options: StripeCheckoutOptions) => {
  try {
    const { planId, customerId, successUrl, cancelUrl } = options;
    
    // Call your backend API to create a checkout session
    const response = await fetch('/api/payments/stripe/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        customerId,
        successUrl,
        cancelUrl,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionId } = await response.json();
    
    // Redirect to Stripe Checkout
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }
    
    const { error } = await stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw error;
  }
};

export const handleStripeSubscriptionUpdate = async (subscriptionId: string) => {
  try {
    const response = await fetch(`/api/payments/stripe/subscription/${subscriptionId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch subscription details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

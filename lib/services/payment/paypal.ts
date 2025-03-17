import { PlanTier } from '@/lib/types/subscription';

export interface PayPalCheckoutOptions {
  planId: PlanTier;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
}

export const createPayPalCheckoutSession = async (options: PayPalCheckoutOptions) => {
  try {
    const { planId, customerId, successUrl, cancelUrl } = options;
    
    // Call your backend API to create a PayPal order
    const response = await fetch('/api/payments/paypal/create-order', {
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
      throw new Error('Failed to create PayPal order');
    }

    const { orderID, approvalUrl } = await response.json();
    
    // Redirect to PayPal approval URL
    window.location.href = approvalUrl;
    
    return { orderID };
  } catch (error) {
    console.error('PayPal checkout error:', error);
    throw error;
  }
};

export const capturePayPalOrder = async (orderID: string) => {
  try {
    const response = await fetch(`/api/payments/paypal/capture-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderID }),
    });

    if (!response.ok) {
      throw new Error('Failed to capture PayPal order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    throw error;
  }
};

export const handlePayPalSubscriptionUpdate = async (subscriptionId: string) => {
  try {
    const response = await fetch(`/api/payments/paypal/subscription/${subscriptionId}`, {
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

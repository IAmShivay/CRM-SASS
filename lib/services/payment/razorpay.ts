import { PlanTier } from '@/lib/types/subscription';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayCheckoutOptions {
  planId: PlanTier;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  successCallback: (paymentId: string, orderId: string, signature: string) => void;
  failureCallback: (error: any) => void;
}

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const createRazorpayCheckoutSession = async (options: RazorpayCheckoutOptions) => {
  try {
    const { planId, customerId, customerName, customerEmail, successCallback, failureCallback } = options;
    
    // Load the Razorpay script if not already loaded
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      throw new Error('Failed to load Razorpay SDK');
    }
    
    // Call your backend API to create a Razorpay order
    const response = await fetch('/api/payments/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        customerId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create Razorpay order');
    }

    const { order } = await response.json();
    
    // Initialize Razorpay checkout
    const razorpay = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      name: 'SCRAFT CRM',
      description: `Subscription to ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
      image: '/logo.svg',
      prefill: {
        name: customerName,
        email: customerEmail,
      },
      theme: {
        color: '#3399cc',
      },
      handler: function(response: any) {
        successCallback(
          response.razorpay_payment_id,
          response.razorpay_order_id,
          response.razorpay_signature
        );
      },
    });
    
    razorpay.on('payment.failed', function(response: any) {
      failureCallback(response.error);
    });
    
    razorpay.open();
    
    return { orderId: order.id };
  } catch (error) {
    console.error('Razorpay checkout error:', error);
    throw error;
  }
};

export const verifyRazorpayPayment = async (
  paymentId: string, 
  orderId: string, 
  signature: string
) => {
  try {
    const response = await fetch('/api/payments/razorpay/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentId,
        orderId,
        signature,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify payment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

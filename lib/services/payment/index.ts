import { createStripeCheckoutSession } from './stripe';
import { createPayPalCheckoutSession } from './paypal';
import { createRazorpayCheckoutSession } from './razorpay';
import { PlanTier } from '@/lib/types/subscription';

export type PaymentGateway = 'stripe' | 'paypal' | 'razorpay';

export interface PaymentCheckoutOptions {
  gateway: PaymentGateway;
  planId: PlanTier;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  onSuccess?: (data: any) => void;
  onFailure?: (error: any) => void;
}

export const initiatePaymentCheckout = async (options: PaymentCheckoutOptions) => {
  const {
    gateway,
    planId,
    customerId,
    customerName,
    customerEmail,
    successUrl = `${window.location.origin}/dashboard/subscription/success`,
    cancelUrl = `${window.location.origin}/dashboard/subscription/cancel`,
    onSuccess,
    onFailure
  } = options;

  try {
    switch (gateway) {
      case 'stripe':
        return await createStripeCheckoutSession({
          planId,
          customerId,
          successUrl,
          cancelUrl
        });
      
      case 'paypal':
        return await createPayPalCheckoutSession({
          planId,
          customerId,
          successUrl,
          cancelUrl
        });
      
      case 'razorpay':
        if (!customerName || !customerEmail) {
          throw new Error('Customer name and email are required for Razorpay');
        }
        
        return await createRazorpayCheckoutSession({
          planId,
          customerId,
          customerName,
          customerEmail,
          successCallback: (paymentId, orderId, signature) => {
            if (onSuccess) {
              onSuccess({ paymentId, orderId, signature });
            }
          },
          failureCallback: (error) => {
            if (onFailure) {
              onFailure(error);
            }
          }
        });
      
      default:
        throw new Error(`Unsupported payment gateway: ${gateway}`);
    }
  } catch (error) {
    console.error(`Payment checkout error (${gateway}):`, error);
    if (onFailure) {
      onFailure(error);
    }
    throw error;
  }
};

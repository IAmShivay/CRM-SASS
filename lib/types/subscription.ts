// Subscription plan types
export type PlanTier = 'starter' | 'professional' | 'enterprise';

export interface SubscriptionPlan {
  id: PlanTier;
  name: string;
  price: number; // Monthly price in USD
  features: string[];
  workspaceLimit: number;
  aiIntegration: boolean;
  emailMarketing: boolean;
  callChannel: boolean;
  smsMarketing: boolean;
  leadLimit: 'unlimited' | number;
}

export interface UserSubscription {
  planId: PlanTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: string; // ISO date string
  cancelAtPeriodEnd: boolean;
  paymentMethod?: 'stripe' | 'paypal' | 'razorpay';
  paymentId?: string;
  subscriptionId?: string; // Database subscription ID
}

// Define the subscription plans
export const SUBSCRIPTION_PLANS: Record<PlanTier, SubscriptionPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 0,
    features: [
      'Unlimited leads',
      'Basic CRM features',
      'Contact management',
      'Lead tracking'
    ],
    workspaceLimit: 3,
    aiIntegration: false,
    emailMarketing: false,
    callChannel: false,
    smsMarketing: false,
    leadLimit: 'unlimited'
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 49,
    features: [
      'Unlimited leads',
      'Unlimited workspaces',
      'AI integration',
      'Email marketing',
      'Call channel',
      'SMS marketing',
      'Advanced analytics'
    ],
    workspaceLimit: Infinity,
    aiIntegration: true,
    emailMarketing: true,
    callChannel: true,
    smsMarketing: true,
    leadLimit: 'unlimited'
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    features: [
      'All Professional features',
      'Priority support',
      'Custom integrations',
      'Advanced security',
      'Dedicated account manager'
    ],
    workspaceLimit: Infinity,
    aiIntegration: true,
    emailMarketing: true,
    callChannel: true,
    smsMarketing: true,
    leadLimit: 'unlimited'
  }
};

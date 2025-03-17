import { createClient } from '@supabase/supabase-js';
import { PlanTier, UserSubscription } from '@/lib/types/subscription';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Define types for database records
export interface SubscriptionRecord {
  id: string;
  user_id: string;
  plan_id: PlanTier;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  payment_method: 'stripe' | 'paypal' | 'razorpay';
  payment_id: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistoryRecord {
  id: string;
  user_id: string;
  subscription_id?: string;
  payment_provider: 'stripe' | 'paypal' | 'razorpay';
  payment_id?: string;
  order_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  metadata?: any;
  created_at: string;
  updated_at: string;
}

// Create a new subscription
export const createSubscription = async (
  userId: string,
  planId: PlanTier,
  paymentMethod: 'stripe' | 'paypal' | 'razorpay',
  paymentId?: string,
  periodInDays: number = 30
): Promise<SubscriptionRecord> => {
  // Calculate period end date
  const now = new Date();
  const currentPeriodEnd = new Date(now);
  currentPeriodEnd.setDate(currentPeriodEnd.getDate() + periodInDays);

  // Insert the subscription record
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_id: planId,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      cancel_at_period_end: false,
      payment_method: paymentMethod,
      payment_id: paymentId || '',
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Error creating subscription: ${error.message}`);
  }

  return data as SubscriptionRecord;
};

// Get a user's current subscription
export const getUserSubscription = async (userId: string): Promise<SubscriptionRecord | null> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is the error code for "no rows returned"
    throw error;
  }

  return data as SubscriptionRecord | null;
};

// Update a subscription
export const updateSubscription = async (
  subscriptionId: string,
  updates: Partial<SubscriptionRecord>
): Promise<SubscriptionRecord> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', subscriptionId)
    .select('*')
    .single();

  if (error) throw error;
  return data as SubscriptionRecord;
};

// Cancel a subscription
export const cancelSubscription = async (
  subscriptionId: string,
  cancelImmediately: boolean = false
): Promise<SubscriptionRecord> => {
  const updates: Partial<SubscriptionRecord> = {
    cancel_at_period_end: !cancelImmediately,
  };

  if (cancelImmediately) {
    updates.status = 'canceled';
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', subscriptionId)
    .select('*')
    .single();

  if (error) throw error;
  return data as SubscriptionRecord;
};

// Record a payment in the payment history
export const recordPayment = async (
  userId: string,
  paymentProvider: 'stripe' | 'paypal' | 'razorpay',
  amount: number,
  currency: string,
  status: 'pending' | 'completed' | 'failed' | 'refunded',
  subscriptionId?: string,
  paymentId?: string,
  orderId?: string,
  metadata?: any
): Promise<PaymentHistoryRecord> => {
  const { data, error } = await supabase
    .from('payment_history')
    .insert({
      user_id: userId,
      subscription_id: subscriptionId,
      payment_provider: paymentProvider,
      payment_id: paymentId,
      order_id: orderId,
      amount,
      currency,
      status,
      metadata,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as PaymentHistoryRecord;
};

// Get a user's payment history
export const getUserPaymentHistory = async (userId: string): Promise<PaymentHistoryRecord[]> => {
  const { data, error } = await supabase
    .from('payment_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as PaymentHistoryRecord[];
};

// Convert a database subscription record to the UserSubscription format used in the app
export const convertToUserSubscription = (record: SubscriptionRecord): UserSubscription => {
  return {
    planId: record.plan_id,
    status: record.status as 'active' | 'canceled' | 'past_due' | 'trialing',
    currentPeriodEnd: record.current_period_end,
    cancelAtPeriodEnd: record.cancel_at_period_end,
    paymentMethod: record.payment_method,
    paymentId: record.payment_id,
    subscriptionId: record.id,
  };
};

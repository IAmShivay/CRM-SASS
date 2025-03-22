"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { SUBSCRIPTION_PLANS, PlanTier, UserSubscription } from "@/lib/types/subscription";
import { format, addDays } from "date-fns";

// Add dynamic export to prevent static generation
export const dynamic = 'force-dynamic';

// Create a wrapper component that uses useSearchParams
function SubscriptionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        setLoading(true);
        
        // Get the session ID or plan from the URL
        const sessionId = searchParams?.get("session_id") || null;
        const planId = searchParams?.get("plan") as PlanTier | null;
        const cycle = searchParams?.get("cycle") as "monthly" | "yearly" | null;
        
        if (!sessionId && !planId) {
          // If no session ID or plan, redirect to subscription page
          router.push("/dashboard/subscription");
          return;
        }
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login");
          return;
        }
        
        if (sessionId) {
          // For Stripe, verify the session
          const response = await fetch("/api/payments/stripe/verify-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionId }),
          });
          
          const data = await response.json();
          
          if (data.error) {
            throw new Error(data.error);
          }
          
          // Update user subscription in Supabase
          const { error } = await supabase.auth.updateUser({
            data: {
              subscription: {
                planId: data.planId,
                status: "active",
                currentPeriodEnd: data.currentPeriodEnd,
                cancelAtPeriodEnd: false,
                paymentMethod: "stripe",
              },
            },
          });
          
          if (error) throw error;
          
          setSubscription({
            planId: data.planId,
            status: "active",
            currentPeriodEnd: data.currentPeriodEnd,
            cancelAtPeriodEnd: false,
            paymentMethod: "stripe",
          });
        } else if (planId) {
          // For PayPal or direct updates, create a subscription based on the plan
          const currentPeriodEnd = format(
            addDays(new Date(), cycle === "yearly" ? 365 : 30),
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          );
          
          // Get payment method with type safety
          const paymentMethod = searchParams?.get("payment_method") || "unknown";
          const safePaymentMethod = (
            paymentMethod === "stripe" || 
            paymentMethod === "paypal" || 
            paymentMethod === "razorpay"
          ) ? paymentMethod : undefined;
          
          // Update user subscription in Supabase
          const { error } = await supabase.auth.updateUser({
            data: {
              subscription: {
                planId,
                status: "active",
                currentPeriodEnd,
                cancelAtPeriodEnd: false,
                paymentMethod: safePaymentMethod,
              },
            },
          });
          
          if (error) throw error;
          
          setSubscription({
            planId,
            status: "active",
            currentPeriodEnd,
            cancelAtPeriodEnd: false,
            paymentMethod: safePaymentMethod,
          });
        }
      } catch (error) {
        console.error("Error verifying subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [router, searchParams, supabase]);

  return (
    <div className="container max-w-md py-12">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Subscription Successful!</CardTitle>
          <CardDescription>
            {subscription ? (
              <>
                You are now subscribed to the{" "}
                <span className="font-semibold">
                  {subscription.planId && SUBSCRIPTION_PLANS[subscription.planId]
                    ? SUBSCRIPTION_PLANS[subscription.planId].name
                    : "Selected"}{" "}
                  Plan
                </span>
              </>
            ) : loading ? (
              "Verifying your subscription..."
            ) : (
              "Your subscription has been processed"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Thank you for your subscription. You now have access to all the features included in your
            plan.
          </p>
          {subscription && (
            <p className="text-sm text-muted-foreground">
              Your subscription will renew on{" "}
              {subscription.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                : "the next billing cycle"}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button className="w-full" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/dashboard/subscription/manage")}
          >
            Manage Subscription
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Export the main component with Suspense
export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<div className="container max-w-md py-12">Loading...</div>}>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}

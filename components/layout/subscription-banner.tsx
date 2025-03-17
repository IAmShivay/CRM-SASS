"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ChevronRight, AlertCircle } from "lucide-react";
import { UserSubscription, SUBSCRIPTION_PLANS } from "@/lib/types/subscription";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SubscriptionBanner() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const userSubscription = user.user_metadata?.subscription as UserSubscription;
          setSubscription(userSubscription || null);
          
          if (userSubscription?.currentPeriodEnd) {
            const endDate = new Date(userSubscription.currentPeriodEnd);
            const today = new Date();
            const diffTime = endDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysRemaining(diffDays);
          }
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [supabase]);

  if (loading || !subscription) return null;

  // Don't show banner for starter plan
  if (subscription.planId === 'starter') return null;
  
  // Don't show if subscription is not active
  if (subscription.status !== 'active') return null;

  // Determine banner color based on days remaining
  const getBannerColor = () => {
    if (daysRemaining <= 3) return "bg-destructive text-destructive-foreground";
    if (daysRemaining <= 7) return "bg-warning text-warning-foreground";
    return "bg-muted";
  };

  return (
    <div className={`w-full py-1 px-4 ${getBannerColor()}`}>
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {daysRemaining <= 7 ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
          
          <span>
            <Badge variant="outline" className="mr-2 font-normal">
              {SUBSCRIPTION_PLANS[subscription.planId].name}
            </Badge>
            {daysRemaining <= 0 
              ? "Your subscription has expired" 
              : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining in your subscription`}
          </span>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs h-7 px-2"
          onClick={() => router.push('/dashboard/subscription')}
        >
          Manage Subscription
          <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SUBSCRIPTION_PLANS, PlanTier, UserSubscription } from "@/lib/types/subscription";
import { useToast } from "@/components/ui/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";

export default function SubscriptionPlans() {
  const isCollapsed = useSelector(
    (state: RootState) => state.sidebar.isCollapsed
  );
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('professional');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        
        // If user is logged in, get their subscription info
        if (session?.user) {
          setCurrentSubscription(session.user.user_metadata?.subscription || null);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      }
    };
    
    checkAuth();
  }, [supabase]);

  // Calculate price with discount for yearly billing
  const getPrice = (basePrice: number) => {
    if (billingCycle === 'yearly') {
      // 20% discount for yearly billing
      return (basePrice * 12 * 0.8).toFixed(0);
    }
    return basePrice;
  };

  // Calculate days remaining in current subscription
  const getDaysRemaining = () => {
    if (!currentSubscription?.currentPeriodEnd) return 0;
    
    const endDate = new Date(currentSubscription.currentPeriodEnd);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      
      // Check if user is logged in
      if (!user) {
        // Redirect to login with return URL
        router.push(`/login?returnUrl=/dashboard/subscription&plan=${selectedPlan}&cycle=${billingCycle}`);
        return;
      }
      
      // If already on the selected plan, show a message
      if (currentSubscription?.planId === selectedPlan && currentSubscription?.status === 'active') {
        toast({
          title: "Already Subscribed",
          description: `You are already subscribed to the ${SUBSCRIPTION_PLANS[selectedPlan].name} plan.`,
          duration: 3000,
        });
        setLoading(false);
        return;
      }
      
      // If logged in, redirect to subscription page
      router.push(`/dashboard/subscription?plan=${selectedPlan}&cycle=${billingCycle}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`p-6 transition-all duration-500 ease-in-out w-full 
      ${isCollapsed ? "md:ml-[80px]" : "md:ml-[250px]"}
      overflow-hidden `}
    >
      <section id="pricing" className="py-16 bg-muted/50">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that works best for your business. All plans include core CRM features.
              Upgrade anytime as your business grows.
            </p>
          </div>

          {/* Current Subscription Alert */}
          {currentSubscription && currentSubscription.planId !== 'starter' && (
            <div className="mb-8 p-4 bg-muted rounded-lg shadow-sm max-w-2xl mx-auto">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-sm md:text-base mb-1">Current Subscription</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default" className="text-xs md:text-sm">
                      {SUBSCRIPTION_PLANS[currentSubscription.planId].name}
                    </Badge>
                    <span className="text-xs md:text-sm text-muted-foreground">
                      Status: {currentSubscription.status.charAt(0).toUpperCase() + currentSubscription.status.slice(1)}
                    </span>
                    <span className="text-xs md:text-sm font-medium">
                      {getDaysRemaining()} days remaining
                    </span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/dashboard/subscription/manage')}
                  className="text-xs md:text-sm"
                >
                  Manage Subscription
                </Button>
              </div>
            </div>
          )}

          {/* Billing cycle toggle */}
          <div className="flex justify-center mb-8">
            <Tabs defaultValue="monthly" value={billingCycle} onValueChange={(v) => setBillingCycle(v as 'monthly' | 'yearly')}>
              <TabsList>
                <TabsTrigger value="monthly">Monthly Billing</TabsTrigger>
                <TabsTrigger value="yearly">Yearly Billing <Badge variant="outline" className="ml-2">Save 20%</Badge></TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
              <Card 
                key={plan.id} 
                className={`flex flex-col h-full transition-all duration-300 hover:shadow-md
                  ${selectedPlan === plan.id ? 'border-primary shadow-sm' : 'opacity-90 hover:opacity-100'}`}
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {plan.id === 'starter' ? 'Free forever' : (
                          <>
                            <span className="text-xl font-bold">${getPrice(plan.price)}</span>
                            <span className="text-sm text-muted-foreground">
                              {billingCycle === 'monthly' ? '/month' : '/year'}
                            </span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                    {plan.id === 'professional' && (
                      <Badge className="bg-primary text-xs">Popular</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={selectedPlan === plan.id ? "default" : "outline"}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {selectedPlan === plan.id 
                      ? currentSubscription?.planId === plan.id 
                        ? "Current Plan" 
                        : "Selected" 
                      : "Select"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Subscribe button */}
          <div className="mt-8 flex justify-center">
            <Button 
              size="lg" 
              onClick={handleSubscribe} 
              disabled={loading || (currentSubscription?.planId === selectedPlan && currentSubscription?.status === 'active')}
            >
              {loading 
                ? "Processing..." 
                : currentSubscription?.planId === selectedPlan && currentSubscription?.status === 'active'
                  ? "Current Plan"
                  : "Get Started Now"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

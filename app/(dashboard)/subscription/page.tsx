"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, CreditCard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SUBSCRIPTION_PLANS, PlanTier, UserSubscription } from "@/lib/types/subscription";
import { initiatePaymentCheckout, PaymentGateway } from "@/lib/services/payment";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { format, addDays } from "date-fns";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";

export default function SubscriptionPage() {
  const router = useRouter();
  const isCollapsed = useSelector((state: RootState) => state.sidebar.isCollapsed);
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('professional');
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('stripe');
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [user, setUser] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Fetch current user and subscription data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          // Get subscription from user metadata
          const subscription = user.user_metadata?.subscription as UserSubscription;
          if (subscription) {
            setCurrentSubscription(subscription);
            setSelectedPlan(subscription.planId);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [supabase]);

  // Calculate days remaining in subscription
  const getDaysRemaining = () => {
    if (!currentSubscription?.currentPeriodEnd) return 0;
    
    const endDate = new Date(currentSubscription.currentPeriodEnd);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Handle subscription checkout
  const handleSubscribe = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to subscribe",
          variant: "destructive",
        });
        return;
      }
      
      // If selecting the same plan as current subscription, redirect to management
      if (currentSubscription?.planId === selectedPlan && currentSubscription?.status === 'active') {
        router.push('/dashboard/subscription/manage');
        return;
      }
      
      // For the free plan, just update the user metadata
      if (selectedPlan === 'starter') {
        await updateUserSubscription({
          planId: 'starter',
          status: 'active',
          currentPeriodEnd: format(addDays(new Date(), 365), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
          cancelAtPeriodEnd: false,
        });
        
        toast({
          title: "Subscription updated",
          description: "You are now on the Starter plan",
        });
        
        router.refresh();
        return;
      }
      
      // For paid plans, initiate payment checkout
      await initiatePaymentCheckout({
        gateway: selectedGateway,
        planId: selectedPlan,
        customerId: user.id,
        customerName: user.user_metadata?.full_name || user.email,
        customerEmail: user.email,
        successUrl: `${window.location.origin}/dashboard/subscription/success?plan=${selectedPlan}&cycle=${billingCycle}`,
        cancelUrl: `${window.location.origin}/dashboard/subscription/cancel`,
        onSuccess: async (data) => {
          // This is mainly for Razorpay which returns directly
          if (selectedGateway === 'razorpay') {
            await updateUserSubscription({
              planId: selectedPlan,
              status: 'active',
              currentPeriodEnd: format(addDays(new Date(), billingCycle === 'monthly' ? 30 : 365), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
              cancelAtPeriodEnd: false,
              paymentMethod: 'razorpay',
              paymentId: data.paymentId,
            });
            
            toast({
              title: "Subscription successful",
              description: `You are now subscribed to the ${SUBSCRIPTION_PLANS[selectedPlan].name} plan`,
            });
            
            router.refresh();
          }
        },
        onFailure: (error) => {
          toast({
            title: "Payment failed",
            description: error.message || "There was an error processing your payment",
            variant: "destructive",
          });
        }
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "There was an error processing your request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update user subscription in Supabase
  const updateUserSubscription = async (subscription: UserSubscription) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          subscription,
        },
      });

      if (error) throw error;
      
      // Update local state
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }
  };

  // Calculate price with discount for yearly billing
  const getPrice = (basePrice: number) => {
    if (billingCycle === 'yearly') {
      // 20% discount for yearly billing
      return (basePrice * 12 * 0.8).toFixed(0);
    }
    return basePrice;
  };

  return (
    <div className={`p-4 md:p-6 transition-all duration-300 ease-in-out 
      ${isCollapsed ? "md:ml-[80px]" : "md:ml-[250px]"}
      max-w-8xl mx-auto`}>
      
      {/* Header Section */}
      <div className="mb-6 md:mb-8 text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-muted-foreground">
          Select the subscription that best fits your business needs
        </p>
      </div>
      
      {/* Current Subscription Alert */}
      {currentSubscription && (
        <div className="mb-6 p-4 bg-muted rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-sm md:text-base mb-1">Current Subscription</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={currentSubscription.planId === 'starter' ? 'outline' : 'default'} className="text-xs md:text-sm">
                  {SUBSCRIPTION_PLANS[currentSubscription.planId].name}
                </Badge>
                <span className="text-xs md:text-sm text-muted-foreground">
                  Status: {currentSubscription.status.charAt(0).toUpperCase() + currentSubscription.status.slice(1)}
                </span>
                
                {currentSubscription.planId !== 'starter' && (
                  <span className="text-xs md:text-sm font-medium">
                    {getDaysRemaining()} days remaining
                  </span>
                )}
              </div>
            </div>
            
            {currentSubscription.planId !== 'starter' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/dashboard/subscription/manage')}
                className="text-xs md:text-sm"
              >
                Manage Subscription
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mb-6 md:mb-8">
        <Tabs 
          defaultValue="monthly" 
          value={billingCycle} 
          onValueChange={(v) => setBillingCycle(v as 'monthly' | 'yearly')}
          className="w-full max-w-md"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="monthly" className="text-sm">Monthly Billing</TabsTrigger>
            <TabsTrigger value="yearly" className="text-sm">
              Yearly <Badge variant="outline" className="ml-1 hidden sm:inline-flex">Save 20%</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
          <Card 
            key={plan.id} 
            className={`flex flex-col h-full transition-all duration-300 hover:shadow-md
              ${selectedPlan === plan.id ? 'border-primary shadow-sm' : 'opacity-90 hover:opacity-100'}`}
          >
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg md:text-xl">{plan.name}</CardTitle>
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
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter className="pt-2">
              <Button 
                className="w-full" 
                variant={selectedPlan === plan.id ? "default" : "outline"}
                onClick={() => setSelectedPlan(plan.id)}
                size="sm"
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

      {/* Payment Method Selection */}
      {selectedPlan !== 'starter' && (
        <div className="mt-8 max-w-md mx-auto">
          <h2 className="text-lg font-semibold mb-3 text-center">Payment Method</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Button 
              variant={selectedGateway === 'stripe' ? "default" : "outline"}
              onClick={() => setSelectedGateway('stripe')}
              className="flex items-center gap-2"
              size="sm"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.5 12.5C14.5 13.3284 13.8284 14 13 14C12.1716 14 11.5 13.3284 11.5 12.5C11.5 11.6716 12.1716 11 13 11C13.8284 11 14.5 11.6716 14.5 12.5Z" fill="currentColor"/>
                <path d="M9.5 12.5C9.5 13.3284 8.82843 14 8 14C7.17157 14 6.5 13.3284 6.5 12.5C6.5 11.6716 7.17157 11 8 11C8.82843 11 9.5 11.6716 9.5 12.5Z" fill="currentColor"/>
                <path d="M19.5 12.5C19.5 13.3284 18.8284 14 18 14C17.1716 14 16.5 13.3284 16.5 12.5C16.5 11.6716 17.1716 11 18 11C18.8284 11 19.5 11.6716 19.5 12.5Z" fill="currentColor"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z" fill="currentColor"/>
              </svg>
              Stripe
            </Button>
            
            <Button 
              variant={selectedGateway === 'paypal' ? "default" : "outline"}
              onClick={() => setSelectedGateway('paypal')}
              className="flex items-center gap-2"
              size="sm"
            >
             <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.02 5H16.4C17.8368 5 19 6.11929 19 7.5C19 7.58728 18.9952 7.67385 18.986 7.75932C18.4733 11.2206 15.4739 13 12.5 13H9.5L8 19H4L7.02 5Z" fill="currentColor"/>
                <path d="M9 7H16.4C16.9601 7 17.3333 7.40415 17.3333 7.8C17.3333 7.83517 17.3316 7.87003 17.3282 7.90449C17.0216 9.71258 15.4108 11 13.5 11H10.5L9 17H7L9 7Z" fill="currentColor"/>
              </svg>
              PayPal
            </Button>
            
            <Button 
              variant={selectedGateway === 'razorpay' ? "default" : "outline"}
              onClick={() => setSelectedGateway('razorpay')}
              className="flex items-center gap-2"
              size="sm"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 16L12 12M12 12L16 8M12 12L8 8M12 12L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Razorpay
            </Button>
          </div>
        </div>
      )}

      {/* Subscribe Button */}
      <div className="mt-8 flex justify-center">
        <Button 
          className="px-8 py-2" 
          onClick={handleSubscribe} 
          disabled={loading || (currentSubscription?.planId === selectedPlan && currentSubscription?.status === 'active')}
        >
          {loading ? "Processing..." : 
            selectedPlan === 'starter' ? "Switch to Free Plan" : 
            currentSubscription?.planId === selectedPlan ? "Manage Subscription" : 
            "Subscribe Now"}
        </Button>
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-12 md:mt-16">
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center">Feature Comparison</h2>
        <div className="overflow-x-auto rounded-lg border shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left py-3 px-4 text-sm font-medium">Feature</th>
                {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                  <th key={plan.id} className="text-center py-3 px-2 text-sm font-medium">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t hover:bg-muted/30">
                <td className="py-3 px-4 text-sm">Workspace Limit</td>
                {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                  <td key={plan.id} className="text-center py-3 px-2 text-sm">
                    {plan.workspaceLimit === Infinity ? "Unlimited" : plan.workspaceLimit}
                  </td>
                ))}
              </tr>
              <tr className="border-t hover:bg-muted/30">
                <td className="py-3 px-4 text-sm">Lead Management</td>
                {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                  <td key={plan.id} className="text-center py-3 px-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mx-auto" />
                  </td>
                ))}
              </tr>
              <tr className="border-t hover:bg-muted/30">
                <td className="py-3 px-4 text-sm">AI Integration</td>
                {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                  <td key={plan.id} className="text-center py-3 px-2 text-sm">
                    {plan.aiIntegration ? (
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-t hover:bg-muted/30">
                <td className="py-3 px-4 text-sm">Email Marketing</td>
                {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                  <td key={plan.id} className="text-center py-3 px-2 text-sm">
                    {plan.emailMarketing ? (
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-t hover:bg-muted/30">
                <td className="py-3 px-4 text-sm">Call Channel</td>
                {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                  <td key={plan.id} className="text-center py-3 px-2 text-sm">
                    {plan.callChannel ? (
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-t hover:bg-muted/30">
                <td className="py-3 px-4 text-sm">SMS Marketing</td>
                {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                  <td key={plan.id} className="text-center py-3 px-2 text-sm">
                    {plan.smsMarketing ? (
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-t hover:bg-muted/30">
                <td className="py-3 px-4 text-sm">Priority Support</td>
                {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
                  <td key={plan.id} className="text-center py-3 px-2 text-sm">
                    {plan.id === 'enterprise' ? (
                      <Check className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="mt-12 md:mt-16 max-w-3xl mx-auto">
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Can I upgrade or downgrade my plan later?</h3>
            <p className="text-sm text-muted-foreground">Yes, you can change your subscription plan at any time. When upgrading, you'll have immediate access to new features. When downgrading, changes will take effect at the end of your current billing cycle.</p>
          </div>
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">How does the billing cycle work?</h3>
            <p className="text-sm text-muted-foreground">Monthly plans are billed every 30 days from your initial subscription date. Yearly plans are billed once every 12 months, offering a 20% discount compared to monthly billing.</p>
          </div>
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Can I cancel my subscription?</h3>
            <p className="text-sm text-muted-foreground">Yes, you can cancel your subscription at any time from your account settings. Your subscription will remain active until the end of your current billing period.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
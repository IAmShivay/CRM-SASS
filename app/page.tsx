"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Users, Mail, Phone, MessageSquare, Zap } from "lucide-react";
import SubscriptionPlans from "@/components/home/subscription-plans";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [supabase]);

  // If user is logged in, redirect to dashboard
  if (isLoggedIn && !loading) {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted">
        <div className="container max-w-6xl">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 gradient-heading">
                Streamline Your Sales Process with SCRAFT CRM
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Manage leads, track sales, and grow your business with our all-in-one CRM solution.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="btn-gradient" asChild>
                  <Link href="/register">
                    Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">
                    Log In
                  </Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="rounded-lg shadow-2xl overflow-hidden border border-primary/20">
                <img 
                  src="/dashboard-preview.png" 
                  alt="SCRAFT CRM Dashboard" 
                  className="w-full h-auto"
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/800x500/e2e8f0/475569?text=SCRAFT+CRM+Dashboard";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 gradient-heading">Powerful CRM Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your sales pipeline and grow your business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="feature-card">
              <div className="feature-icon-container mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Lead Management</h3>
              <p className="text-muted-foreground">
                Capture, organize, and nurture leads through your sales pipeline with ease.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-container mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sales Analytics</h3>
              <p className="text-muted-foreground">
                Track performance metrics and gain insights to optimize your sales strategy.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-container mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Email Marketing</h3>
              <p className="text-muted-foreground">
                Create and send targeted email campaigns to engage with your prospects.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-container mb-4">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Call Center</h3>
              <p className="text-muted-foreground">
                Make and track calls directly from the CRM with detailed call logs.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-container mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">SMS Marketing</h3>
              <p className="text-muted-foreground">
                Send SMS messages to your leads and customers for immediate engagement.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-container mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Integration</h3>
              <p className="text-muted-foreground">
                Leverage AI to automate tasks and get intelligent insights about your leads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans Section */}
      <SubscriptionPlans />

      {/* Footer */}
      <footer className="py-12 bg-muted/30 border-t">
        <div className="container max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4 text-primary">SCRAFT CRM</h3>
              <p className="text-muted-foreground">
                The all-in-one CRM solution for growing businesses.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-secondary-foreground">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-secondary-foreground">Resources</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Documentation</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-secondary-foreground">Company</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Careers</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t text-center text-muted-foreground">
            <p> {new Date().getFullYear()} SCRAFT CRM. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

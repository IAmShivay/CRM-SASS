import { Button } from "@/components/ui/button";
import { ArrowRight, Play, CheckCircle } from "lucide-react";
import Link from "next/link";

export const Hero = () => {
  return (
    <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden">
      {/* Background with more dynamic elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left Content */}
          <div className="flex-1 text-left lg:pr-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              New: AI-Powered Lead Insights
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                Convert More Leads,
              </span>
              <br />
              <span className="text-foreground">Close More Deals</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Elevate your sales performance with our intelligent CRM platform that helps you track, nurture, and convert leads with less effort and greater precision.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2 font-medium shadow-lg hover:shadow-xl hover:translate-y-px transition-all">
                  Start Free 14-Day Trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 font-medium">
                <Play className="h-4 w-4 fill-current" /> Watch Demo
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 text-sm text-muted-foreground">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-primary mr-2" />
                No credit card required
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-primary mr-2" />
                Full-featured trial
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-primary mr-2" />
                Cancel anytime
              </div>
            </div>
          </div>
          
          {/* Right stats card */}
          <div className="flex-1 w-full max-w-md mt-12 lg:mt-0">
            <div className="bg-card rounded-xl shadow-xl p-8 border border-border/30 hover:shadow-2xl transition-all duration-300">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="font-medium">Active Users</p>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">10k+</p>
                    <p className="text-xs text-muted-foreground">+23% from last month</p>
                  </div>
                </div>
                
                <div className="w-full h-px bg-border/50"></div>
                
                <div className="flex justify-between items-center">
                  <p className="font-medium">Leads Managed</p>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">1M+</p>
                    <p className="text-xs text-muted-foreground">+67% YoY growth</p>
                  </div>
                </div>
                
                <div className="w-full h-px bg-border/50"></div>
                
                <div className="flex justify-between items-center">
                  <p className="font-medium">Customer Satisfaction</p>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">99%</p>
                    <p className="text-xs text-muted-foreground">Based on 5,000+ reviews</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-border/30">
                <div className="flex gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary">
                    Salesforce Alternative
                  </div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary">
                    Easy Integration
                  </div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary">
                    AI-Powered
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, MessageSquare, Shield, Globe, Zap, LineChart, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work together seamlessly with your team to manage leads effectively.",
    highlights: ["Real-time updates", "Shared pipelines", "Role-based access"]
  },
  {
    icon: MessageSquare,
    title: "Smart Communication",
    description: "Stay in touch with leads through integrated communication tools.",
    highlights: ["Email templates", "SMS integration", "Conversation tracking"]
  },
  {
    icon: Shield,
    title: "Data Security",
    description: "Your data is protected with enterprise-grade security measures.",
    highlights: ["256-bit encryption", "GDPR compliant", "Regular backups"]
  },
  {
    icon: Globe,
    title: "Global Access",
    description: "Access your leads and data from anywhere in the world.",
    highlights: ["Mobile app", "Browser-based", "Offline capabilities"]
  },
  {
    icon: Zap,
    title: "Automation",
    description: "Automate repetitive tasks and focus on what matters most.",
    highlights: ["Email sequences", "Follow-up reminders", "Lead scoring"]
  },
  {
    icon: LineChart,
    title: "Analytics",
    description: "Get insights into your lead management performance.",
    highlights: ["Conversion tracking", "Custom reports", "Performance dashboards"]
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-16 md:py-24 lg:py-32 relative overflow-hidden">
      {/* Background elements matching hero style */}
      <div className="absolute inset-0 " />
      <div className="absolute top-40 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-20">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            Features That Drive Results
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Everything You Need
            </span>
            <span className="block text-foreground mt-1">To Close More Deals</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our Sales CRM combines powerful features with an intuitive interface, helping your team collaborate effectively and convert more leads into customers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="overflow-hidden border border-border/30 bg-card hover:shadow-xl transition-all duration-300 group"
            >
              <CardContent className="p-6 md:p-8 flex flex-col h-full">
                <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-muted-foreground mb-6">{feature.description}</p>
                
                <div className="mt-auto">
                  <div className="w-full h-px bg-border/50 mb-6"></div>
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-16 md:mt-20 text-center">
          <Button size="lg" className="gap-2 font-medium shadow-lg hover:shadow-xl hover:translate-y-px transition-all">
            Explore All Features <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
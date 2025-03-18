import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, MessageSquare, Shield, Globe, Zap, LineChart } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work together seamlessly with your team to manage leads effectively."
  },
  {
    icon: MessageSquare,
    title: "Smart Communication",
    description: "Stay in touch with leads through integrated communication tools."
  },
  {
    icon: Shield,
    title: "Data Security",
    description: "Your data is protected with enterprise-grade security measures."
  },
  {
    icon: Globe,
    title: "Global Access",
    description: "Access your leads and data from anywhere in the world."
  },
  {
    icon: Zap,
    title: "Automation",
    description: "Automate repetitive tasks and focus on what matters most."
  },
  {
    icon: LineChart,
    title: "Analytics",
    description: "Get insights into your lead management performance."
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-16 md:py-20 lg:py-24 bg-gradient-to-b from-accent/30 to-accent/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6 text-primary">Powerful Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            Everything you need to manage your leads effectively and grow your business.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="overflow-hidden border-2 border-accent hover:border-primary/50 transition-all duration-300 hover:shadow-xl"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6 md:p-8 flex flex-col h-full">
                <div className="rounded-full bg-primary/10 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mb-4 md:mb-6 transform transition-transform duration-300 hover:scale-110">
                  <feature.icon className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                </div>
                <h3 className="text-xl md:text-2xl font-semibold mb-2 md:mb-4">{feature.title}</h3>
                <p className="text-muted-foreground text-base md:text-lg">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
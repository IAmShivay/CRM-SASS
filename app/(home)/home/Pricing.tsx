import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { CheckCircle, Star, ShieldCheck, Zap } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$29",
    description: "Perfect for small teams getting started with lead management",
    icon: <Zap className="h-5 w-5 text-blue-500" />,
    features: [
      "Up to 1,000 leads",
      "Basic analytics",
      "Email support",
      "1 workspace",
      "Basic automation"
    ]
  },
  {
    name: "Professional",
    price: "$79",
    description: "Ideal for growing businesses with advanced needs",
    popular: true,
    icon: <Star className="h-5 w-5 text-yellow-500" />,
    features: [
      "Up to 10,000 leads",
      "Advanced analytics",
      "Priority support",
      "5 workspaces",
      "Advanced automation",
      "API access"
    ]
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Tailored solutions for large-scale operations",
    icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />,
    features: [
      "Unlimited leads",
      "Custom integrations",
      "24/7 support",
      "Unlimited workspaces",
      "Custom automation",
      "Dedicated account manager"
    ]
  }
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-20 md:py-28 lg:py-32 relative overflow-hidden">
      {/* Background elements matching hero style */}
      <div className="absolute inset-0 " />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute top-40 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-md sm:max-w-lg md:max-w-2xl mx-auto text-center mb-12 md:mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            Flexible Pricing Options
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Choose the Right Plan
            </span>
          </h2>
          
          <p className="text-muted-foreground text-lg">
            Select a plan that aligns with your business goals. All plans include our core CRM features with no hidden costs.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 lg:gap-10 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative group transition-all duration-300 hover:shadow-lg border-border/50 overflow-hidden ${
                plan.popular ? 'border-primary shadow-md translate-y-0 md:-translate-y-4' : ''
              }`}
            >
              {/* Background accent */}
              <div className={`absolute top-0 left-0 h-1 w-full ${plan.popular ? 'bg-primary' : 'bg-primary/30'}`}></div>
              
              {plan.popular && (
                <div className="absolute -right-12 top-7 rotate-45">
                  <div className="bg-primary text-primary-foreground text-xs font-medium py-1 w-36 text-center">
                    Most Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="pt-8 pb-4">
                <div className="flex items-center justify-center mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center 
                    ${plan.popular ? 'bg-primary/10' : 'bg-primary/5'}`}>
                    {plan.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-center">{plan.name}</h3>
                <p className="text-sm text-center text-muted-foreground mt-1">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="pt-2 pb-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold">
                    {plan.price}
                    {plan.price !== "Custom" && <span className="text-lg text-muted-foreground">/mo</span>}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <CheckCircle className={`h-5 w-5 flex-shrink-0 ${
                        plan.popular ? 'text-primary' : 'text-primary/70'
                      }`} />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              
              <CardFooter className="pt-2 pb-8">
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                  className={`w-full font-medium shadow transition-all ${
                    plan.popular ? 'shadow-lg hover:shadow-xl' : 'hover:border-primary/50'
                  }`}
                >
                  {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-12 md:mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">Need a custom solution for your specific requirements?</p>
          <Button variant="link" className="text-primary">
            Talk to our sales team
          </Button>
        </div>
      </div>
    </section>
  );
};
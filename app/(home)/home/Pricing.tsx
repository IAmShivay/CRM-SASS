import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$29",
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
    popular: true,
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
    <section id="pricing" className="py-16 md:py-20 lg:py-24 bg-gray-50 dark:bg-gray-900/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
            Choose the plan that best fits your needs. All plans include our core features.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs md:text-sm font-medium px-2 py-1 md:px-3 md:py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <CardContent className="pt-6 md:pt-8 px-4 md:px-6">
                <div className="text-center">
                  <h3 className="text-lg md:text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="text-3xl md:text-4xl font-bold mb-4">
                    {plan.price}
                    {plan.price !== "Custom" && <span className="text-sm md:text-lg text-gray-600 dark:text-gray-400">/mo</span>}
                  </div>
                  <ul className="space-y-2 md:space-y-3 mb-6 text-left">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm md:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full"
                  >
                    {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
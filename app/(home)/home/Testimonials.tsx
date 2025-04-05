import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const testimonials = [
  {
    quote: "LeadHive has transformed how we manage our leads. The interface is intuitive and the features are exactly what we needed. We've seen our lead qualification time cut in half.",
    author: "Sarah Johnson",
    role: "Marketing Director",
    company: "TechCorp",
    avatar: "/api/placeholder/100/100",
    metric: "45% increase in qualified leads"
  },
  {
    quote: "The team collaboration features are outstanding. We've seen a 40% increase in conversion rates since switching to LeadHive. The real-time notifications keep everyone in sync.",
    author: "Michael Chen",
    role: "Sales Manager",
    company: "GrowthCo",
    avatar: "/api/placeholder/100/100",
    metric: "40% higher conversion rate"
  },
  {
    quote: "The automation features have saved us countless hours. It's like having an extra team member working 24/7. Our follow-up consistency has never been better.",
    author: "Emily Rodriguez",
    role: "Operations Lead",
    company: "ScaleUp Inc",
    avatar: "/api/placeholder/100/100",
    metric: "20+ hours saved weekly"
  },
  {
    quote: "LeadHive's analytics gives us actionable insights we never had before. We can now make data-driven decisions that directly impact our bottom line.",
    author: "James Wilson",
    role: "Sales Director",
    company: "Innovate LLC",
    avatar: "/api/placeholder/100/100",
    metric: "62% improved close rates"
  }
];

export const Testimonials = () => {
  return (
    <section id="testimonials" className="py-16 md:py-24 lg:py-32 relative overflow-hidden">
      {/* Background effects matching hero section */}
      <div className="absolute inset-0 " />
      <div className="absolute top-40 left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl opacity-70" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-70" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 md:mb-16">
          <div className="max-w-2xl mb-6 md:mb-0">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              Customer Success Stories
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
              Trusted by sales teams
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70"> worldwide</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              See how sales teams are transforming their lead management and driving better results with LeadHive.
            </p>
          </div>
          <Button variant="outline" className="self-start md:self-auto">
            Read All Case Studies
          </Button>
        </div>

        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full border border-border/50 shadow-md hover:shadow-xl hover:border-primary/20 transition-all duration-300">
                    <CardContent className="p-6 md:p-8">
                      <Quote className="h-10 w-10 text-primary/20 mb-4" />
                      <div className="flex gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-primary fill-current" />
                        ))}
                      </div>
                      <p className="text-foreground text-base md:text-lg mb-4 font-medium">{testimonial.quote}</p>

                      <div className="pt-4 mt-4 border-t border-border/30">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="h-12 w-12 md:h-14 md:w-14 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                              <Image
                                width={100}
                                height={100}
                                src={testimonial.avatar}
                                alt={testimonial.author}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-primary border-2 border-background"></span>
                          </div>
                          <div>
                            <p className="font-semibold">{testimonial.author}</p>
                            <p className="text-sm text-muted-foreground">
                              {testimonial.role}, {testimonial.company}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 py-2 px-3 bg-primary/10 rounded-md text-sm text-primary font-medium inline-flex">
                          <span className="flex h-2 w-2 rounded-full bg-primary mr-2 self-center"></span>
                          {testimonial.metric}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>

            <div className="flex justify-center mt-8">
              <div className="flex items-center gap-2">
                <CarouselPrevious className="relative h-10 w-10 rounded-full border border-primary/20 hover:border-primary hover:bg-primary/5" />
                <CarouselNext className="relative h-10 w-10 rounded-full border border-primary/20 hover:border-primary hover:bg-primary/5" />
              </div>
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
};
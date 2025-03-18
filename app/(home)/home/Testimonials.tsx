import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const testimonials = [
  {
    quote: "LeadHive has transformed how we manage our leads. The interface is intuitive and the features are exactly what we needed.",
    author: "Sarah Johnson",
    role: "Marketing Director",
    company: "TechCorp",
    avatar: "/placeholder.svg"
  },
  {
    quote: "The team collaboration features are outstanding. We've seen a 40% increase in conversion rates since switching to LeadHive.",
    author: "Michael Chen",
    role: "Sales Manager",
    company: "GrowthCo",
    avatar: "/placeholder.svg"
  },
  {
    quote: "The automation features have saved us countless hours. It's like having an extra team member working 24/7.",
    author: "Emily Rodriguez",
    role: "Operations Lead",
    company: "ScaleUp Inc",
    avatar: "/placeholder.svg"
  }
];

export const Testimonials = () => {
  return (
    <section id="testimonials" className="py-16 md:py-20 lg:py-24 bg-accent/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12 animate-fade-in">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">What Our Customers Say</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            Don't just take our word for it. Here's what our customers have to say about LeadHive.
          </p>
        </div>
        <div className="max-w-5xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="px-2 sm:px-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full hover:shadow-lg transition-all">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex gap-1 mb-3 md:mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 md:h-5 md:w-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <p className="text-muted-foreground text-sm md:text-base mb-4">{testimonial.quote}</p>
                      <div className="flex items-center gap-3 md:gap-4">
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.author}
                          className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-sm md:text-base">{testimonial.author}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {testimonial.role}, {testimonial.company}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center mt-6">
              <CarouselPrevious className="relative mr-2 md:mr-4" />
              <CarouselNext className="relative ml-2 md:ml-4" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
};
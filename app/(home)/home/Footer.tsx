import { Zap, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border/20 text-foreground py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter section */}
        <div className="mb-12 pb-12 border-b border-border/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-md">
              <h3 className="text-xl font-bold mb-2">Stay updated with InfiLabs</h3>
              <p className="text-muted-foreground text-sm">Get the latest news, tips and updates about CRM and lead management.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
              <Button className="whitespace-nowrap font-medium">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main footer content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">InfiLabs</span>
            </div>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              Transforming lead management for modern businesses with intelligent tools that drive growth.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>contact@InfiLabs.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>123 SaaS Street, San Francisco, CA</span>
              </div>
            </div>
          </div>
          
          {/* Quick links */}
          <div>
            <h4 className="font-semibold mb-4 text-base">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-muted-foreground hover:text-primary transition-colors text-sm">Features</a></li>
              <li><a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors text-sm">Pricing</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Security</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Enterprise</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Integrations</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-base">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">About</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Careers</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Blog</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Contact</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Partners</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-base">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Documentation</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Help Center</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Tutorials</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Case Studies</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Webinars</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-base">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Privacy Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Terms of Service</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Cookie Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">GDPR</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Licenses</a></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom section with social links and copyright */}
        <div className="border-t border-border/20 mt-12 pt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">&copy; {new Date().getFullYear()} InfiLabs. All rights reserved.</p>
          
          <div className="flex items-center gap-4">
            <a href="#" className="p-2 rounded-full bg-background hover:bg-primary/10 transition-colors">
              <Facebook className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
            </a>
            <a href="#" className="p-2 rounded-full bg-background hover:bg-primary/10 transition-colors">
              <Twitter className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
            </a>
            <a href="#" className="p-2 rounded-full bg-background hover:bg-primary/10 transition-colors">
              <Linkedin className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
            </a>
            <a href="#" className="p-2 rounded-full bg-background hover:bg-primary/10 transition-colors">
              <Instagram className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/layout/user-nav";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import SubscriptionBanner from "./subscription-banner";

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the initial session
    const fetchSession = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setLoading(false);
    };
    
    fetchSession();

    // Set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Proper cleanup to avoid memory leaks
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const navigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Leads Sources", href: "/leads-sources" },
    { name: "Leads", href: "/leads" },
    { name: "Contact", href: "/contact" },
    { name: "Analytics", href: "/analytics" },
  ];

  // Check if we're on the home page
  const isHomePage = pathname === '/';

  return (
    <>
      <SubscriptionBanner />
      <div className="border-b">
        {/* Mobile Navbar */}
        <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden lg:hidden fixed top-0 left-0 right-0 z-50 ">
          <div className="flex h-16 items-center justify-between px-4">
            {/* Logo */}
            <Link href="/" className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              CRM
            </Link>

            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Menu Button */}
              <Sheet>
                <SheetTrigger>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>

                <SheetContent side="left" className="w-64 p-0">
                  <div className="flex flex-col h-full">
                    <div className="border-b p-4">
                      <Link href="/" className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                        CRM
                      </Link>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4">
                      <nav className="space-y-1 px-2">
                        {navigation.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                              pathname === item.href
                                ? "nav-item-active"
                                : "text-muted-foreground hover:text-accent-foreground hover:bg-accent/10"
                            }`}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </nav>
                    </div>

                    {user && (
                      <div className="border-t p-4">
                        <UserNav />
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>

        {/* Desktop Navbar */}
        <div className="hidden md:flex h-16 items-center px-4 md:px-6 lg:px-8 justify-between">
          {/* Logo */}
          <Link href="/" className="font-bold text-xl mr-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            CRM
          </Link>

          {/* Navigation Links - Only show on dashboard pages */}
          {!isHomePage && (
            <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "text-primary border-b-2 border-primary pb-1"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          )}

          {/* Home Page Actions */}
          {isHomePage && (
            <div className="flex-1 flex justify-center">
              <nav className="flex items-center space-x-4 lg:space-x-6">
                <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Features
                </Link>
                <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Pricing
                </Link>
                <Link href="#faq" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </nav>
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            {!loading && (
              <>
                {user ? (
                  <UserNav />
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" asChild className="hover:text-primary">
                      <Link href="/login">Log in</Link>
                    </Button>
                    <Button size="sm" asChild className="btn-gradient">
                      <Link href="/register">Sign up</Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Spacer to prevent content from going under fixed navbar */}
        <div className="h-16 md:h-0" />
      </div>
    </>
  );
}
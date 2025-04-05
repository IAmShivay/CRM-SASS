"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Features } from "./(home)/home/Features";
import { Footer } from "./(home)/home/Footer";
import { Header } from "./(home)/home/Header";
import { Pricing } from "./(home)/home/Pricing";
import { Testimonials } from "./(home)/home/Testimonials";
import { Hero } from "./(home)/home/Hero";
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
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <Hero />
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <Features />
            <Pricing />
            <Testimonials />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

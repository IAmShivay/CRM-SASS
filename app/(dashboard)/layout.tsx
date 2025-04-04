"use client";

import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/lib/store/hooks";
import { X, Menu } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  // const router = useRouter();
  // const user = useAppSelector((state) => state.auth.user);

  // useEffect(() => {
  //   if (!user) {
  //     router.push("/login");
  //   }
  // }, [user, router]);

  // if (!user) {
  //   return null;
  // }

  return (
    <div className="min-h-screen relative">
      {/* Navbar - Added at the top */}
      <Navbar />
      
      <div className="flex relative">
        {/* Overlay for Blur Effect */}
        {isOpen && (
          <div className="fixed inset-0 bg-gray-900 opacity-70 z-50" />
        )}

        <aside className="border-r min-h-[calc(100vh-4rem)] z-[99]">
          <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
        </aside>
        <main className="flex-1 relative z-0">{children}</main>
      </div>
    </div>
  );
}
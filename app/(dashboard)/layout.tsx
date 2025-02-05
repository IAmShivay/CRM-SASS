"use client";

import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { useAppSelector } from "@/lib/store/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <aside className="hidden md:block border-r min-h-[calc(100vh-4rem)]">
          <Sidebar />
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}


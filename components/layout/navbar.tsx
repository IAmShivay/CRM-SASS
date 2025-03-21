"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/layout/user-nav";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import SubscriptionBanner from "./subscription-banner";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(2); // Example count

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setLoading(false);
    };
    
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const notifications = [
    { id: 1, title: "New lead assigned", message: "A new lead has been assigned to you", time: "5 minutes ago" },
    { id: 2, title: "Meeting reminder", message: "Call with John Doe in 15 minutes", time: "10 minutes ago" }
  ];

  const NotificationButton = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-destructive text-xs text-white flex items-center justify-center">
              {notificationCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 dark:bg-slate-800 dark:border-slate-700">
        <div className="p-3 border-b dark:border-slate-700">
          <h3 className="font-medium dark:text-white">Notifications</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.map((notification) => (
            <div key={notification.id} className="p-3 border-b dark:border-slate-700 last:border-b-0 hover:bg-slate-100 dark:hover:bg-slate-700">
              <h4 className="font-medium text-sm dark:text-white">{notification.title}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">{notification.message}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{notification.time}</p>
            </div>
          ))}
        </div>
        <div className="p-2 border-t dark:border-slate-700">
          <Button variant="ghost" size="sm" className="w-full dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700">
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <>
      <SubscriptionBanner />
      <div >
        {/* Mobile Navbar */}
        <div className="md:hidden bg-white dark:bg-black backdrop-blur fixed top-0 left-0 right-0 z-50 w-full">
          <div className="relative flex h-16 items-center justify-center px-4">
            
            {/* Centered actions */}
            <div className="flex items-center space-x-4">
              <NotificationButton />
              <ThemeToggle />
              {!loading && user && <UserNav />}
            </div>

            {/* Logo positioned absolutely so the actions remain centered */}
            <div className="absolute left-4">
              <span className="font-bold dark:text-white">Logo</span>
            </div>
          </div>
        </div>

        {/* Desktop Navbar */}
        <div className="hidden md:flex bg-white dark:bg-black backdrop-blur fixed top-0 left-0 right-0 z-50 w-full h-16 items-center px-4 md:px-6 lg:px-8 justify-between">
          
          <div className="flex-1">
            <span className="font-bold dark:text-white">Logo</span>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationButton />
            <ThemeToggle />

            {!loading && (
              <>
                {user ? (
                  <UserNav />
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" asChild className="dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
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

        <div className="h-16" />
      </div>
    </>
  );
}
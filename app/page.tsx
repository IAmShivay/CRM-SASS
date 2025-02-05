"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard"); // Redirect to the dashboard unconditionally
  }, []);

  return null; // No UI needed since it always redirects
}

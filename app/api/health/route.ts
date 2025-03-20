import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";

export async function GET() {
  try {
    // Check database connection
    const { data, error } = await supabase.from('_health_check').select('*').limit(1);
    
    if (error) {
      console.error("Database health check failed:", error);
      return NextResponse.json(
        { 
          status: "error", 
          message: "Database connection failed",
          timestamp: new Date().toISOString(),
          services: {
            database: "down",
            api: "up"
          }
        }, 
        { status: 500 }
      );
    }

    // All checks passed
    return NextResponse.json(
      { 
        status: "ok", 
        message: "Service is healthy",
        timestamp: new Date().toISOString(),
        services: {
          database: "up",
          api: "up"
        },
        version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
        instance: process.env.INSTANCE_ID || "1"
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { 
        status: "error", 
        message: "Service health check failed",
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

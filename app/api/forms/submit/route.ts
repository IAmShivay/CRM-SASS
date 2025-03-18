import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with the public URL and anon key
// This endpoint needs to be accessible without authentication
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Enable CORS for form submissions from any domain
    const origin = req.headers.get("origin");
    
    // Get form data from request
    const body = await req.json();
    const { formId, data } = body;

    if (!formId) {
      return new NextResponse(
        JSON.stringify({ error: "Form ID is required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin || "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    }

    // Get the form to verify it exists and is active
    const { data: formData, error: formError } = await supabase
      .from("custom_forms")
      .select("*, lead_sources(id)")
      .eq("id", formId)
      .eq("is_active", true)
      .single();

    if (formError || !formData) {
      return new NextResponse(
        JSON.stringify({ error: "Form not found or inactive" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin || "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    }

    // Save the form submission
    const { data: submission, error: submissionError } = await supabase
      .from("form_submissions")
      .insert({
        form_id: formId,
        lead_source_id: formData.lead_sources?.id,
        data,
      })
      .select()
      .single();

    if (submissionError) {
      return new NextResponse(
        JSON.stringify({ error: submissionError.message }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": origin || "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    }

    // Create a lead from the submission data
    const leadData = {
      workspace_id: formData.workspace_id,
      lead_source_id: formData.lead_sources?.id,
      name: data.name || "Unknown",
      email: data.email,
      phone: data.phone,
      company: data.company,
      status: "new",
      custom_fields: data,
    };

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert(leadData)
      .select()
      .single();

    if (leadError) {
      console.error("Error creating lead:", leadError);
      // Continue even if lead creation fails, as we've already saved the submission
    }

    return new NextResponse(
      JSON.stringify({ success: true, submission, lead }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Error processing form submission:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to process form submission" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400", // 24 hours
    },
  });
}

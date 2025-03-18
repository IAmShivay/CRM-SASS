import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Form name is required"),
  description: z.string().optional(),
  html_content: z.string().min(1, "HTML content is required"),
  css_content: z.string().optional(),
  js_content: z.string().optional(),
  is_active: z.boolean().default(true),
  workspace_id: z.string().uuid("Invalid workspace ID"),
  lead_source_id: z.string().uuid("Invalid lead source ID").optional(),
});

// GET /api/forms - Get all forms for a workspace
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspace_id");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    // Get user session to verify access
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch forms for the workspace
    const { data, error } = await supabase
      .from("custom_forms")
      .select("*")
      .eq("workspace_id", workspaceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ forms: data });
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}

// POST /api/forms - Create a new form
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json();

    // Validate request body
    const validationResult = formSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const formData = validationResult.data;

    // Get user session to verify access
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create the form
    const { data, error } = await supabase
      .from("custom_forms")
      .insert([formData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If a lead source ID was provided, update the lead source with the form ID
    if (formData.lead_source_id) {
      const { error: updateError } = await supabase
        .from("lead_sources")
        .update({ form_id: data.id })
        .eq("id", formData.lead_source_id);

      if (updateError) {
        console.error("Error updating lead source:", updateError);
      }
    }

    return NextResponse.json({ form: data }, { status: 201 });
  } catch (error) {
    console.error("Error creating form:", error);
    return NextResponse.json(
      { error: "Failed to create form" },
      { status: 500 }
    );
  }
}

// PATCH /api/forms - Update an existing form
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("id");

    if (!formId) {
      return NextResponse.json(
        { error: "Form ID is required" },
        { status: 400 }
      );
    }

    // Get user session to verify access
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request body (partial validation for update)
    const updateSchema = formSchema.partial();
    const validationResult = updateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const formData = validationResult.data;

    // Update the form
    const { data, error } = await supabase
      .from("custom_forms")
      .update(formData)
      .eq("id", formId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ form: data });
  } catch (error) {
    console.error("Error updating form:", error);
    return NextResponse.json(
      { error: "Failed to update form" },
      { status: 500 }
    );
  }
}

// DELETE /api/forms - Delete a form
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get("id");

    if (!formId) {
      return NextResponse.json(
        { error: "Form ID is required" },
        { status: 400 }
      );
    }

    // Get user session to verify access
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the form
    const { error } = await supabase
      .from("custom_forms")
      .delete()
      .eq("id", formId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting form:", error);
    return NextResponse.json(
      { error: "Failed to delete form" },
      { status: 500 }
    );
  }
}

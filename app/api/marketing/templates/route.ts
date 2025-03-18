import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";

// Template validation schema
const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  type: z.enum(["email", "sms", "whatsapp"], {
    errorMap: () => ({ message: "Invalid template type" }),
  }),
  content: z.string().min(1, "Content is required"),
  variables: z.array(z.string()).optional(),
  workspace_id: z.string().uuid("Invalid workspace ID"),
});

// GET /api/marketing/templates - Get all templates for a workspace
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspace_id");
    const templateId = searchParams.get("id");
    const templateType = searchParams.get("type");

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

    // If a specific template ID is provided, fetch that template
    if (templateId) {
      const { data, error } = await supabase
        .from("marketing_templates")
        .select("*")
        .eq("id", templateId)
        .eq("workspace_id", workspaceId)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ template: data });
    }

    // Build query
    let query = supabase
      .from("marketing_templates")
      .select("*")
      .eq("workspace_id", workspaceId);

    // If a type filter is provided, apply it
    if (templateType) {
      query = query.eq("type", templateType);
    }

    // Order by creation date
    query = query.order("created_at", { ascending: false });

    // Execute query
    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ templates: data });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST /api/marketing/templates - Create a new template
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json();

    // Validate request body
    const validationResult = templateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const templateData = validationResult.data;

    // Get user session to verify access
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create the template
    const { data, error } = await supabase
      .from("marketing_templates")
      .insert([templateData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template: data }, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

// PATCH /api/marketing/templates - Update an existing template
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("id");

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
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
    const updateSchema = templateSchema.partial();
    const validationResult = updateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const templateData = validationResult.data;

    // Update the template
    const { data, error } = await supabase
      .from("marketing_templates")
      .update(templateData)
      .eq("id", templateId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE /api/marketing/templates - Delete a template
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("id");

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID is required" },
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

    // Delete the template
    const { error } = await supabase
      .from("marketing_templates")
      .delete()
      .eq("id", templateId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}

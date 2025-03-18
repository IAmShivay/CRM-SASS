import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";

// Lead source validation schema
const leadSourceSchema = z.object({
  name: z.string().min(1, "Lead source name is required"),
  type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  webhook_url: z.string().optional(),
  workspace_id: z.string().uuid("Invalid workspace ID"),
  form_id: z.string().uuid("Invalid form ID").optional(),
});

// GET /api/lead-sources - Get all lead sources for a workspace
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

    // Fetch lead sources for the workspace
    const { data, error } = await supabase
      .from("lead_sources")
      .select("*, custom_forms(id, name)")
      .eq("workspace_id", workspaceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leadSources: data });
  } catch (error) {
    console.error("Error fetching lead sources:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead sources" },
      { status: 500 }
    );
  }
}

// POST /api/lead-sources - Create a new lead source
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json();

    // Validate request body
    const validationResult = leadSourceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const leadSourceData = validationResult.data;

    // Get user session to verify access
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create the lead source
    const { data, error } = await supabase
      .from("lead_sources")
      .insert([leadSourceData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leadSource: data }, { status: 201 });
  } catch (error) {
    console.error("Error creating lead source:", error);
    return NextResponse.json(
      { error: "Failed to create lead source" },
      { status: 500 }
    );
  }
}

// PATCH /api/lead-sources - Update an existing lead source
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const leadSourceId = searchParams.get("id");

    if (!leadSourceId) {
      return NextResponse.json(
        { error: "Lead source ID is required" },
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
    const updateSchema = leadSourceSchema.partial();
    const validationResult = updateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const leadSourceData = validationResult.data;

    // Update the lead source
    const { data, error } = await supabase
      .from("lead_sources")
      .update(leadSourceData)
      .eq("id", leadSourceId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ leadSource: data });
  } catch (error) {
    console.error("Error updating lead source:", error);
    return NextResponse.json(
      { error: "Failed to update lead source" },
      { status: 500 }
    );
  }
}

// DELETE /api/lead-sources - Delete a lead source
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(req.url);
    const leadSourceId = searchParams.get("id");

    if (!leadSourceId) {
      return NextResponse.json(
        { error: "Lead source ID is required" },
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

    // Delete the lead source
    const { error } = await supabase
      .from("lead_sources")
      .delete()
      .eq("id", leadSourceId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead source:", error);
    return NextResponse.json(
      { error: "Failed to delete lead source" },
      { status: 500 }
    );
  }
}

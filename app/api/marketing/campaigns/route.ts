import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";

// Campaign validation schema
const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  type: z.enum(["email", "sms", "whatsapp", "phone"], {
    errorMap: () => ({ message: "Invalid campaign type" }),
  }),
  status: z.enum(["draft", "scheduled", "in_progress", "completed", "cancelled"], {
    errorMap: () => ({ message: "Invalid campaign status" }),
  }).default("draft"),
  content: z.string().optional(),
  template_id: z.string().uuid("Invalid template ID").optional(),
  scheduled_at: z.string().optional(),
  workspace_id: z.string().uuid("Invalid workspace ID"),
  recipient_leads: z.array(z.string().uuid("Invalid lead ID")).optional(),
});

// GET /api/marketing/campaigns - Get all campaigns for a workspace
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspace_id");
    const campaignId = searchParams.get("id");

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

    // If a specific campaign ID is provided, fetch that campaign
    if (campaignId) {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .select(`
          *,
          marketing_templates(id, name, type),
          campaign_recipients(
            id, 
            lead_id, 
            status, 
            sent_at, 
            delivered_at, 
            opened_at, 
            clicked_at,
            leads(id, name, email, phone)
          )
        `)
        .eq("id", campaignId)
        .eq("workspace_id", workspaceId)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ campaign: data });
    }

    // Otherwise, fetch all campaigns for the workspace
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .select(`
        *,
        marketing_templates(id, name, type),
        campaign_recipients(id)
      `)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add recipient count to each campaign
    const campaignsWithCounts = data.map((campaign) => ({
      ...campaign,
      recipient_count: campaign.campaign_recipients?.length || 0,
      // Remove the recipients array to reduce payload size
      campaign_recipients: undefined,
    }));

    return NextResponse.json({ campaigns: campaignsWithCounts });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

// POST /api/marketing/campaigns - Create a new campaign
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json();

    // Validate request body
    const validationResult = campaignSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const campaignData = validationResult.data;
    const recipientLeads = campaignData.recipient_leads || [];
    delete campaignData.recipient_leads;

    // Get user session to verify access
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create the campaign
    const { data: campaign, error } = await supabase
      .from("marketing_campaigns")
      .insert([campaignData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If recipients are provided, add them to the campaign
    if (recipientLeads.length > 0) {
      const recipients = recipientLeads.map((leadId) => ({
        campaign_id: campaign.id,
        lead_id: leadId,
        status: "pending",
      }));

      const { error: recipientsError } = await supabase
        .from("campaign_recipients")
        .insert(recipients);

      if (recipientsError) {
        console.error("Error adding recipients:", recipientsError);
        // Continue even if there's an error adding recipients
      }
    }

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}

// PATCH /api/marketing/campaigns - Update an existing campaign
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("id");

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
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
    const updateSchema = campaignSchema.partial();
    const validationResult = updateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    const campaignData = validationResult.data;
    const recipientLeads = campaignData.recipient_leads;
    delete campaignData.recipient_leads;

    // Update the campaign
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .update(campaignData)
      .eq("id", campaignId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If recipients are provided, update them
    if (recipientLeads) {
      // First, delete existing recipients
      const { error: deleteError } = await supabase
        .from("campaign_recipients")
        .delete()
        .eq("campaign_id", campaignId);

      if (deleteError) {
        console.error("Error deleting recipients:", deleteError);
        // Continue even if there's an error deleting recipients
      }

      // Then, add new recipients
      if (recipientLeads.length > 0) {
        const recipients = recipientLeads.map((leadId) => ({
          campaign_id: campaignId,
          lead_id: leadId,
          status: "pending",
        }));

        const { error: recipientsError } = await supabase
          .from("campaign_recipients")
          .insert(recipients);

        if (recipientsError) {
          console.error("Error adding recipients:", recipientsError);
          // Continue even if there's an error adding recipients
        }
      }
    }

    return NextResponse.json({ campaign: data });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

// DELETE /api/marketing/campaigns - Delete a campaign
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("id");

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
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

    // Delete the campaign
    const { error } = await supabase
      .from("marketing_campaigns")
      .delete()
      .eq("id", campaignId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}

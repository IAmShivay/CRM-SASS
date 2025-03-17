import { NextApiRequest, NextApiResponse } from "next";
import { AUTH_MESSAGES } from "@/lib/constant/auth";
import { supabase } from "../../../lib/supabaseServer";
import { validateEmail, validatePhoneNumber } from "../leads";

// Notification interfaces
interface NotificationDetails {
  [key: string]: any;
}

interface Notification {
  lead_id: string;
  action_type: string;
  user_id: string;
  workspace_id: string;
  details: NotificationDetails;
  read: boolean;
  created_at: string;
}

interface WorkspaceMember {
  user_id: string;
}

async function notifyLeadChange(
  leadId: string,
  action: string,
  userId: string,
  workspaceId: string,
  details: NotificationDetails = {}
): Promise<Notification[] | undefined> {
  try {
    // Fetch user information from workspace_members for this specific workspace
    const { data: workspaceMemberData, error: workspaceMemberError } = await supabase
      .from("workspace_members")
      .select("name")
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId) // Add this to get only the relevant workspace membership
      .single();
    
    let userDisplayName = "Unknown user";
    
    if (workspaceMemberError) {
      console.error("Failed to fetch workspace member data:", workspaceMemberError.message);
      
      // Fallback: try to get the name from other sources if available
      // For example, you might have a separate users or profiles table
    } else if (workspaceMemberData) {
      userDisplayName = workspaceMemberData.name;
    }
    
    // Enrich the details with names for various user IDs
    const enrichedDetails = { ...details };
    enrichedDetails.actor_name = userDisplayName;

    if (details.updated_by) {
      const { data: updaterData, error: updaterError } = await supabase
        .from("workspace_members")
        .select("name")
        .eq("user_id", details.updated_by)
        .eq("workspace_id", workspaceId)
        .single();
        
      if (!updaterError && updaterData) {
        enrichedDetails.updated_by_name = updaterData.name;
      }
    }
    
    // For deleted_by
    if (details.deleted_by) {
      const { data: deleterData, error: deleterError } = await supabase
        .from("workspace_members")
        .select("name")
        .eq("user_id", details.deleted_by)
        .eq("workspace_id", workspaceId)
        .single();
        
      if (!deleterError && deleterData) {
        enrichedDetails.deleted_by_name = deleterData.name;
      }
    }
    
    // For new_assignee (if present)
    if (details.new_assignee) {
      const { data: assigneeData, error: assigneeError } = await supabase
        .from("workspace_members")
        .select("name")
        .eq("user_id", details.new_assignee)
        .eq("workspace_id", workspaceId)
        .single();
        
      if (!assigneeError && assigneeData) {
        enrichedDetails.new_assignee_name = assigneeData.name;
      }
    }
    
    // For previous_assignee (if present)
    if (details.previous_assignee) {
      const { data: prevAssigneeData, error: prevAssigneeError } = await supabase
        .from("workspace_members")
        .select("name")
        .eq("user_id", details.previous_assignee)
        .eq("workspace_id", workspaceId)
        .single();
        
      if (!prevAssigneeError && prevAssigneeData) {
        enrichedDetails.previous_assignee_name = prevAssigneeData.name;
      }
    }
    
    console.log({
      leadId,
      action,
      userId,
      workspaceId,
      details: enrichedDetails,
    });
    
    const { data:notification, error } = await supabase.from("notifications").insert([
      {
        lead_id: leadId,
        action_type: action,
        user_id: userId,
        workspace_id: workspaceId,
        details: enrichedDetails,
        read: false,
        created_at: new Date().toISOString(),
      },
    ]).select("*");

    if (error) {
      console.error("Failed to create notification:", error.message);
    }

    const { data: members, error: membersError } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspaceId);

    if (membersError) {
      console.error("Failed to fetch workspace members:", membersError.message);
      return;
    } 
    console.log(notification)
    const { error: readStatusError } = await supabase
    .from("notification_read_status")
    .insert([
      {
        notification_id: notification[0].id,
        user_id: userId,
        read: false,
        read_at: new Date().toISOString(),
      },
    ]);
    return notification || undefined;
  } catch (err) {
    console.error("Notification error:", err);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query, headers } = req;
  const action = query.action as string;
  const authHeader = headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
  }
  
  const token = authHeader.split(" ")[1];
  
  switch (method) {
    case "POST":
      switch (action) {
        case "createLead": {
          const body = req.body;
         

          if (!body || !body.name || !body.email) {
            return res
              .status(400)
              .json({ error: "Name and Email are required" });
          }

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          const { data: existingLeads, error: fetchError } = await supabase
            .from("leads")
            .select("created_at")
            .eq("email", body.email)
            .order("created_at", { ascending: false })
            .limit(1);

          if (fetchError) {
            return res
              .status(500)
              .json({ error: "Error checking existing leads" });
          }

          if (existingLeads.length > 0) {
            const existingLead = existingLeads[0];
            const createdAt = new Date(existingLead.created_at);
            const now = new Date();

            if (!isNaN(createdAt.getTime())) {
              const timeDifference =
                (now.getTime() - createdAt.getTime()) / (1000 * 60);

              if (timeDifference < 60) {
                return res.status(400).json({
                  error:
                    "A lead with this email was created less than an hour ago.",
                });
              }
            }
          }

          // Step 2: Validate email and phone
          const isValidEmail = await validateEmail(body.email);
          const isValidPhone = await validatePhoneNumber(body.phone);
          console.log(isValidEmail, isValidPhone);
         
          const { data, error } = await supabase.from("leads").insert([
            {
              name: body.name,
              email: body.email,
              phone: body.phone || null,
              status: {
                name: "Arrived",
                color: "#FFA500",
              },
              company: body.company || null,
              position: body.position || null,
              contact_method: body.contact_method || "Call",
              assign_to: null,
              lead_source_id: body.source_id || null,
              work_id: req.query.workspaceId,
              user_id: user.id,
              text_area: body.text_area || "",
              is_email_valid: isValidEmail,
              is_phone_valid: isValidPhone,
              created_at: new Date().toISOString(),
            },
          ])

          if (error) {
            return res.status(400).json({ error: error.message });
          }
            
          await notifyLeadChange(
            body.name,
            "created",
            user.id,
            req.query.workspaceId as string,
            { 
              lead_name: body.name,
              lead_email: body.email
            }
          );

          return res.status(201).json({ data });
        }

        case "createManyLead": {
          const body = req.body;
          console.log(body);

          if (!Array.isArray(body) || body.length === 0) {
            return res
              .status(400)
              .json({ error: "At least one lead is required" });
          }

          const token = req.headers.authorization?.split(" ")[1];

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          const validLeads = await Promise.all(
            body.map(async (lead) => {
              if (!lead.name || !lead.email) return null;

              const isValidEmail = await validateEmail(lead.email);
              const isValidPhone = await validatePhoneNumber(lead.phone);

              return {
                name: lead.name,
                email: lead.email,
                phone: lead.phone || null,
                status: { name: "Arrived", color: "#FFA500" },
                company: lead.company || null,
                position: lead.position || null,
                contact_method: lead.contact_method || "Call",
                assign_to: null,
                lead_source_id: lead.sourceId || null,
                work_id: req.query.workspaceId,
                user_id: user.id,
                text_area: lead.text_area || "",
                is_email_valid: isValidEmail,
                is_phone_valid: isValidPhone,
                created_at: lead.createdAt
                  ? new Date(lead.createdAt).toISOString()
                  : new Date().toISOString(),
              };
            })
          );

          const filteredLeads = validLeads.filter(Boolean);

          if (filteredLeads.length === 0) {
            return res.status(400).json({ error: "No valid leads provided" });
          }

          // Insert multiple leads into Supabase
          const { data, error } = await supabase
            .from("leads")
            .insert(filteredLeads);

          if (error) {
            return res.status(400).json({ error: error.message });
          }
          
          await notifyLeadChange(
            "bulk",
            "bulk_created",
            user.id,
            req.query.workspaceId as string,
            { 
              count: filteredLeads.length,
              lead_names: filteredLeads.filter(lead => lead !== null).map(lead => lead.name)
            }
          );
          
          return res.status(201).json({ data });
        }

        case "updateNotesById": {
          const { id } = query; // Extract ID from query parameters
          const body = req.body; // Extract body payload

          if (!id) {
            return res.status(400).json({ error: "Lead ID is required" });
          }

          if (!body) {
            return res
              .status(400)
              .json({ error: "Update data is required in 'text_area' field" });
          }
          // Authenticate the user using Supabase
          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          // Update the `leads` table
          const { data, error } = await supabase
            .from("leads")
            .update({ text_area: body }) // Update the `text_area` field
            .eq("id", id); // Match the ID
          // .eq("user_id", user.id); // Ensure the user owns the record

          if (error) {
            console.error("Supabase Update Error:", error.message);
            return res.status(400).json({ error: error.message });
          }
            console.log(data)
          await notifyLeadChange(
            id as string,
            "notes_updated",
            user.id,
            req.query.workspaceId as string,
            { 
              lead_id: id,
              updated_by: user.id
            }
          );
          
          return res.status(200).json({ data });
        }
        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }

    case "PUT":
      switch (action) {
        case "updateLeadById": {
          const { id } = query;
          const body = req.body;
          console.log(body, id); // Debug to check received data

          if (!id) {
            return res.status(400).json({ error: "Lead ID is required" });
          }

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          if (!body || Object.keys(body).length === 0) {
            return res.status(400).json({ error: "Update data is required" });
          }
          
          // Get current lead data to determine changes
          const { data: currentLead, error: fetchError } = await supabase
            .from("leads")
            .select("*")
            .eq("id", id)
            .single();
            
          if (fetchError) {
            return res.status(400).json({ error: fetchError.message });
          }
          
          const updatedBody = {
            ...body, // Spread other fields dynamically
            status: body.status,
            tags: body.tags ? JSON.stringify(body.tags) : undefined, // Convert only if tags exist
          };

          const { data, error } = await supabase
            .from("leads")
            .update(updatedBody)
            .eq("id", id);

          if (error) {
            return res.status(400).json({ error: error.message });
          }
          
          // Determine what changed
          const changes: Record<string, { old: any; new: any }> = {};
          Object.keys(updatedBody).forEach(key => {
            if (JSON.stringify(currentLead[key]) !== JSON.stringify(updatedBody[key]) && updatedBody[key] !== undefined) {
              changes[key] = {
                old: currentLead[key],
                new: updatedBody[key]
              };
            }
          });
          console.log("data", data);
          
          await notifyLeadChange(
            id as string,
            "updated",
            user.id,
            req.query.workspaceId as string,
            { 
              lead_id: id,
              lead_name: currentLead.name,
              updated_by: user.id,
              changes: changes
            }
          );
          
          return res.status(200).json({ data });
        }

        case "  ": {
          const { id,workspaceId } = query;
          const body = req.body;
          if (!id) {
            return res.status(400).json({ error: "Lead ID is required" });
          }

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          if (!body) {
            return res.status(400).json({ error: "Update data is required" });
          }

          // Get current assignment for notification
          const { data: currentLead, error: fetchError } = await supabase
            .from("leads")
            .select("name, assign_to")
            .eq("id", id)
            .single();
            
          if (fetchError) {
            return res.status(400).json({ error: fetchError.message });
          }

          const { data, error } = await supabase
            .from("leads")
            .update({ assign_to: body })
            .eq("id", id);

          if (error) {
            return res.status(400).json({ error: error.message });
          }
          console.log(workspaceId);
          await notifyLeadChange(
            id as string,
            "assigned",
            user.id,
            workspaceId as string,
            { 
              lead_id: id,
              lead_name: currentLead.name,
              previous_assignee: currentLead.assign_to,
              new_assignee: body,
              assigned_by: user.id
            }
          );

          return res.status(200).json({ data });
        }
        
        case "updateLeadData": {
          const { id } = query;
          const body = req.body;
          if (!id) {
            return res.status(400).json({ error: "Lead ID is required" });
          }

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          if (!body) {
            return res.status(400).json({ error: "Update data is required" });
          }
          
          // Get current lead data to determine changes
          const { data: currentLead, error: fetchError } = await supabase
            .from("leads")
            .select("*")
            .eq("id", id)
            .single();
            
          if (fetchError) {
            return res.status(400).json({ error: fetchError.message });
          }

          const { data, error } = await supabase
            .from("leads")
            .update(body)
            .eq("id", id);

          if (error) {
            return res.status(400).json({ error: error.message });
          }
          
          // Determine what changed
          const changes: Record<string, { old: any; new: any }> = {};
          Object.keys(body).forEach(key => {
            if (JSON.stringify(currentLead[key]) !== JSON.stringify(body[key])) {
              changes[key] = {
                old: currentLead[key],
                new: body[key]
              };
            }
          });
          
          await notifyLeadChange(
            id as string,
            "data_updated",
            user.id,
            currentLead?.work_id,
            { 
              lead_id: id,
              lead_name: currentLead.name,
              updated_by: user.id,
              changes: changes
            }
          );

          return res.status(200).json({ data });
        }
        
        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }

    case "GET":
      switch (action) {
        case "getLeads": {
          const sourceId = query.sourceId as string;
          const {
            data: { user },
          } = await supabase.auth.getUser(token);
          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }
          if (!sourceId) {
            return res.status(400).json({ error: "Source ID is required" });
          }

          if (!user) {
            return res.status(400).json({ error: "User ID is required" });
          }

          const { data, error } = await supabase
            .from("leads")
            .select("*")
            .eq("source_id", sourceId);

          if (error) {
            return res.status(400).json({ error: error.message });
          }
          return res.status(200).json({ data });
        }

        case "getLeadsByUser": {
          const userId = query.userId as string;

          if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
          }

          const { data, error } = await supabase.from("leads").select("*");

          if (error) {
            return res.status(400).json({ error: error.message });
          }
          return res.status(200).json({ data });
        }

        case "getLeadsByWorkspace": {
          const workspaceId = query.workspaceId as string;
          const limit = parseInt(query.limit as string) || 12; // Default to 12 leads per page
          const offset = parseInt(query.offset as string) || 0; // Default to first page
          const sortBy = query.sortBy as string || 'created_at'; // Default sort by created_at
          const sortOrder = query.sortOrder as string || 'desc'; // Default sort order is descending
          
          const {
            data: { user },
          } = await supabase.auth.getUser(token);
          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }
          if (!workspaceId) {
            return res.status(400).json({ error: "Workspace ID is required" });
          }
          if (!user) {
            return res.status(400).json({ error: "User ID is required" });
          }

          // Get total count for pagination
          const { count, error: countError } = await supabase
            .from("leads")
            .select("*", { count: "exact", head: true })
            .eq("work_id", workspaceId);
            
          if (countError) {
            return res.status(400).json({ error: countError.message });
          }

          // Get paginated leads
          const { data, error } = await supabase
            .from("leads")
            .select("*")
            .eq("work_id", workspaceId)
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);

          if (error) {
            return res.status(400).json({ error: error.message });
          }
          
          return res.status(200).json({ 
            data,
            pagination: {
              total: count || 0,
              limit,
              offset,
              hasMore: (count || 0) > (offset + limit)
            }
          });
        }

        case "getLeadById": {
          const id = query.id as string;

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          if (!user) {
            return res.status(400).json({ error: "User ID is required" });
          }

          const { data, error } = await supabase
            .from("leads")
            .select("*")
            .eq("id", id);
            
          if (error) {
            return res.status(400).json({ error: error.message });
          }

          return res.status(200).json({ data });
        }

        case "getNotesById": {
          const id = query.id as string;
          console.log(query);

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          if (!id) {
            return res.status(400).json({ error: "Lead ID is required" });
          }

          // Fetching only the 'text_area' column from the 'leads' table
          const { data, error } = await supabase
            .from("leads")
            .select("text_area") // Select only the 'text_area' field
            .eq("id", id);

          if (error) {
            return res.status(400).json({ error: error.message });
          }

          if (!data || data.length === 0) {
            return res.status(404).json({ error: "No notes found for this lead" });
          }

          return res.status(200).json({ data });
        }
        case "getNotifications": {  
          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          const workspaceId = query.workspaceId as string;
          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }
          if (!workspaceId) {
            return res.status(400).json({ error: "Workspace ID is required" });
          }
          const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false })
          .limit(20);
          if (error) {
            return res.status(400).json({ error: error.message });
          }
          return res.status(200).json({ data });
        }

        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }
      
    case "DELETE": {
      if (action === "deleteLeads") {
        const { id, workspaceId } = req.body;

        if (!id || !Array.isArray(id) || id.length === 0) {
          return res
            .status(400)
            .json({ error: "A list of Lead IDs is required" });
        }

        if (!workspaceId) {
          return res.status(400).json({ error: "Workspace ID is required" });
        }

        // Authenticate the user
        const {
          data: { user },
        } = await supabase.auth.getUser(token);

        if (!user) {
          return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
        }

        // First check if user is workspace owner
        const { data: workspaceData, error: workspaceError } = await supabase
          .from("workspaces")
          .select("owner_id")
          .eq("id", workspaceId)
          .single();

        if (workspaceError) {
          console.error("Workspace Check Error:", workspaceError.message);
          return res.status(400).json({ error: workspaceError.message });
        }

        const isWorkspaceOwner = workspaceData?.owner_id === user.id;

        // If not workspace owner, check if user is admin
        if (!isWorkspaceOwner) {
          const { data: memberData, error: memberError } = await supabase
            .from("workspace_members")
            .select("role")
            .eq("workspace_id", workspaceId)
            .eq("user_id", user.id)
            .single();

          if (memberError) {
            console.error("Workspace Member Check Error:", memberError.message);
            return res.status(400).json({ error: memberError.message });
          }

          const isAdmin =
            memberData?.role === "admin" || memberData?.role === "SuperAdmin";

          if (!isAdmin) {
            return res.status(403).json({
              error: "Only workspace owners and admins can delete leads",
            });
          }
        }
        
        // Get lead names for notification
        const { data: leadsToDelete, error: fetchError } = await supabase
          .from("leads")
          .select("id, name")
          .in("id", id)
          .eq("work_id", workspaceId);
          
        if (fetchError) {
          console.error("Fetch leads error:", fetchError.message);
          return res.status(400).json({ error: fetchError.message });
        }
        
        // Store lead names before deletion
        const leadNames = leadsToDelete ? leadsToDelete.map(lead => lead.name) : [];
        const leadIds = leadsToDelete ? leadsToDelete.map(lead => lead.id) : [];

        // Proceed with deletion if authorized
        const { data, error } = await supabase
          .from("leads")
          .delete()
          .in("id", id)
          .eq("work_id", workspaceId);

        if (error) {
          console.error("Supabase Delete Error:", error.message);
          return res.status(400).json({ error: error.message });
        }
        
        // Create notification for deleted leads
        await notifyLeadChange(
          "multiple",
          "leads_deleted",
          user.id,
          workspaceId,
          {
            deleted_by: user.id,
            lead_count: leadIds.length,
            lead_names: leadNames,
            lead_ids: leadIds
          }
        );

        return res.status(200).json({
          message: "Leads deleted successfully",
          data,
        });
      }

      return res.status(400).json({ error: `Unknown action: ${action}` });
    }
    
    default:
      return res.status(405).json({
        error: AUTH_MESSAGES.API_ERROR,
        message: `Method ${method} is not allowed.`,
      });
  }
}
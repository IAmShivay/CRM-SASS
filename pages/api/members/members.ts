import { NextApiRequest, NextApiResponse } from "next";
import { AUTH_MESSAGES } from "@/lib/constant/auth";
import { supabase } from "../../../lib/supabaseServer";
import { sendMail } from "@/lib/sendmail";

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
        case "addMember": {
          const { workspaceId } = query;
          const { data: members } = req.body;
          const { email, role, status } = members;
          if (!workspaceId || !members) {
            return res
              .status(400)
              .json({ error: "Workspace ID and User ID are required" });
          }

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }
          const { data: existingMember, error: existingError } = await supabase
            .from("workspace_members")
            .select("*")
            .eq("workspace_id", workspaceId)
            .eq("email", email);

          if (existingMember && existingMember.length > 0) {
            return res.status(400).json({
              error: "User is already a member of this workspace",
            });
          }
          const { data: currentMember, error: memberError } = await supabase
            .from("workspace_members")
            .select("role")
            .eq("workspace_id", workspaceId)
            .eq("email", user.email)
            .single();

          if (memberError || currentMember.role === "member") {
            return res.status(403).json({
              error: "You must be a admin of this workspace to add new members",
            });
          }

          const { data, error } = await supabase
            .from("workspace_members")
            .insert({
              workspace_id: workspaceId,
              role: role,
              added_by: user?.id,
              email: email,
              status: status,
            })
            .select('*')
            .single();
          await sendMail(
            email,
            "You have been added to a workspace",
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #333; margin-bottom: 20px;">Workspace Invitation</h2>
                <p style="margin-bottom: 15px; color: #555; font-size: 16px;">You have been added to a workspace. Please click the button below to view and accept your invitation.</p>
                <p style="margin-bottom: 25px; color: #777; font-size: 14px;"><strong>Note:</strong> Your invitation expires in 2 hours.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.PUBLIC_URL}accept-invite?workspaceId=${workspaceId}&email=${email}&status=${status}" 
                     style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-align: center; font-size: 16px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none;">
                    View Invitation
                  </a>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #777; font-size: 14px;">
                  <p>If you did not expect this invitation, please ignore this email.</p>
                  <p>For any questions, please contact the workspace administrator.</p>
                </div>
              </div>
            `,
            {
              requestReadReceipt: true,
              deliveryNotification: true
            }
          );

          if (error) {
            return res.status(400).json({ error: error.message });
          }

          return res.status(200).json({ data });
        }
        case "resendInvitation": {
          const { workspaceId, email: rawEmail, status }: any = query;
          const email = rawEmail ? rawEmail.trim() : '';

          if (!workspaceId || !email) {
            return res
              .status(400)
              .json({ error: "Workspace ID and email are required" });
          }

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          // Check if sender is admin
          const { data: currentMember, error: memberError } = await supabase
            .from("workspace_members")
            .select("role")
            .eq("workspace_id", workspaceId)
            .eq("email", user.email)
            .single();

          if (memberError || currentMember.role === "member") {
            return res.status(403).json({
              error:
                "You must be an admin of this workspace to resend invitations",
            });
          }

          // Check if member exists and get their status
          const { data: existingMember, error: existingError } = await supabase
            .from("workspace_members")
            .select("status")
            .eq("workspace_id", workspaceId)
            .eq("email", email)
            .single();

          if (!existingMember) {
            return res.status(404).json({
              error: "Member not found in this workspace",
            });
          }
          // Resend the invitation email
          await sendMail(
            email,
            "You have been added to a workspace",
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #333; margin-bottom: 20px;">Workspace Invitation</h2>
                <p style="margin-bottom: 15px; color: #555; font-size: 16px;">You have been added to a workspace. Please click the button below to view and accept your invitation.</p>
                <p style="margin-bottom: 25px; color: #777; font-size: 14px;"><strong>Note:</strong> Your invitation expires in 2 hours.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.PUBLIC_URL}accept-invite?workspaceId=${workspaceId}&email=${email}&status=${status}" 
                     style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-align: center; font-size: 16px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none;">
                    View Invitation
                  </a>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #777; font-size: 14px;">
                  <p>If you did not expect this invitation, please ignore this email.</p>
                  <p>For any questions, please contact the workspace administrator.</p>
                </div>
              </div>
            `,
            {
              requestReadReceipt: true,
              deliveryNotification: true
            }
          );
          console.log(existingMember, "roka", existingError)

          return res.status(200).json({
            message: "Invitation email resent successfully",
          });
        }
        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }

    case "DELETE":
      switch (action) {
        case "removeMember": {
          const { workspaceId, id: memberId } = query;

          if (!workspaceId || !memberId) {
            return res
              .status(400)
              .json({ error: "Workspace ID and Member ID are required" });
          }

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          // First check if the user is the workspace owner
          const { data: workspace, error: workspaceError } = await supabase
            .from("workspaces")
            .select("owner_id")
            .eq("id", workspaceId)
            .single();

          if (workspaceError) {
            return res.status(400).json({ error: workspaceError.message });
          }

          // Get the role of the member being removed
          const { data: memberToRemove, error: memberError } = await supabase
            .from("workspace_members")
            .select("role")
            .eq("workspace_id", workspaceId)
            .eq("id", memberId)
            .single();

          if (memberError) {
            return res.status(400).json({ error: memberError.message });
          }

          // If user is not the owner, check their role in workspace_members
          if (workspace.owner_id !== user.id) {
            const { data: userRole, error: roleError } = await supabase
              .from("workspace_members")
              .select("role")
              .eq("workspace_id", workspaceId)
              .eq("user_id", user.id)
              .single();

            if (roleError) {
              return res.status(400).json({ error: roleError.message });
            }

            // Check if user has sufficient privileges
            if (
              !userRole ||
              (userRole.role !== "SuperAdmin" && userRole.role !== "admin")
            ) {
              return res.status(403).json({
                error:
                  "Unauthorized to remove member. Must be workspace owner, superAdmin, or admin",
              });
            }

            // If user is admin, prevent removing SuperAdmin members
            if (
              userRole.role === "admin" &&
              memberToRemove.role === "SuperAdmin"
            ) {
              return res.status(403).json({
                error: "Admins cannot remove SuperAdmin members",
              });
            }
          }

          // Prevent deletion of workspace owner
          if (workspace.owner_id === memberId) {
            return res.status(403).json({
              error: "Cannot remove workspace owner",
            });
          }

          // If all checks pass, proceed with member removal
          const { data, error } = await supabase
            .from("workspace_members")
            .delete()
            .eq("workspace_id", workspaceId)
            .eq("id", memberId);

          if (error) {
            return res.status(400).json({ error: error.message });
          }

          return res.status(200).json({ data });
        }
        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }

    case "PUT":
      switch (action) {
        case "updateMemberRole": {
          const { workspaceId, memberId } = query;
          const { role } = req.body;

          if (!workspaceId || !memberId || !role) {
            return res.status(400).json({
              error: "Workspace ID, Member ID, and role are required",
            });
          }

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          // Check if user is admin
          const { data: adminCheck } = await supabase
            .from("workspace_members")
            .select("role")
            .eq("workspace_id", workspaceId)
            .eq("user_id", user.id)
            .single();

          if (
            !adminCheck ||
            (adminCheck.role !== "admin" && adminCheck.role !== "SuperAdmin")
          ) {
            return res
              .status(403)
              .json({ error: "Only admins can update member roles" });
          }

          const { data, error } = await supabase
            .from("workspace_members")
            .update({ role })
            .eq("workspace_id", workspaceId)
            .eq("id", memberId);

          if (error) {
            return res.status(400).json({ error: error.message });
          }

          return res.status(200).json({ data });
        }

        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }

    case "GET":
      switch (action) {
        case "getWorkspaceMembers": {
          const { workspaceId } = query;
          if (!workspaceId) {
            return res.status(400).json({ error: "Workspace ID is required" });
          }

          const { data, error } = await supabase
            .from("workspace_members")
            .select()
            .eq("workspace_id", workspaceId);

          if (error) {
            return res.status(400).json({ error: error.message });
          }

          return res.status(200).json({ data });
        }

        case "getMemberRole": {
          const { workspaceId } = query;

          if (!workspaceId) {
            return res
              .status(400)
              .json({ error: "Workspace ID and User ID are required" });
          }

          const {
            data: { user },
          } = await supabase.auth.getUser(token);

          if (!user) {
            return res.status(401).json({ error: AUTH_MESSAGES.UNAUTHORIZED });
          }

          console.log("user", user);
          const { data, error } = await supabase
            .from("workspace_members")
            .select("role")
            .eq("workspace_id", workspaceId)
            .eq("user_id", user.id)
            .single();

          if (error) {
            return res.status(400).json({ error: error.message });
          }
          return res.status(200).json({ data });
        }

        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }

    default:
      return res.status(405).json({
        error: AUTH_MESSAGES.API_ERROR,
        message: `Method ${method} is not allowed.`,
      });
  }
}

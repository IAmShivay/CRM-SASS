import { NextApiRequest, NextApiResponse } from "next";
import { AUTH_MESSAGES } from "@/lib/constant/auth";
import { supabase } from "../../lib/supabaseServer";

interface AuthRequestBody {
  email?: string;
  password?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, body, query } = req;
  const action = query.action as string;

  switch (method) {
    case "POST": {
      if (!action) {
        return res.status(400).json({ error: AUTH_MESSAGES.SIGNUP_FAILED });
      }

      const { email, password }: AuthRequestBody = body;

      switch (action) {
     
        case "acceptInvite": {
          try {
            const { email, workspaceId } = query;

            if (!email || !workspaceId) {
              res
                .status(400)
                .json({ error: "Email and Workspace ID are required" });
              break;
            }

            // First check if there's a pending invitation in workspace_members
            const { data: pendingInvite, error: inviteError } = await supabase
              .from("workspace_members")
              .select("*")
              .eq("workspace_id", workspaceId)
              .eq("email", email)
              .single();

            if (inviteError) {
              console.error(
                "Error checking pending invite:",
                inviteError.message
              );
              res.status(500).json({ error: "Failed to check pending invite" });
              break;
            }

            if (!pendingInvite) {
              res.status(404).json({ error: "No pending invite found" });
              break;
            }

            // Check if the user exists and is verified in auth.users
            const { data: userData, error: userError } =
              await supabase.auth.admin.listUsers();

            if (userError) {
              console.error("Error fetching users:", userError.message);
              res.status(500).json({ error: "Failed to fetch users" });
              break;
            }

            const matchingUser = userData.users.find(
              (user) => user.email === email
            );

            if (matchingUser) {
              const { error: updateError } = await supabase
                .from("workspace_members")
                .update({
                  status: "accepted",
                  user_id: matchingUser.id,
                  name:
                    matchingUser.user_metadata?.name ||
                    matchingUser.user_metadata?.name?.first_name,
                  updated_at: new Date().toISOString(),
                })
                .eq("workspace_id", workspaceId)
                .eq("email", email);

              if (updateError) {
                console.error(
                  "Error updating workspace membership:",
                  updateError.message
                );
                res
                  .status(500)
                  .json({ error: "Failed to update workspace membership" });
                break;
              }

              // Redirect to dashboard with a success message
              res.setHeader("Location", "/dashboard?inviteAccepted=true");
              res.status(302).end();
            } else {
              // Redirect to signup with the email and workspace ID
              res.setHeader(
                "Location",
                `/signup?email=${email}&workspaceId=${workspaceId}&invitePending=true`
              );
              res.status(302).end();
            }
          } catch (error: any) {
            console.error("Unexpected error:", error.message);
            res.status(500).json({ error: "An unexpected error occurred" });
          }
          break;
        }
        case "signin": {
          if (!email || !password) {
            return res.status(400).json({ error: AUTH_MESSAGES.LOGIN_FAILED });
          }

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          console.log(data);
          if (error) {
            return res.status(400).json({ error: error.message });
          }
          await supabase.auth.setSession(data.session);

          return res
            .status(200)
            .json({ user: data.user, message: AUTH_MESSAGES.LOGIN_SUCCESS });
        }

        case "signout": {
          const { error } = await supabase.auth.signOut();

          if (error) {
            return res.status(400).json({ error: error.message });
          }

          return res
            .status(200)
            .json({ message: AUTH_MESSAGES.LOGOUT_SUCCESS });
        }
        case "verify": {
          const token = req.headers.authorization?.split("Bearer ")[1]; // Extract token

          if (!token) {
            return res
              .status(401)
              .json({ error: AUTH_MESSAGES.INVALID_LOGIN_DATA });
          }

          try {
            const { data, error } = await supabase.auth.getUser(token);

            if (error) {
              return res
                .status(401)
                .json({ error: AUTH_MESSAGES.INVALID_LOGIN_DATA });
            }

            return res.status(200).json({ user: data });
          } catch (error) {
            console.error(error);
            return res.status(500).json({ error: AUTH_MESSAGES.API_ERROR });
          }
        }
        default:
          return res.status(400).json({ error: AUTH_MESSAGES.API_ERROR });
      }
    }

    default:
      return res.status(405).json({ error: AUTH_MESSAGES.API_ERROR });
  }
}

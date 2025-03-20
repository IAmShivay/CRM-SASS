-- migrations/043_create_policy_workspace_owners_can_update_their_workspaces_on_workspaces.sql
CREATE POLICY "Workspace owners can update their workspaces" 
ON "public"."workspaces" 
FOR UPDATE TO "authenticated" 
USING (("owner_id" = "auth"."uid"()));

-- migrations/041_create_policy_workspace_owners_can_delete_their_workspaces_on_workspaces.sql
CREATE POLICY "Workspace owners can delete their workspaces" 
ON "public"."workspaces" 
FOR DELETE TO "authenticated" 
USING (("owner_id" = "auth"."uid"()));

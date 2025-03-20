-- migrations/042_create_policy_workspace_owners_can_manage_members_on_workspace_members.sql
CREATE POLICY "Workspace owners can manage members" 
ON "public"."workspace_members" 
TO "authenticated" 
USING (("workspace_id" IN ( 
    SELECT "workspaces"."id"
    FROM "public"."workspaces"
    WHERE ("workspaces"."owner_id" = "auth"."uid"()))));

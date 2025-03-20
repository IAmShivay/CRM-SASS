-- migrations/035_create_policy_users_can_view_members_of_their_workspaces_on_workspace_members.sql
CREATE POLICY "Users can view members of their workspaces" 
ON "public"."workspace_members" 
FOR SELECT TO "authenticated" 
USING ((("workspace_id" IN ( 
    SELECT "workspaces"."id"
    FROM "public"."workspaces"
    WHERE ("workspaces"."owner_id" = "auth"."uid"()))) 
    OR ("user_id" = "auth"."uid"())));

-- migrations/040_create_policy_users_can_view_workspaces_they_are_members_of_on_workspaces.sql
CREATE POLICY "Users can view workspaces they are members of" 
ON "public"."workspaces" 
FOR SELECT TO "authenticated" 
USING ((("id" IN ( 
    SELECT "workspace_members"."workspace_id"
    FROM "public"."workspace_members"
    WHERE ("workspace_members"."user_id" = "auth"."uid"()))) 
    OR ("owner_id" = "auth"."uid"())));

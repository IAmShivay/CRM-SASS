-- migrations/039_create_policy_users_can_view_webhooks_in_their_workspaces_on_webhooks.sql
CREATE POLICY "Users can view webhooks in their workspaces" 
ON "public"."webhooks" 
FOR SELECT TO "authenticated" 
USING (("workspace_id" IN ( 
    SELECT "workspace_members"."workspace_id"
    FROM "public"."workspace_members"
    WHERE ("workspace_members"."user_id" = "auth"."uid"()))));

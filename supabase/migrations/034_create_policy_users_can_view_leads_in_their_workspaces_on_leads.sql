-- migrations/034_create_policy_users_can_view_leads_in_their_workspaces_on_leads.sql
CREATE POLICY "Users can view leads in their workspaces" 
ON "public"."leads" 
FOR SELECT TO "authenticated" 
USING (("work_id" IN ( 
    SELECT "workspace_members"."workspace_id"
    FROM "public"."workspace_members"
    WHERE ("workspace_members"."user_id" = "auth"."uid"()))));

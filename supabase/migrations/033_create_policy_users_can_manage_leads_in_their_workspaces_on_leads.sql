-- migrations/033_create_policy_users_can_manage_leads_in_their_workspaces_on_leads.sql
CREATE POLICY "Users can manage leads in their workspaces" 
ON "public"."leads" 
TO "authenticated" 
USING (("work_id" IN ( 
    SELECT "workspace_members"."workspace_id"
    FROM "public"."workspace_members"
    WHERE (("workspace_members"."user_id" = "auth"."uid"()) 
    AND ("workspace_members"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"]))))));

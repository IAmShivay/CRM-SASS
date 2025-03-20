-- migrations/030_create_policy_users_can_create_workspaces_on_workspaces.sql
CREATE POLICY "Users can create workspaces" 
ON "public"."workspaces" 
FOR INSERT TO "authenticated" 
WITH CHECK (("auth"."uid"() = "owner_id"));

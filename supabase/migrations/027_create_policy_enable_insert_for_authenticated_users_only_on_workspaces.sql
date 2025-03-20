-- migrations/027_create_policy_enable_insert_for_authenticated_users_only_on_workspaces.sql
CREATE POLICY "Enable insert for authenticated users only" 
ON "public"."workspaces" 
FOR INSERT TO "dashboard_user", "authenticated", "anon" 
WITH CHECK (true);

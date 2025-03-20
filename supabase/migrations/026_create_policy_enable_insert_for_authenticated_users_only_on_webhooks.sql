-- migrations/026_create_policy_enable_insert_for_authenticated_users_only_on_webhooks.sql
CREATE POLICY "Enable insert for authenticated users only" 
ON "public"."webhooks" 
FOR INSERT TO "authenticated" 
WITH CHECK (true);

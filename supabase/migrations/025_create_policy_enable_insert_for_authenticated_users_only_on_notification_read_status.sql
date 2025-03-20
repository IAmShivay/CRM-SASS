-- migrations/025_create_policy_enable_insert_for_authenticated_users_only_on_notification_read_status.sql
CREATE POLICY "Enable insert for authenticated users only" 
ON "public"."notification_read_status" 
FOR INSERT TO "authenticated" 
WITH CHECK (true);

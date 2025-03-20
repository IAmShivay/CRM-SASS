-- migrations/028_create_policy_enable_read_access_for_all_users_on_notification_read_status.sql
CREATE POLICY "Enable read access for all users" 
ON "public"."notification_read_status" 
FOR SELECT USING (true);

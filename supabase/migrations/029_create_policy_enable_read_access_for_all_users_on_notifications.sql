-- migrations/029_create_policy_enable_read_access_for_all_users_on_notifications.sql
CREATE POLICY "Enable read access for all users" 
ON "public"."notifications" 
FOR SELECT USING (true);

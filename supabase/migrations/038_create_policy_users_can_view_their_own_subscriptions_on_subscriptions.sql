-- migrations/038_create_policy_users_can_view_their_own_subscriptions_on_subscriptions.sql
CREATE POLICY "Users can view their own subscriptions" 
ON "public"."subscriptions" 
FOR SELECT USING (("auth"."uid"() = "user_id"));

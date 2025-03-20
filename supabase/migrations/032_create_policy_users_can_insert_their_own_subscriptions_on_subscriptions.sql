-- migrations/032_create_policy_users_can_insert_their_own_subscriptions_on_subscriptions.sql
CREATE POLICY "Users can insert their own subscriptions" 
ON "public"."subscriptions" 
FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));

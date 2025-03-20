-- migrations/036_create_policy_users_can_view_their_own_payment_history_on_payment_history.sql
CREATE POLICY "Users can view their own payment history" 
ON "public"."payment_history" 
FOR SELECT USING (("auth"."uid"() = "user_id"));

-- migrations/037_create_policy_users_can_view_their_own_subscription_items_on_subscription_items.sql
CREATE POLICY "Users can view their own subscription items" 
ON "public"."subscription_items" 
FOR SELECT USING ((EXISTS ( 
    SELECT 1
    FROM "public"."subscriptions"
    WHERE (("subscriptions"."id" = "subscription_items"."subscription_id") 
    AND ("subscriptions"."user_id" = "auth"."uid"())))));

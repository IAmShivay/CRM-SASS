-- migrations/023_create_trigger_update_subscriptions_updated_at.sql
CREATE OR REPLACE TRIGGER "update_subscriptions_updated_at" 
BEFORE UPDATE ON "public"."subscriptions" 
FOR EACH ROW 
EXECUTE FUNCTION "public"."update_updated_at_column"();

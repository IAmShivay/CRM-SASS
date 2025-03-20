-- migrations/022_create_trigger_update_subscription_items_updated_at.sql
CREATE OR REPLACE TRIGGER "update_subscription_items_updated_at" 
BEFORE UPDATE ON "public"."subscription_items" 
FOR EACH ROW 
EXECUTE FUNCTION "public"."update_updated_at_column"();

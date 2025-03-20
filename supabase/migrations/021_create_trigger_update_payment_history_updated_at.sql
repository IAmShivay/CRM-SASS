-- migrations/021_create_trigger_update_payment_history_updated_at.sql
CREATE OR REPLACE TRIGGER "update_payment_history_updated_at" 
BEFORE UPDATE ON "public"."payment_history" 
FOR EACH ROW 
EXECUTE FUNCTION "public"."update_updated_at_column"();

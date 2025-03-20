-- migrations/024_create_trigger_update_updated_at_column.sql
CREATE OR REPLACE TRIGGER "update_updated_at_column" 
BEFORE UPDATE ON "public"."leads" 
FOR EACH ROW 
EXECUTE FUNCTION "public"."update_updated_at_column"();

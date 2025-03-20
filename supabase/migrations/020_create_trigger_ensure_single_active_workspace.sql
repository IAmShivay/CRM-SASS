-- migrations/020_create_trigger_ensure_single_active_workspace.sql
CREATE OR REPLACE TRIGGER "ensure_single_active_workspace" 
BEFORE INSERT OR UPDATE ON "public"."workspace_members" 
FOR EACH ROW 
EXECUTE FUNCTION "public"."check_single_active_workspace"();

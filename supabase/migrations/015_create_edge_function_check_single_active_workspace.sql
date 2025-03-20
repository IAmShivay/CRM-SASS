-- migrations/015_create_edge_function_check_single_active_workspace.sql
CREATE OR REPLACE FUNCTION "public"."check_single_active_workspace"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.is_active = true THEN
    -- Check if user already has an active workspace
    IF EXISTS (
      SELECT 1 
      FROM workspace_members 
      WHERE user_id = NEW.user_id 
      AND is_active = true 
      AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'User can only have one active workspace at a time';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
ALTER FUNCTION "public"."check_single_active_workspace"() OWNER TO "postgres";

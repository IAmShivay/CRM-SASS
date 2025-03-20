-- migrations/019_create_edge_function_get_or_set_last_active_workspace.sql
CREATE OR REPLACE FUNCTION "public"."get_or_set_last_active_workspace"("user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE 
  active_workspace bigint;
BEGIN
  -- Get the last active workspace
  SELECT workspace_id INTO active_workspace
  FROM workspace_members
  WHERE user_id = user_id AND last_active = TRUE
  LIMIT 1;

  -- If no active workspace found, set the first available one as active
  IF active_workspace IS NULL THEN
    SELECT workspace_id INTO active_workspace
    FROM workspace_members
    WHERE user_id = user_id
    ORDER BY joined_at ASC -- Assuming joined_at column exists
    LIMIT 1;

    -- Mark it as active
    IF active_workspace IS NOT NULL THEN
      PERFORM set_last_active_workspace(user_id, active_workspace);
    END IF;
  END IF;

  RETURN active_workspace;
END;
$$;
ALTER FUNCTION "public"."get_or_set_last_active_workspace"("user_id" "uuid") OWNER TO "postgres";

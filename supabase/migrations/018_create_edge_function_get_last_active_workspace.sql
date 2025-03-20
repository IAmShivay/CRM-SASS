-- migrations/018_create_edge_function_get_last_active_workspace.sql
CREATE OR REPLACE FUNCTION "public"."get_last_active_workspace"("p_user_id" "uuid") RETURNS TABLE("workspace_id" bigint, "workspace_name" "text", "user_role" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  default_workspace_id BIGINT;
BEGIN
  -- First try to get the active workspace
  IF EXISTS (
    SELECT 1 
    FROM workspace_members wm
    WHERE wm.user_id = p_user_id
    AND wm.is_active = true
  ) THEN
    RETURN QUERY
    SELECT 
      w.id as workspace_id,
      w.name as workspace_name,
      wm.role as user_role
    FROM workspace_members wm
    JOIN workspace w ON w.id = wm.workspace_id
    WHERE wm.user_id = p_user_id
    AND wm.is_active = true
    LIMIT 1;
  ELSE
    -- If no active workspace, get the first workspace (ordered by ID) and set it as active
    SELECT workspace_id INTO default_workspace_id
    FROM workspace_members
    WHERE user_id = p_user_id
    ORDER BY workspace_id
    LIMIT 1;

    -- If user has any workspace, set it as active
    IF default_workspace_id IS NOT NULL THEN
      -- Set it as active
      PERFORM set_active_workspace(p_user_id, default_workspace_id);
      
      -- Return the newly activated workspace
      RETURN QUERY
      SELECT 
        w.id as workspace_id,
        w.name as workspace_name,
        wm.role as user_role
      FROM workspace_members wm
      JOIN workspace w ON w.id = wm.workspace_id
      WHERE wm.user_id = p_user_id
      AND wm.workspace_id = default_workspace_id;
    END IF;
  END IF;
END;
$$;
ALTER FUNCTION "public"."get_last_active_workspace"("p_user_id" "uuid") OWNER TO "postgres";

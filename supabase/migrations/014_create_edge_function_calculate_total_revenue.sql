-- migrations/014_create_edge_function_calculate_total_revenue.sql
CREATE OR REPLACE FUNCTION "public"."calculate_total_revenue"("workspace_id" "text") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(CAST(revenue AS DECIMAL)), 0)
        FROM leads
        WHERE work_id = CAST(workspace_id AS BIGINT)
    );
END;
$$;
ALTER FUNCTION "public"."calculate_total_revenue"("workspace_id" "text") OWNER TO "postgres";

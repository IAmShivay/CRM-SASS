-- migrations/011_create_edge_function_calculate_conversion_metrics.sql
CREATE OR REPLACE FUNCTION "public"."calculate_conversion_metrics"("workspace_id" bigint) RETURNS TABLE("total_leads" bigint, "converted_leads" bigint, "conversion_rate" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  WITH metrics AS (
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN revenue > 0 THEN 1 END) as converted
    FROM leads
    WHERE work_id = workspace_id
  )
  SELECT 
    total as total_leads,
    converted as converted_leads,
    CASE 
      WHEN total > 0 THEN 
        ROUND((converted::NUMERIC / total::NUMERIC) * 100, 2)
      ELSE 0 
    END as conversion_rate
  FROM metrics;
END;
$$;
ALTER FUNCTION "public"."calculate_conversion_metrics"("workspace_id" bigint) OWNER TO "postgres";

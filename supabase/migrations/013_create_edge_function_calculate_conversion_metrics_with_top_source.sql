-- migrations/013_create_edge_function_calculate_conversion_metrics_with_top_source.sql
CREATE OR REPLACE FUNCTION "public"."calculate_conversion_metrics_with_top_source"("workspace_id" bigint) RETURNS TABLE("total_leads" bigint, "converted_leads" bigint, "conversion_rate" numeric, "top_source_id" "uuid", "top_source_conversions" bigint)
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
  ),
  source_metrics AS (
    SELECT 
      lead_source_id,
      COUNT(*) as converted_count
    FROM leads
    WHERE work_id = workspace_id 
    AND revenue > 0
    GROUP BY lead_source_id
    ORDER BY converted_count DESC
    LIMIT 1
  )
  SELECT 
    m.total as total_leads,
    m.converted as converted_leads,
    CASE 
      WHEN m.total > 0 THEN 
        ROUND((m.converted::NUMERIC / m.total::NUMERIC) * 100, 2)
      ELSE 0 
    END as conversion_rate,
    s.lead_source_id as top_source_id,
    COALESCE(s.converted_count, 0) as top_source_conversions
  FROM metrics m
  LEFT JOIN source_metrics s ON true;
END;
$$;
ALTER FUNCTION "public"."calculate_conversion_metrics_with_top_source"("workspace_id" bigint) OWNER TO "postgres";

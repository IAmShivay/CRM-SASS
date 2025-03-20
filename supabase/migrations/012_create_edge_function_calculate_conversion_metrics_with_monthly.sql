-- migrations/012_create_edge_function_calculate_conversion_metrics_with_monthly.sql
CREATE OR REPLACE FUNCTION "public"."calculate_conversion_metrics_with_monthly"("workspace_id" bigint) RETURNS TABLE("total_leads" bigint, "converted_leads" bigint, "conversion_rate" numeric, "top_source_id" "uuid", "top_source_conversions" bigint, "monthly_stats" "json")
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
      COUNT(*) as total_count,
      COUNT(CASE WHEN revenue > 0 THEN 1 END) as converted_count
    FROM leads
    WHERE work_id = workspace_id 
    GROUP BY lead_source_id
    ORDER BY total_count DESC  -- Changed to order by total count instead of conversions
    LIMIT 1
  ),
  monthly_data AS (
    SELECT 
      TO_CHAR(DATE_TRUNC('month', created_at), 'Month YYYY') as month,
      COUNT(*) as total_leads,
      COUNT(CASE WHEN revenue > 0 THEN 1 END) as converted_leads,
      ROUND(
        COUNT(CASE WHEN revenue > 0 THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100,
        2
      ) as monthly_conversion_rate
    FROM leads
    WHERE work_id = workspace_id
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY DATE_TRUNC('month', created_at) DESC
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
    s.converted_count as top_source_conversions,
    (
      SELECT json_agg(
        json_build_object(
          'month', md.month,
          'totalLeads', md.total_leads,
          'convertedLeads', md.converted_leads,
          'conversionRate', CONCAT(md.monthly_conversion_rate, '%')
        )
      )
      FROM monthly_data md
    ) as monthly_stats
  FROM metrics m
  LEFT JOIN source_metrics s ON true;
END;
$$;
ALTER FUNCTION "public"."calculate_conversion_metrics_with_monthly"("workspace_id" bigint) OWNER TO "postgres";



SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






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


CREATE OR REPLACE FUNCTION "public"."count_arrived_leads"() RETURNS integer
    LANGUAGE "sql" STABLE
    AS $$
    SELECT COUNT(*)::INTEGER
    FROM leads
    WHERE status->>'name' = 'Arrived';
$$;


ALTER FUNCTION "public"."count_arrived_leads"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_arrived_leads"("workspace_id" bigint) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
declare
    arrived_count integer;
begin
    select count(*)
    into arrived_count
    from leads
    where work_id = $1
    and (status->>'name')::text = 'Arrived';
    
    return arrived_count;
end;
$_$;


ALTER FUNCTION "public"."count_arrived_leads"("workspace_id" bigint) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_qualified_leads_count"("workspace_id" bigint) RETURNS TABLE("qualified_count" bigint, "status_names" "text"[])
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  WITH qualified_statuses AS (
    SELECT array_agg(name) as names
    FROM status 
    WHERE count_statistics = true
  )
  SELECT 
    COUNT(DISTINCT l.id)::BIGINT as qualified_count,
    MAX(qs.names) as status_names
  FROM leads l
  CROSS JOIN qualified_statuses qs
  WHERE l.work_id = workspace_id
  AND (l.status->>'name' = ANY(qs.names))
  GROUP BY l.work_id;
END;
$$;


ALTER FUNCTION "public"."get_qualified_leads_count"("workspace_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_qualified_leads_count"("workspace_id" "uuid") RETURNS TABLE("qualified_count" bigint, "status_names" "text"[])
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  WITH qualified_statuses AS (
    SELECT array_agg(name) as names
    FROM status 
    WHERE count_statistics = true
  )
  SELECT 
    COUNT(DISTINCT l.id)::BIGINT as qualified_count,
    MAX(qs.names) as status_names
  FROM leads l
  CROSS JOIN qualified_statuses qs
  WHERE l.work_id = workspace_id
  AND (l.status->>'name' = ANY(qs.names))
  GROUP BY l.work_id;
END;
$$;


ALTER FUNCTION "public"."get_qualified_leads_count"("workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_workspace_analytics"("p_workspace_id" bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    workspace_analytics JSONB;
BEGIN
    -- Compute analytics in a single query
    workspace_analytics := jsonb_build_object(
        'leads', jsonb_build_object(
            'total', (
                SELECT COUNT(*) 
                FROM leads 
                WHERE workspace_id = p_workspace_id
            ),
            'monthlyGrowth', (
                SELECT 
                    ROUND(
                        (COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
                                           AND created_at < date_trunc('month', CURRENT_DATE)) * 100.0) /
                        GREATEST(COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '2 months') 
                                                  AND created_at < date_trunc('month', CURRENT_DATE - INTERVAL '1 month')), 1),
                    2
                )
            ),
            'byStatus', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'status', s.name, 
                        'count', COUNT(l.id)
                    )
                )
                FROM status s
                LEFT JOIN leads l ON l.status_id = s.id AND l.workspace_id = p_workspace_id
                GROUP BY s.name
            ),
            'bySource', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'source', source, 
                        'count', COUNT(*)
                    )
                )
                FROM leads
                WHERE workspace_id = p_workspace_id
                GROUP BY source
            )
        ),
        'revenue', jsonb_build_object(
            'total', (
                SELECT COALESCE(SUM(estimated_value), 0)
                FROM leads 
                WHERE workspace_id = p_workspace_id
            ),
            'monthlyGrowth', (
                SELECT 
                    ROUND(
                        (SUM(estimated_value) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
                                                      AND created_at < date_trunc('month', CURRENT_DATE)) * 100.0) /
                        GREATEST(SUM(estimated_value) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '2 months') 
                                                              AND created_at < date_trunc('month', CURRENT_DATE - INTERVAL '1 month')), 1),
                    2
                )
                FROM leads
                WHERE workspace_id = p_workspace_id
            )
        ),
        'chartData', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'month', TO_CHAR(date_trunc('month', created_at), 'Mon'),
                    'leads', COUNT(*),
                    'revenue', SUM(estimated_value),
                    'processedLeads', COUNT(*) FILTER (WHERE status_id IN (SELECT id FROM status WHERE is_processed = true)),
                    'conversionRate', 
                        ROUND(
                            (COUNT(*) FILTER (WHERE status_id IN (SELECT id FROM status WHERE is_converted = true)) * 100.0) / 
                            GREATEST(COUNT(*), 1),
                            2
                        )
                )
            )
            FROM leads
            WHERE workspace_id = p_workspace_id 
            AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '6 months')
            GROUP BY date_trunc('month', created_at)
            ORDER BY date_trunc('month', created_at)
        )
    );

    RETURN workspace_analytics;
END;
$$;


ALTER FUNCTION "public"."get_workspace_analytics"("p_workspace_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_workspace_analytics"("p_workspace_id" integer, "p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    workspace_analytics JSONB;
BEGIN
    -- First, check if user is a member or owner of the workspace
    IF NOT EXISTS (
        SELECT 1 
        FROM workspace_members 
        WHERE workspace_id = p_workspace_id 
        AND user_id = p_user_id 
        AND (role = 'OWNER' OR role = 'MEMBER')
    ) THEN
        RETURN jsonb_build_object('error', 'Unauthorized access');
    END IF;

    -- Compute analytics in a single query
    workspace_analytics := jsonb_build_object(
        'leads', jsonb_build_object(
            'total', (
                SELECT COUNT(*) 
                FROM leads 
                WHERE workspace_id = p_workspace_id
            ),
            'monthlyGrowth', (
                SELECT 
                    ROUND(
                        (COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
                                           AND created_at < date_trunc('month', CURRENT_DATE)) * 100.0) /
                        GREATEST(COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '2 months') 
                                                  AND created_at < date_trunc('month', CURRENT_DATE - INTERVAL '1 month')), 1),
                    2
                )
            ),
            'byStatus', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'status', s.name, 
                        'count', COUNT(l.id)
                    )
                )
                FROM status s
                LEFT JOIN leads l ON l.status_id = s.id AND l.workspace_id = p_workspace_id
                GROUP BY s.name
            ),
            'bySource', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'source', source, 
                        'count', COUNT(*)
                    )
                )
                FROM leads
                WHERE workspace_id = p_workspace_id
                GROUP BY source
            )
        ),
        'revenue', jsonb_build_object(
            'total', (
                SELECT COALESCE(SUM(estimated_value), 0)
                FROM leads 
                WHERE workspace_id = p_workspace_id
            ),
            'monthlyGrowth', (
                SELECT 
                    ROUND(
                        (SUM(estimated_value) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
                                                      AND created_at < date_trunc('month', CURRENT_DATE)) * 100.0) /
                        GREATEST(SUM(estimated_value) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '2 months') 
                                                              AND created_at < date_trunc('month', CURRENT_DATE - INTERVAL '1 month')), 1),
                    2
                )
                FROM leads
                WHERE workspace_id = p_workspace_id
            )
        ),
        'chartData', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'month', TO_CHAR(date_trunc('month', created_at), 'Mon'),
                    'leads', COUNT(*),
                    'revenue', SUM(estimated_value),
                    'processedLeads', COUNT(*) FILTER (WHERE status_id IN (SELECT id FROM status WHERE is_processed = true)),
                    'conversionRate', 
                        ROUND(
                            (COUNT(*) FILTER (WHERE status_id IN (SELECT id FROM status WHERE is_converted = true)) * 100.0) / 
                            GREATEST(COUNT(*), 1),
                            2
                        )
                )
            )
            FROM leads
            WHERE workspace_id = p_workspace_id 
            AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '6 months')
            GROUP BY date_trunc('month', created_at)
            ORDER BY date_trunc('month', created_at)
        )
    );

    RETURN workspace_analytics;
END;
$$;


ALTER FUNCTION "public"."get_workspace_analytics"("p_workspace_id" integer, "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_workspace_metrics"("p_workspace_id" bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    workspace_metrics JSONB;
    total_leads BIGINT;
    total_revenue DECIMAL;
    previous_revenue DECIMAL;
    status_stats JSONB;
    source_stats JSONB;
BEGIN
    -- First verify if the workspace exists in leads table
    IF NOT EXISTS (SELECT 1 FROM leads WHERE work_id = p_workspace_id) THEN
        RETURN jsonb_build_object(
            'total_leads', 0,
            'total_revenue', 0,
            'growth', 'neutral',
            'status_distribution', '{}',
            'source_distribution', '{}'
        );
    END IF;

    -- Get total leads
    SELECT COUNT(*) INTO total_leads
    FROM leads 
    WHERE work_id = p_workspace_id;

    -- Calculate total revenue and previous revenue from leads table
    SELECT 
        COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN revenue END), 0),
        COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '60 days' 
                          AND created_at < NOW() - INTERVAL '30 days' 
                     THEN revenue END), 0)
    INTO total_revenue, previous_revenue
    FROM leads
    WHERE work_id = p_workspace_id;

    -- Get status distribution
    SELECT jsonb_object_agg(
        status->>'name',
        jsonb_build_object(
            'count', count,
            'color', status->>'color'
        )
    ) INTO status_stats
    FROM (
        SELECT status, COUNT(*) as count
        FROM leads
        WHERE work_id = p_workspace_id
        GROUP BY status
    ) s;

    -- Get source distribution
    SELECT jsonb_object_agg(source, count)
    INTO source_stats
    FROM (
        SELECT source, COUNT(*) as count
        FROM leads
        WHERE work_id = p_workspace_id
        GROUP BY source
    ) s;

    -- Build final response
    workspace_metrics := jsonb_build_object(
        'total_leads', total_leads,
        'total_revenue', total_revenue,
        'growth', CASE 
            WHEN previous_revenue = 0 THEN 'neutral'
            WHEN total_revenue > previous_revenue THEN 'positive'
            ELSE 'negative'
        END,
        'status_distribution', COALESCE(status_stats, '{}'::jsonb),
        'source_distribution', COALESCE(source_stats, '{}'::jsonb)
    );

    RETURN workspace_metrics;
END;
$$;


ALTER FUNCTION "public"."get_workspace_metrics"("p_workspace_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_active_workspace"("p_user_id" "uuid", "p_workspace_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- First, set all workspaces to inactive for this user
  UPDATE workspace_members
  SET is_active = false
  WHERE user_id = p_user_id;
  
  -- Then set the specified workspace as active
  UPDATE workspace_members
  SET is_active = true
  WHERE user_id = p_user_id
  AND workspace_id = p_workspace_id;
END;
$$;


ALTER FUNCTION "public"."set_active_workspace"("p_user_id" "uuid", "p_workspace_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_last_active_workspace"("user_id" "uuid", "workspace_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Set all workspaces of the user to inactive
  UPDATE workspace_members 
  SET last_active = FALSE 
  WHERE user_id = user_id;

  -- Activate only the selected workspace
  UPDATE workspace_members 
  SET last_active = TRUE 
  WHERE user_id = user_id AND workspace_id = workspace_id;
END;
$$;


ALTER FUNCTION "public"."set_last_active_workspace"("user_id" "uuid", "workspace_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_last_active_workspace"("user_id" "uuid", "workspace_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Set all workspaces of the user to inactive
  UPDATE workspace_members 
  SET last_active = FALSE 
  WHERE user_id = user_id;

  -- Activate only the selected workspace
  UPDATE workspace_members 
  SET last_active = TRUE 
  WHERE user_id = user_id AND workspace_id = workspace_id;
END;
$$;


ALTER FUNCTION "public"."set_last_active_workspace"("user_id" "uuid", "workspace_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "name" "text",
    "email" "text",
    "phone" "text",
    "custom_data" "jsonb",
    "work_id" bigint,
    "lead_source_id" "uuid",
    "text_area" "jsonb",
    "source" "text",
    "contact_method" "text",
    "message" "text",
    "status" "json",
    "company" "text",
    "position" "text",
    "revenue" numeric,
    "assign_to" "jsonb",
    "is_email_valid" boolean,
    "is_phone_valid" boolean
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


ALTER TABLE "public"."leads" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."leads_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."status" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "color" "text",
    "work_id" bigint,
    "user_id" "uuid",
    "workspace_show" boolean,
    "count_statistics" boolean
);


ALTER TABLE "public"."status" OWNER TO "postgres";


ALTER TABLE "public"."status" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."status_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."webhooks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "webhook_url" "text",
    "status" boolean,
    "name" "text",
    "description" "text",
    "type" "text",
    "workspace_id" bigint
);


ALTER TABLE "public"."webhooks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_members" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "workspace_id" bigint,
    "user_id" "uuid",
    "role" "text",
    "status" "text",
    "profile_image" "jsonb",
    "added_by" "uuid",
    "email" "text",
    "last_active" boolean,
    "name" "text",
    "updated_at" timestamp without time zone,
    "is_active" boolean DEFAULT false
);


ALTER TABLE "public"."workspace_members" OWNER TO "postgres";


ALTER TABLE "public"."workspace_members" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."workspace_members_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."workspaces" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "owner_id" "uuid" DEFAULT "gen_random_uuid"(),
    "company_type" "text",
    "status" boolean,
    "profile_url" "text",
    "company_size" "text",
    "industry" "text",
    "timezone" "text",
    "notifications" "jsonb",
    "lead_status" "jsonb",
    "members" "jsonb",
    "security" "jsonb"
);


ALTER TABLE "public"."workspaces" OWNER TO "postgres";


ALTER TABLE "public"."workspaces" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."workspaces_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."status"
    ADD CONSTRAINT "status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhooks"
    ADD CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "ensure_single_active_workspace" BEFORE INSERT OR UPDATE ON "public"."workspace_members" FOR EACH ROW EXECUTE FUNCTION "public"."check_single_active_workspace"();



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "public"."workspaces"("id");



ALTER TABLE ONLY "public"."status"
    ADD CONSTRAINT "status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."status"
    ADD CONSTRAINT "status_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "public"."workspaces"("id");



ALTER TABLE ONLY "public"."webhooks"
    ADD CONSTRAINT "webhooks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."webhooks"
    ADD CONSTRAINT "webhooks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Enable insert for authenticated users only" ON "public"."webhooks" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."workspaces" FOR INSERT TO "dashboard_user", "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Users can create workspaces" ON "public"."workspaces" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users can manage leads in their workspaces" ON "public"."leads" TO "authenticated" USING (("work_id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE (("workspace_members"."user_id" = "auth"."uid"()) AND ("workspace_members"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"]))))));



CREATE POLICY "Users can manage webhooks in their workspaces" ON "public"."webhooks" TO "authenticated" USING (("workspace_id" IN ( SELECT "workspaces"."id"
   FROM "public"."workspaces"
  WHERE ("workspaces"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Users can view leads in their workspaces" ON "public"."leads" FOR SELECT TO "authenticated" USING (("work_id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view members of their workspaces" ON "public"."workspace_members" FOR SELECT TO "authenticated" USING ((("workspace_id" IN ( SELECT "workspaces"."id"
   FROM "public"."workspaces"
  WHERE ("workspaces"."owner_id" = "auth"."uid"()))) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can view webhooks in their workspaces" ON "public"."webhooks" FOR SELECT TO "authenticated" USING (("workspace_id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view workspaces they are members of" ON "public"."workspaces" FOR SELECT TO "authenticated" USING ((("id" IN ( SELECT "workspace_members"."workspace_id"
   FROM "public"."workspace_members"
  WHERE ("workspace_members"."user_id" = "auth"."uid"()))) OR ("owner_id" = "auth"."uid"())));



CREATE POLICY "Workspace owners can delete their workspaces" ON "public"."workspaces" FOR DELETE TO "authenticated" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "Workspace owners can manage members" ON "public"."workspace_members" TO "authenticated" USING (("workspace_id" IN ( SELECT "workspaces"."id"
   FROM "public"."workspaces"
  WHERE ("workspaces"."owner_id" = "auth"."uid"()))));



CREATE POLICY "Workspace owners can update their workspaces" ON "public"."workspaces" FOR UPDATE TO "authenticated" USING (("owner_id" = "auth"."uid"()));



ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhooks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspace_members" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."leads";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."webhooks";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."calculate_conversion_metrics"("workspace_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_conversion_metrics"("workspace_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_conversion_metrics"("workspace_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_conversion_metrics_with_monthly"("workspace_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_conversion_metrics_with_monthly"("workspace_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_conversion_metrics_with_monthly"("workspace_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_conversion_metrics_with_top_source"("workspace_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_conversion_metrics_with_top_source"("workspace_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_conversion_metrics_with_top_source"("workspace_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_total_revenue"("workspace_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_total_revenue"("workspace_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_total_revenue"("workspace_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_single_active_workspace"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_single_active_workspace"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_single_active_workspace"() TO "service_role";



GRANT ALL ON FUNCTION "public"."count_arrived_leads"() TO "anon";
GRANT ALL ON FUNCTION "public"."count_arrived_leads"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_arrived_leads"() TO "service_role";



GRANT ALL ON FUNCTION "public"."count_arrived_leads"("workspace_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."count_arrived_leads"("workspace_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_arrived_leads"("workspace_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_last_active_workspace"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_last_active_workspace"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_last_active_workspace"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_set_last_active_workspace"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_set_last_active_workspace"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_set_last_active_workspace"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_qualified_leads_count"("workspace_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_qualified_leads_count"("workspace_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_qualified_leads_count"("workspace_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_qualified_leads_count"("workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_qualified_leads_count"("workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_qualified_leads_count"("workspace_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_workspace_analytics"("p_workspace_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_workspace_analytics"("p_workspace_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_workspace_analytics"("p_workspace_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_workspace_analytics"("p_workspace_id" integer, "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_workspace_analytics"("p_workspace_id" integer, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_workspace_analytics"("p_workspace_id" integer, "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_workspace_metrics"("p_workspace_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_workspace_metrics"("p_workspace_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_workspace_metrics"("p_workspace_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_active_workspace"("p_user_id" "uuid", "p_workspace_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."set_active_workspace"("p_user_id" "uuid", "p_workspace_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_active_workspace"("p_user_id" "uuid", "p_workspace_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_last_active_workspace"("user_id" "uuid", "workspace_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."set_last_active_workspace"("user_id" "uuid", "workspace_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_last_active_workspace"("user_id" "uuid", "workspace_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_last_active_workspace"("user_id" "uuid", "workspace_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."set_last_active_workspace"("user_id" "uuid", "workspace_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_last_active_workspace"("user_id" "uuid", "workspace_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON SEQUENCE "public"."leads_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."leads_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."leads_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."status" TO "anon";
GRANT ALL ON TABLE "public"."status" TO "authenticated";
GRANT ALL ON TABLE "public"."status" TO "service_role";



GRANT ALL ON SEQUENCE "public"."status_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."status_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."status_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."webhooks" TO "anon";
GRANT ALL ON TABLE "public"."webhooks" TO "authenticated";
GRANT ALL ON TABLE "public"."webhooks" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_members" TO "anon";
GRANT ALL ON TABLE "public"."workspace_members" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_members" TO "service_role";



GRANT ALL ON SEQUENCE "public"."workspace_members_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."workspace_members_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."workspace_members_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."workspaces" TO "anon";
GRANT ALL ON TABLE "public"."workspaces" TO "authenticated";
GRANT ALL ON TABLE "public"."workspaces" TO "service_role";



GRANT ALL ON SEQUENCE "public"."workspaces_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."workspaces_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."workspaces_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;

-- migrations/016_create_edge_function_count_arrived_leads.sql
CREATE OR REPLACE FUNCTION "public"."count_arrived_leads"() RETURNS integer
    LANGUAGE "sql" STABLE
    AS $$
    SELECT COUNT(*)::INTEGER
    FROM leads
    WHERE status->>'name' = 'Arrived';
$$;
ALTER FUNCTION "public"."count_arrived_leads"() OWNER TO "postgres";

-- migrations/017_create_edge_function_count_arrived_leads_workspace.sql
CREATE OR REPLACE FUNCTION "public"."count_arrived_leads"("workspace_id" bigint) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;
ALTER FUNCTION "public"."count_arrived_leads"("workspace_id" bigint) OWNER TO "postgres";

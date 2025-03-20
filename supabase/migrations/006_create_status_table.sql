-- migrations/006_create_status_table.sql
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
ALTER TABLE ONLY "public"."status"
    ADD CONSTRAINT "status_pkey" PRIMARY KEY ("id");

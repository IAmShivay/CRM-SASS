-- migrations/005_create_notifications_table.sql
CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lead_id" "text",
    "action_type" "text",
    "user_id" "uuid" DEFAULT "gen_random_uuid"(),
    "workspace_id" "text",
    "details" "jsonb",
    "read" boolean,
    "lead_source_id" "uuid" DEFAULT "gen_random_uuid"(),
    "related_user_id" "uuid" DEFAULT "auth"."uid"()
);
ALTER TABLE "public"."notifications" OWNER TO "postgres";
ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");


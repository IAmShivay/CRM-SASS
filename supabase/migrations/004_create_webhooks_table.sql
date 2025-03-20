-- migrations/004_create_webhooks_table.sql
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
ALTER TABLE ONLY "public"."webhooks"
    ADD CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id");

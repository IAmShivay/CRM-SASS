drop policy "Enable insert for authenticated users only" on "public"."workspaces";

alter table "public"."leads" add column "businessInfo" text;

alter table "public"."leads" add column "tag" text;

create policy "Enable insert for authenticated users only"
on "public"."workspaces"
as permissive
for insert
to authenticated, dashboard_user, anon
with check (true);




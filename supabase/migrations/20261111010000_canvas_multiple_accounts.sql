-- Adds separately managed Canvas connections while keeping each user's existing
-- imported tasks and saved selections attached to their original connection.
begin;

create table if not exists public."CanvasAccounts" (
  "CanvasAccountID" uuid primary key default gen_random_uuid(),
  "AuthUserID" uuid not null references auth.users(id) on delete cascade,
  "Label" text not null check (char_length(btrim("Label")) between 1 and 50),
  "HostName" text,
  "FeedURL" text,
  "IsConnected" boolean not null default true,
  "ConnectedAt" timestamptz,
  "LastSyncedAt" timestamptz,
  "LastSyncError" text,
  "CreatedAt" timestamptz not null default now()
);

create unique index if not exists "CanvasAccounts_user_label_ci_key"
  on public."CanvasAccounts" ("AuthUserID", lower("Label"));
create index if not exists "CanvasAccounts_user_created_idx"
  on public."CanvasAccounts" ("AuthUserID", "CreatedAt");

alter table public."CanvasAccounts" enable row level security;
revoke all on public."CanvasAccounts" from anon, authenticated;

-- Create one account record for every user with an existing connection, import
-- mapping, or saved choice. Disconnected legacy imports remain recoverable.
with owners as (
  select "AuthUserID" from public."CanvasCalendarFeeds"
  union
  select "AuthUserID" from public."CanvasImportedTasks"
  union
  select "AuthUserID" from public."CanvasSelections"
), feeds as (
  select "AuthUserID", "FeedURL", "ConnectedAt", "LastSyncedAt", "LastSyncError",
    lower(regexp_replace(split_part(split_part("FeedURL", '://', 2), '/', 1), ':\d+$', '')) as host
  from public."CanvasCalendarFeeds"
), prepared as (
  select owners."AuthUserID", feeds."FeedURL", feeds."ConnectedAt", feeds."LastSyncedAt",
    feeds."LastSyncError", feeds.host,
    case
      when feeds.host is null then 'Canvas (disconnected)'
      when split_part(feeds.host, '.', 1) in ('www', 'canvas', 'learn')
        then coalesce(nullif(split_part(feeds.host, '.', 2), ''), split_part(feeds.host, '.', 1))
      else split_part(feeds.host, '.', 1)
    end as default_label
  from owners left join feeds using ("AuthUserID")
)
insert into public."CanvasAccounts"
  ("AuthUserID", "Label", "HostName", "FeedURL", "IsConnected", "ConnectedAt", "LastSyncedAt", "LastSyncError")
select "AuthUserID", left(default_label, 50), host, "FeedURL", ("FeedURL" is not null),
  "ConnectedAt", "LastSyncedAt", "LastSyncError"
from prepared
on conflict do nothing;

alter table public."CanvasImportedTasks"
  add column if not exists "CanvasAccountID" uuid;
alter table public."CanvasSelections"
  add column if not exists "CanvasAccountID" uuid;

update public."CanvasImportedTasks" m
set "CanvasAccountID" = a."CanvasAccountID"
from public."CanvasAccounts" a
where a."AuthUserID" = m."AuthUserID"
  and m."CanvasAccountID" is null;

update public."CanvasSelections" s
set "CanvasAccountID" = a."CanvasAccountID"
from public."CanvasAccounts" a
where a."AuthUserID" = s."AuthUserID"
  and s."CanvasAccountID" is null;

alter table public."CanvasImportedTasks"
  alter column "CanvasAccountID" set not null;
alter table public."CanvasSelections"
  alter column "CanvasAccountID" set not null;

alter table public."CanvasImportedTasks"
  drop constraint if exists "CanvasImportedTasks_AuthUserID_CanvasUID_key";
alter table public."CanvasSelections"
  drop constraint if exists "CanvasSelections_AuthUserID_CanvasUID_key";

alter table public."CanvasImportedTasks"
  add constraint "CanvasImportedTasks_account_uid_key"
  unique ("CanvasAccountID", "CanvasUID");
alter table public."CanvasSelections"
  add constraint "CanvasSelections_account_uid_key"
  unique ("CanvasAccountID", "CanvasUID");

alter table public."CanvasImportedTasks"
  add constraint "CanvasImportedTasks_account_fk"
  foreign key ("CanvasAccountID") references public."CanvasAccounts"("CanvasAccountID") on delete cascade;
alter table public."CanvasSelections"
  add constraint "CanvasSelections_account_fk"
  foreign key ("CanvasAccountID") references public."CanvasAccounts"("CanvasAccountID") on delete cascade;

create index if not exists "CanvasImportedTasks_account_idx"
  on public."CanvasImportedTasks" ("AuthUserID", "CanvasAccountID");
create index if not exists "CanvasSelections_account_idx"
  on public."CanvasSelections" ("AuthUserID", "CanvasAccountID");

-- The feed URL now lives only on its account record.
delete from public."CanvasCalendarFeeds";

-- Permanently remove one connection and only tasks mapped to that connection.
-- The Edge Function verifies ownership before calling this service-role RPC.
create or replace function public.coursewise_remove_canvas_account(
  p_auth_user_id uuid,
  p_canvas_account_id uuid
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id text;
  v_deleted integer := 0;
  v_account_deleted integer := 0;
  v_task_ids text[];
begin
  select u."UserID"::text into v_user_id
  from public."User" u
  where u."AuthUserID" = p_auth_user_id;

  if v_user_id is null then
    raise exception 'Coursewise user profile not found';
  end if;

  select coalesce(array_agg(distinct m."TaskID"::text), array[]::text[])
    into v_task_ids
  from public."CanvasImportedTasks" m
  where m."AuthUserID" = p_auth_user_id
    and m."CanvasAccountID" = p_canvas_account_id;

  delete from public."CanvasSelections"
  where "AuthUserID" = p_auth_user_id
    and "CanvasAccountID" = p_canvas_account_id;
  delete from public."CanvasImportedTasks"
  where "AuthUserID" = p_auth_user_id
    and "CanvasAccountID" = p_canvas_account_id;
  delete from public."CanvasAccounts"
  where "AuthUserID" = p_auth_user_id
    and "CanvasAccountID" = p_canvas_account_id;
  get diagnostics v_account_deleted = row_count;

  if v_account_deleted = 0 then
    raise exception 'Canvas connection not found';
  end if;

  delete from public."Tasks" t
  where t."TaskID"::text = any(v_task_ids)
    and t."UserID"::text = v_user_id
    and t."IsAssignment" is true;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;
revoke all on function public.coursewise_remove_canvas_account(uuid, uuid) from public, anon, authenticated;
grant execute on function public.coursewise_remove_canvas_account(uuid, uuid) to service_role;

notify pgrst, 'reload schema';
commit;

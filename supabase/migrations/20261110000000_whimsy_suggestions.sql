-- Run once in the Supabase SQL Editor before deploying the Whimsy suggestion box.
begin;

create table if not exists public.coursewise_whimsy_suggestions (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  suggestion text not null check (char_length(btrim(suggestion)) between 3 and 300),
  created_at timestamptz not null default now()
);

create index if not exists coursewise_whimsy_suggestions_created_idx
  on public.coursewise_whimsy_suggestions (created_at desc);
create index if not exists coursewise_whimsy_suggestions_user_idx
  on public.coursewise_whimsy_suggestions (auth_user_id, created_at desc);

alter table public.coursewise_whimsy_suggestions enable row level security;
revoke all on public.coursewise_whimsy_suggestions from anon, authenticated;
grant select, insert on public.coursewise_whimsy_suggestions to authenticated;

-- Counts the signed-in member's ideas from the last 24 hours. It runs as the table owner so the
-- insert policy below can use it without referencing its own table (which Postgres rejects with
-- "infinite recursion detected in policy").
create or replace function public.coursewise_whimsy_recent_count() returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::integer from public.coursewise_whimsy_suggestions
  where auth_user_id = auth.uid() and created_at > now() - interval '24 hours';
$$;
revoke all on function public.coursewise_whimsy_recent_count() from public, anon;
grant execute on function public.coursewise_whimsy_recent_count() to authenticated;

-- Members can send ideas as themselves, up to 10 per rolling 24 hours,
-- and can read back only their own.
drop policy if exists "Send own whimsy suggestions" on public.coursewise_whimsy_suggestions;
create policy "Send own whimsy suggestions" on public.coursewise_whimsy_suggestions
  for insert to authenticated
  with check (
    auth_user_id = (select auth.uid())
    and (select public.coursewise_whimsy_recent_count()) < 10
  );

drop policy if exists "Read own whimsy suggestions" on public.coursewise_whimsy_suggestions;
create policy "Read own whimsy suggestions" on public.coursewise_whimsy_suggestions
  for select to authenticated
  using (auth_user_id = (select auth.uid()));

-- Admins (see admin-setup.sql) can read every suggestion.
do $$
begin
  if to_regprocedure('public.coursewise_is_admin()') is not null then
    drop policy if exists "Admins read whimsy suggestions" on public.coursewise_whimsy_suggestions;
    create policy "Admins read whimsy suggestions" on public.coursewise_whimsy_suggestions
      for select to authenticated
      using ((select public.coursewise_is_admin()));
  end if;
end $$;

-- Make the API see the new table and function right away.
notify pgrst, 'reload schema';

commit;

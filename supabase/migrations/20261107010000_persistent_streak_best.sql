-- Run in Supabase SQL Editor after the existing streak migration.
-- Keeps the best observed streak even after completed tasks are deleted.
begin;
create table if not exists public.coursewise_streak_records (
  user_id text primary key,
  longest integer not null default 0 check (longest >= 0)
);
alter table public.coursewise_streak_records enable row level security;
revoke all on public.coursewise_streak_records from public, anon, authenticated;

create or replace function public.coursewise_remember_streak(p_user text)
returns void language sql volatile security definer set search_path = '' as $fn$
  insert into public.coursewise_streak_records as records (user_id, longest)
  select p_user, coalesce(max(n), 0)::integer from (
    select count(*) as n from (
      select d, d - (row_number() over (order by d))::integer as g from (
        select distinct (completed_at at time zone 'America/Denver')::date as d
        from public.coursewise_completion_times where user_id = p_user
      ) days
    ) grouped group by g
  ) runs
  on conflict (user_id) do update set longest = greatest(records.longest, excluded.longest);
$fn$;
revoke all on function public.coursewise_remember_streak(text) from public, anon, authenticated;

create or replace function public.coursewise_preserve_streak_trigger()
returns trigger language plpgsql security definer set search_path = '' as $fn$
begin
  if TG_OP = 'DELETE' then
    perform public.coursewise_remember_streak(OLD.user_id);
    return OLD;
  elsif TG_OP = 'UPDATE' and TG_WHEN = 'BEFORE' then
    perform public.coursewise_remember_streak(OLD.user_id);
    return NEW;
  end if;
  perform public.coursewise_remember_streak(NEW.user_id);
  return NEW;
end;
$fn$;
revoke all on function public.coursewise_preserve_streak_trigger() from public, anon, authenticated;
drop trigger if exists coursewise_preserve_streak_before on public.coursewise_completion_times;
create trigger coursewise_preserve_streak_before before delete or update
on public.coursewise_completion_times for each row execute function public.coursewise_preserve_streak_trigger();
drop trigger if exists coursewise_preserve_streak_after on public.coursewise_completion_times;
create trigger coursewise_preserve_streak_after after insert or update
on public.coursewise_completion_times for each row execute function public.coursewise_preserve_streak_trigger();

-- Seed only from real completion history still available. Do not invent dates.
select public.coursewise_remember_streak(user_id)
from (select distinct user_id from public.coursewise_completion_times) users;

create or replace function public.coursewise_streak_for(p_user text)
returns jsonb language sql stable security definer set search_path = '' as $fn$
  with today as (
    select (now() at time zone 'America/Denver')::date as d
  ), days as (
    select distinct (completed_at at time zone 'America/Denver')::date as d
    from public.coursewise_completion_times where user_id = p_user
  ), grp as (
    select d, d - (row_number() over (order by d))::int as g from days
  ), runs as (
    select max(d) as end_d, count(*)::int as len from grp group by g
  )
  select jsonb_build_object(
    'current', coalesce((select r.len from runs r, today t
      where r.end_d >= t.d - 1 order by r.end_d desc limit 1), 0),
    'longest', greatest(coalesce((select max(len) from runs), 0),
      coalesce((select longest from public.coursewise_streak_records where user_id = p_user), 0)),
    'done_today', exists(select 1 from days, today where days.d = today.d)
  );
$fn$;
revoke all on function public.coursewise_streak_for(text) from public, anon, authenticated;

-- Delete the retained statistic when the account itself is deleted.
create or replace function public.coursewise_delete_streak_record()
returns trigger language plpgsql security definer set search_path = '' as $fn$
begin
  delete from public.coursewise_streak_records where user_id = OLD."UserID"::text;
  return OLD;
end;
$fn$;
revoke all on function public.coursewise_delete_streak_record() from public, anon, authenticated;
drop trigger if exists coursewise_delete_streak_record on public."User";
create trigger coursewise_delete_streak_record after delete on public."User"
for each row execute function public.coursewise_delete_streak_record();
commit;

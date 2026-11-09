-- Run once in the Supabase SQL Editor before deploying calendar events.
begin;

create table if not exists public.coursewise_calendar_events (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  event_date date not null,
  event_time time,
  end_time time,
  constraint coursewise_calendar_events_time_range check (
    end_time is null or (event_time is not null and end_time > event_time)
  ),
  category_id text,
  repeat_rule jsonb,
  created_at timestamptz not null default now()
);

create index if not exists coursewise_calendar_events_user_date_idx
  on public.coursewise_calendar_events (auth_user_id, event_date, event_time);

alter table public.coursewise_calendar_events enable row level security;
revoke all on public.coursewise_calendar_events from anon;
grant select, insert, update, delete on public.coursewise_calendar_events to authenticated;

drop policy if exists "Manage own calendar events" on public.coursewise_calendar_events;
create policy "Manage own calendar events" on public.coursewise_calendar_events
  for all to authenticated
  using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

commit;

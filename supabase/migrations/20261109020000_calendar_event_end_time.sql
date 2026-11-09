-- Run once in the Supabase SQL Editor to enable event end times.
alter table public.coursewise_calendar_events
  add column if not exists end_time time;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'coursewise_calendar_events_time_range'
      and conrelid = 'public.coursewise_calendar_events'::regclass
  ) then
    alter table public.coursewise_calendar_events
      add constraint coursewise_calendar_events_time_range
      check (end_time is null or (event_time is not null and end_time > event_time));
  end if;
end;
$$;

-- Run once in the Supabase SQL Editor to enable recurring calendar events.
alter table public.coursewise_calendar_events
  add column if not exists repeat_rule jsonb;

-- Run once in the Supabase SQL Editor for the same project as Coursewise.
-- Saves each account's 12-hour / 24-hour ("military") time preference.
begin;
alter table public."Settings" add column if not exists "TimeFormat" text not null default '12';
alter table public."Settings" drop constraint if exists settings_timeformat_check;
alter table public."Settings" add constraint settings_timeformat_check check ("TimeFormat" in ('12', '24'));
commit;

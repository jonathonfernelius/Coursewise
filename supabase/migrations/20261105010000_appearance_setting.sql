-- Run once in the Supabase SQL Editor for the same project as Coursewise.
-- Saves each account's light/dark choice next to its accent color.
-- NULL means "never chosen": the site adopts the device's current mode the first time and saves it.
begin;
alter table public."Settings" add column if not exists "Appearance" text;
alter table public."Settings" drop constraint if exists settings_appearance_check;
alter table public."Settings" add constraint settings_appearance_check
  check ("Appearance" is null or "Appearance" in ('light', 'dark'));
commit;

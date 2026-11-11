-- Run once in the Supabase SQL Editor for the same project as Coursewise.
-- Remembers when each account finished or closed the getting-started guide on Today.
-- NULL means the guide still shows. Accounts that exist when this runs are marked done,
-- so only new sign-ups see it. The site keeps working before this runs (it falls back to
-- showing the guide only to empty accounts, remembered per device).
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'Settings' and column_name = 'IntroDoneAt'
  ) then
    alter table public."Settings" add column "IntroDoneAt" timestamptz;
    update public."Settings" set "IntroDoneAt" = now();
  end if;
end $$;

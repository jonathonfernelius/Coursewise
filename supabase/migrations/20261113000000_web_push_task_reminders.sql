-- Per-device web push subscriptions. The endpoint and encryption keys are credentials,
-- so users can only access subscriptions associated with their own Supabase Auth ID.
create table if not exists public.coursewise_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null check (jsonb_typeof(subscription) = 'object'),
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Created before the save function below, which clears a former owner's delivery
-- records when the same browser endpoint is attached to another account.
create table if not exists public.coursewise_task_reminder_deliveries (
  id bigint generated always as identity primary key,
  task_id text not null,
  due_at timestamptz not null,
  subscription_id uuid not null references public.coursewise_push_subscriptions(id) on delete cascade,
  sent_at timestamptz not null default now(),
  unique (task_id, due_at, subscription_id)
);

create index if not exists coursewise_push_subscriptions_user_idx
  on public.coursewise_push_subscriptions (auth_user_id);

alter table public.coursewise_push_subscriptions enable row level security;

drop policy if exists "Users manage their own push subscriptions" on public.coursewise_push_subscriptions;
create policy "Users read their own push subscriptions"
  on public.coursewise_push_subscriptions
  for select
  using (auth.uid() = auth_user_id);

create policy "Users remove their own push subscriptions"
  on public.coursewise_push_subscriptions
  for delete
  using (auth.uid() = auth_user_id);

revoke all on public.coursewise_push_subscriptions from anon, authenticated;
grant select, delete on public.coursewise_push_subscriptions to authenticated;

-- A browser push endpoint can move to a different signed-in Coursewise account
-- on the same device. This narrowly scoped function reassigns only the caller's
-- supplied endpoint; users still cannot read another account's subscriptions.
create or replace function public.coursewise_save_push_subscription(
  p_endpoint text,
  p_subscription jsonb,
  p_timezone text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to enable notifications.';
  end if;
  if p_endpoint is null or p_endpoint !~ '^https://' or
     jsonb_typeof(p_subscription) is distinct from 'object' or
     p_subscription ->> 'endpoint' is distinct from p_endpoint or
     jsonb_typeof(p_subscription -> 'keys') is distinct from 'object' then
    raise exception 'Invalid browser notification subscription.';
  end if;

  delete from public.coursewise_task_reminder_deliveries d
  using public.coursewise_push_subscriptions s
  where d.subscription_id = s.id
    and s.endpoint = p_endpoint
    and s.auth_user_id <> auth.uid();

  insert into public.coursewise_push_subscriptions
    (auth_user_id, endpoint, subscription, timezone, updated_at)
  values
    (auth.uid(), p_endpoint, p_subscription, coalesce(nullif(p_timezone, ''), 'UTC'), now())
  on conflict (endpoint) do update set
    auth_user_id = excluded.auth_user_id,
    subscription = excluded.subscription,
    timezone = excluded.timezone,
    updated_at = now();
end;
$$;

revoke all on function public.coursewise_save_push_subscription(text, jsonb, text) from public, anon;
grant execute on function public.coursewise_save_push_subscription(text, jsonb, text) to authenticated;

-- A delivery record is tracked per task due date and device so repeated scheduler
-- runs do not send duplicates, while each of a user's devices still receives one.
create index if not exists coursewise_task_reminder_deliveries_sent_idx
  on public.coursewise_task_reminder_deliveries (sent_at);

alter table public.coursewise_task_reminder_deliveries enable row level security;
revoke all on public.coursewise_task_reminder_deliveries from anon, authenticated;

create index if not exists tasks_pending_reminder_idx
  on public."Tasks" ("UserID", "TaskDueDate")
  where "Reminder" is not null and "IsComplete" = false;

-- Clear any legacy reminder preferences that no longer have a due date, then
-- make the same invariant true for writes from any app version or import path.
update public."Tasks"
set "Reminder" = null
where "TaskDueDate" is null and "Reminder" is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public."Tasks"'::regclass
      and conname = 'Tasks_Reminder_requires_due_date'
  ) then
    alter table public."Tasks"
      add constraint "Tasks_Reminder_requires_due_date"
      check ("Reminder" is null or "TaskDueDate" is not null);
  end if;
end;
$$;

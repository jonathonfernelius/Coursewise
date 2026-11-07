-- Record when a task is created so lists can sort by recently added.
alter table public."Tasks"
  add column if not exists "CreatedAt" timestamptz not null default now();

create index if not exists tasks_user_created_at_idx
  on public."Tasks" ("UserID", "CreatedAt");

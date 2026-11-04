-- Streaks, Utah-time days, and friend cheers that reset at Utah midnight.
-- Run once in the Supabase SQL Editor.
--
-- Builds on the existing coursewise_completion_times table, which the
-- coursewise_track_completion trigger on "Tasks" already keeps in sync:
-- a row is added when a task is checked and removed when it is unchecked or
-- deleted. Because streaks are computed from that table every time they are
-- requested, un-checking a task recomputes the streak automatically.
--
-- A streak day is any Utah-time (America/Denver) calendar day with at least
-- one completed task. The current streak survives until the end of today if
-- nothing has been finished yet, and breaks once a full day passes with none.

begin;

create index if not exists coursewise_completion_times_user_time_idx
  on public.coursewise_completion_times (user_id, completed_at);

-- Internal helper: streak numbers for any user id. Not callable from the app.
create or replace function public.coursewise_streak_for(p_user text)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $fn$
  with today as (
    select (now() at time zone 'America/Denver')::date as d
  ), days as (
    select distinct (completed_at at time zone 'America/Denver')::date as d
    from public.coursewise_completion_times
    where user_id = p_user
  ), grp as (
    -- Consecutive days share the same (date - row number) value.
    select d, d - (row_number() over (order by d))::int as g from days
  ), runs as (
    select max(d) as end_d, count(*)::int as len from grp group by g
  )
  select jsonb_build_object(
    'current', coalesce((
      select r.len from runs r, today t
      where r.end_d >= t.d - 1
      order by r.end_d desc limit 1), 0),
    'longest', coalesce((select max(len) from runs), 0),
    'done_today', exists(select 1 from days, today where days.d = today.d)
  );
$fn$;

revoke all on function public.coursewise_streak_for(text) from public, anon, authenticated;

-- The signed-in user's own streak.
create or replace function public.coursewise_my_streak()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $fn$
declare me text;
begin
  select u."UserID"::text into me from public."User" u where u."AuthUserID" = auth.uid();
  if me is null then raise exception 'Please sign in again.' using errcode = '42501'; end if;
  return public.coursewise_streak_for(me);
end;
$fn$;

revoke all on function public.coursewise_my_streak() from public, anon;
grant execute on function public.coursewise_my_streak() to authenticated;

-- Friend actions: "today" (cheer day and the completions used to pick a
-- cheer message) now follows Utah time instead of UTC.
create or replace function public.coursewise_friend_action(p_action text, p_target text default null::text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  me text;
  link public.coursewise_friend_links%rowtype;
  today date:=(now() at time zone 'America/Denver')::date;
  n integer;
  msg text;
  bank text[];
  prev text;
begin
  select u."UserID"::text into me from public."User" u where u."AuthUserID"=auth.uid();
  if me is null then raise exception 'Please sign in again.' using errcode='42501'; end if;
  if p_action='read' then
    update public.coursewise_friend_cheers set seen_at=now() where recipient_id=me and seen_at is null;
    return jsonb_build_object('ok',true);
  end if;
  if p_target is null or p_target=me or not exists(select 1 from public."User" where "UserID"::text=p_target) then
    raise exception 'User not found.';
  end if;
  select * into link from public.coursewise_friend_links
    where (requester_id=me and recipient_id=p_target) or (requester_id=p_target and recipient_id=me)
    for update;
  if p_action='add' then
    if found then raise exception 'A friendship or request already exists.'; end if;
    insert into public.coursewise_friend_links(requester_id,recipient_id) values(me,p_target);
  elsif p_action='accept' then
    if link.recipient_id is distinct from me or link.status is distinct from 'pending' then raise exception 'No incoming request to accept.'; end if;
    update public.coursewise_friend_links set status='accepted',updated_at=now()
    where requester_id=link.requester_id and recipient_id=link.recipient_id;
  elsif p_action in ('decline','cancel','remove') then
    if link.requester_id is null then raise exception 'Request or friend not found.'; end if;
    if (p_action='decline' and not (link.recipient_id=me and link.status='pending'))
      or (p_action='cancel' and not (link.requester_id=me and link.status='pending'))
      or (p_action='remove' and link.status<>'accepted') then raise exception 'Action not allowed.'; end if;
    delete from public.coursewise_friend_links where requester_id=link.requester_id and recipient_id=link.recipient_id;
  elsif p_action='cheer' then
    if link.status is distinct from 'accepted' then raise exception 'Only friends can receive cheers.'; end if;
    select count(*) into n from public.coursewise_completion_times
      where user_id=p_target and (completed_at at time zone 'America/Denver')::date=today;
    if n<=4 then
      bank:=array['Lock in. You got this. 🔒','One task at a time. You''ve got this.','Someone''s rooting for you!',
        'Progress is progress. Keep it up.','You got this. Now go make it happen.','Your hype squad has arrived.'];
    elsif n<=7 then
      bank:=array['Okay, you''re actually cooking. 🔥','You''re crushing it today.','Someone understood the assignment.',
        'The to-do list never stood a chance.','Keep that momentum going!','That''s some serious progress. Nice work.'];
    else
      bank:=array['Respectfully, go touch grass. 🌱','At this point, your to-do list is afraid of you.',
        'Absolute academic weapon.','Your productivity is getting out of hand. Take a break.',
        'You''re on another level today.','That''s enough productivity to last a week.'];
    end if;
    if random()<0.05 then
      bank:=array['Achievement unlocked: Main character energy.','This is your sign to get a little treat.',
        'Your productivity has been deemed suspicious. We''re investigating.','Side quest complete: Being productive.',
        'You have earned one (1) imaginary gold star. ⭐',
        'Your effort has been noted. This message is your official recognition.',
        'Plot twist: You''re actually getting things done.',
        'Somewhere, your future self is giving you a standing ovation.'];
    end if;
    select message into prev from public.coursewise_friend_cheers
      where recipient_id=p_target order by created_at desc limit 1;
    select x into msg from unnest(bank) x where x is distinct from prev order by random() limit 1;
    insert into public.coursewise_friend_cheers(sender_id,recipient_id,cheer_day,message)
      values(me,p_target,today,msg);
  else raise exception 'Unknown friend action.'; end if;
  return jsonb_build_object('ok',true);
end; $function$;

-- Friends data: Utah-time "today", the cheered-today flag, and each accepted
-- friend's current streak (a number only; task details stay private).
create or replace function public.coursewise_friends_data(p_query text default ''::text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  me text;
  result jsonb;
  today date := (now() at time zone 'America/Denver')::date;
begin
  select u."UserID"::text into me from public."User" u where u."AuthUserID"=auth.uid();
  if me is null then raise exception 'Please sign in to see friends.' using errcode='42501'; end if;
  with my_edges as (
    select case when requester_id=me then recipient_id else requester_id end as other_id,
           status, case when requester_id=me then 'outgoing' else 'incoming' end as direction
    from public.coursewise_friend_links where requester_id=me or recipient_id=me
  ), friends as (
    select other_id from my_edges where status='accepted'
  ), candidates as (
    select u."UserID"::text as id, trim(concat_ws(' ',u."FirstName",u."LastName")) as name,
           u."Username" as handle, coalesce(e.status,'none') as status,
           coalesce(e.direction,'') as direction,
           (select count(*) from public.coursewise_friend_links l
            where l.status='accepted'
            and ((l.requester_id=u."UserID"::text and l.recipient_id in (select other_id from friends))
              or (l.recipient_id=u."UserID"::text and l.requester_id in (select other_id from friends)))) as mutuals
    from public."User" u
    left join my_edges e on e.other_id=u."UserID"::text
    where u."UserID"::text<>me
  ), eligible as (
    -- An empty search shows up to eight mutual connections plus four other users.
    select * from (
      select * from candidates where status='none' and mutuals>0
        and length(trim(p_query))=0 order by mutuals desc, random() limit 8
    ) mutual_recs
    union all
    select * from (
      select * from candidates where status='none' and mutuals=0
        and length(trim(p_query))=0 order by random() limit 4
    ) discover
    union all
    select * from (
      select * from candidates where status='none'
        and length(trim(p_query))>0
        and handle ilike '%'||left(trim(p_query),80)||'%'
      order by mutuals desc, name limit 20
    ) matching
    union all
    select * from candidates where status<>'none'
  ), chosen as (
    select * from eligible
  )
  select jsonb_build_object(
    'people',coalesce((select jsonb_agg(jsonb_build_object(
      'id',c.id,'name',c.name,'handle',c.handle,'state',
      case when c.status='accepted' then 'friend' when c.status='pending' and c.direction='incoming' then 'request'
           when c.status='pending' then 'pending' else 'none' end,
      'mutuals',c.mutuals,
      'today',case when c.status='accepted' then
        (select count(*) from public.coursewise_completion_times t where t.user_id=c.id
           and (t.completed_at at time zone 'America/Denver')::date=today)
        else null end,
      'streak',case when c.status='accepted' then
        (public.coursewise_streak_for(c.id)->>'current')::int
        else null end,
      'cheered',exists(select 1 from public.coursewise_friend_cheers ch
                 where ch.sender_id=me and ch.recipient_id=c.id and ch.cheer_day=today)
    ) order by c.mutuals desc,c.name) from chosen c), '[]'::jsonb),
    'notifications',coalesce((select jsonb_agg(jsonb_build_object(
      'sender',trim(concat_ws(' ',u."FirstName",u."LastName")),
      'message',ch.message,'created_at',ch.created_at,'seen',ch.seen_at is not null)
      order by ch.created_at desc)
      from (select * from public.coursewise_friend_cheers where recipient_id=me order by created_at desc limit 30) ch
      join public."User" u on u."UserID"::text=ch.sender_id), '[]'::jsonb),
    'unread', (select count(*) from public.coursewise_friend_cheers where recipient_id=me and seen_at is null),
    'date',today::text
  ) into result;
  return result;
end; $function$;

commit;

-- Optional check after running (signed in as yourself in the app, or as the
-- SQL editor's role with a known user id):
--   select public.coursewise_streak_for('<your UserID>');

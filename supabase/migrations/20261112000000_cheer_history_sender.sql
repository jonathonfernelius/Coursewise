-- Cheer history: include each cheer's sender_id (for the sender's photo and
-- "Cheer back") and sender_theme (the theme the sender had on, so a dragon
-- cheer stays a dragon cheer). Based on 20261104000000_streaks.sql.
-- Safe to run more than once.
begin;

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
      'sender_id',ch.sender_id,
      'sender_theme',ch.sender_theme,
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

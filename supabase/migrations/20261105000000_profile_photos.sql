-- Run once in the Supabase SQL Editor for the same project as Coursewise.
-- Private images: signed-in Coursewise users can view photos, owners alone can change them.
begin;
create table if not exists public.coursewise_profile_photos (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  photo_path text not null,
  constraint coursewise_photo_owned_path check (
    photo_path ~ ('^' || auth_user_id::text || '/[0-9a-f-]{36}\.jpg$')
  )
);
alter table public.coursewise_profile_photos enable row level security;
revoke all on public.coursewise_profile_photos from anon;
grant select, insert, update, delete on public.coursewise_profile_photos to authenticated;
drop policy if exists "Manage own profile photo" on public.coursewise_profile_photos;
create policy "Manage own profile photo" on public.coursewise_profile_photos
  for all to authenticated using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('coursewise-avatars','coursewise-avatars',false,2097152,array['image/jpeg'])
on conflict (id) do update set public=false, file_size_limit=2097152, allowed_mime_types=array['image/jpeg'];
drop policy if exists "Read Coursewise avatars" on storage.objects;
create policy "Read Coursewise avatars" on storage.objects for select to authenticated
using (bucket_id='coursewise-avatars' and exists (
  select 1 from public."User" where "AuthUserID"=(select auth.uid())
));
drop policy if exists "Upload own Coursewise avatar" on storage.objects;
create policy "Upload own Coursewise avatar" on storage.objects for insert to authenticated
with check (bucket_id='coursewise-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "Delete own Coursewise avatar" on storage.objects;
create policy "Delete own Coursewise avatar" on storage.objects for delete to authenticated
using (bucket_id='coursewise-avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- Returns only photo paths for the visible people requested by the client.
-- No email addresses, auth IDs as separate fields, or task information are returned.
create or replace function public.coursewise_profile_photo_paths(p_ids text[])
returns table(user_id text, photo_path text)
language sql stable security definer set search_path = ''
as $$
  select u."UserID"::text, p.photo_path
  from public."User" u join public.coursewise_profile_photos p on p.auth_user_id=u."AuthUserID"
  where u."UserID"::text = any(p_ids[1:100])
    and exists (select 1 from public."User" me where me."AuthUserID"=auth.uid());
$$;
revoke all on function public.coursewise_profile_photo_paths(text[]) from public, anon;
grant execute on function public.coursewise_profile_photo_paths(text[]) to authenticated;
commit;

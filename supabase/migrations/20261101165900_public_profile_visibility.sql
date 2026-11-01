-- Public personal profile preview. Public exposure is opt-in and limited to safe fields.
alter table public.profiles
  add column if not exists is_public boolean not null default false;

create or replace function public.get_public_profile(_user_id uuid)
returns table (
  full_name text,
  avatar_url text,
  wilaya_id integer,
  commune text
)
language sql
stable
security definer
set search_path = public, pg_temp
set row_security = off
as $$
  select
    p.full_name,
    p.avatar_url,
    p.wilaya_id,
    p.commune
  from public.profiles p
  where p.user_id = _user_id
    and p.is_public = true
  limit 1;
$$;

revoke all on function public.get_public_profile(uuid) from public;
grant execute on function public.get_public_profile(uuid) to anon, authenticated;

-- Profile visibility is changed through an owner-scoped RPC because authenticated
-- users have column-level UPDATE grants that intentionally exclude privacy controls.
create or replace function public.set_my_profile_visibility(_is_public boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
set row_security = off
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  update public.profiles
  set is_public = coalesce(_is_public, false)
  where user_id = auth.uid();

  if not found then
    raise exception 'profile_not_found';
  end if;
end;
$$;

revoke all on function public.set_my_profile_visibility(boolean) from public, anon;
grant execute on function public.set_my_profile_visibility(boolean) to authenticated;

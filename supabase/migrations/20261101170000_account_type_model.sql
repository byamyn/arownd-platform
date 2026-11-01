-- Arownd account identity: account type is separate from authorization roles.
-- Admin remains an independent capability in user_roles.
do $$
begin
  create type public.account_type as enum ('personal', 'merchant', 'delivery_company');
exception
  when duplicate_object then null;
end
$$;

alter table public.profiles
  add column if not exists account_type public.account_type not null default 'personal';

-- Do not silently merge two independent business identities into one account.
do $$
begin
  if exists (
    select 1
    from public.delivery_companies dc
    join public.user_roles ur
      on ur.user_id = dc.user_id
     and ur.role = 'merchant'::public.app_role
  ) then
    raise exception
      'account_type_conflict: users with both a delivery company and merchant role need manual reconciliation before this migration';
  end if;
end
$$;

update public.profiles p
set account_type = case
  when exists (
    select 1 from public.delivery_companies dc where dc.user_id = p.user_id
  ) then 'delivery_company'::public.account_type
  when exists (
    select 1 from public.user_roles ur
    where ur.user_id = p.user_id
      and ur.role = 'merchant'::public.app_role
  ) then 'merchant'::public.account_type
  else 'personal'::public.account_type
end;

-- Merchant onboarding changes account identity and grants the merchant capability
-- in the same transaction. Admin remains an independent role.
create or replace function public.become_merchant()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_type public.account_type;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select p.account_type
    into current_type
  from public.profiles p
  where p.user_id = auth.uid()
  for update;

  if not found then
    raise exception 'profile_not_found';
  end if;

  if current_type = 'delivery_company'::public.account_type
     or exists (
       select 1 from public.delivery_companies dc where dc.user_id = auth.uid()
     ) then
    raise exception 'account_type_conflict';
  end if;

  update public.profiles
  set account_type = 'merchant'::public.account_type
  where user_id = auth.uid();

  insert into public.user_roles (user_id, role)
  values (auth.uid(), 'merchant'::public.app_role)
  on conflict do nothing;
end;
$$;

-- A delivery-company application sets the account identity, but does not grant
-- operational access: approval remains governed by is_approved and existing RLS.
create or replace function public.set_delivery_account_type_on_registration()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
set row_security = off
as $$
declare
  current_type public.account_type;
begin
  select p.account_type
    into current_type
  from public.profiles p
  where p.user_id = new.user_id
  for update;

  if not found then
    raise exception 'profile_not_found';
  end if;

  if current_type = 'merchant'::public.account_type
     or exists (
       select 1 from public.user_roles ur
       where ur.user_id = new.user_id
         and ur.role = 'merchant'::public.app_role
     ) then
    raise exception 'account_type_conflict';
  end if;

  update public.profiles
  set account_type = 'delivery_company'::public.account_type
  where user_id = new.user_id;

  return new;
end;
$$;

drop trigger if exists set_delivery_account_type_on_registration
  on public.delivery_companies;
create trigger set_delivery_account_type_on_registration
before insert or update of user_id on public.delivery_companies
for each row
execute function public.set_delivery_account_type_on_registration();

revoke all on function public.set_delivery_account_type_on_registration() from public, anon, authenticated;

-- Read only the signed-in user's account identity; this is not an authorization check.
create or replace function public.get_my_account_type()
returns public.account_type
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select p.account_type
  from public.profiles p
  where p.user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_my_account_type() from public, anon;
grant execute on function public.get_my_account_type() to authenticated;

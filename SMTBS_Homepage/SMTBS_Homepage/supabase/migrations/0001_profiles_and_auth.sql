-- Phase 1: real customer authentication.
-- One profile row per auth.users row, created automatically on signup.
-- role distinguishes customers from admin staff; admin accounts are
-- promoted manually via SQL later (Phase 4), never through signup.

create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  email           text not null,
  name            text not null,
  role            text not null default 'customer'
                    check (role in ('customer', 'super_admin', 'cinema_manager', 'booking_manager')),
  member_since    date not null default current_date,
  loyalty_points  integer not null default 0,
  phone           text,
  status          text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Lets policies check "is this caller an admin" without recursively
-- re-triggering RLS on profiles (security definer bypasses that).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role <> 'customer'
  );
$$;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- No insert/delete policy for regular clients — rows are only ever
-- created by the trigger below and removed via the auth.users cascade.

-- role/loyalty_points/status must stay admin-only, even though the
-- policy above allows a customer to update their own row (for name/phone).
-- RLS can't restrict individual columns, so a trigger backs it up.
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.loyalty_points := old.loyalty_points;
    new.status := old.status;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_protect_privileged_columns
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();

-- Populates profiles automatically whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

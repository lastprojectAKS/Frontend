-- Extends signup to also work for phone-OTP and Google OAuth accounts,
-- neither of which necessarily has an email at signup time (phone-only
-- signups have no email; Google signups have an email but it comes from
-- raw_user_meta_data under a different key than the password-signup flow
-- used, and it's already present on new.email too — this just makes the
-- trigger robust to whichever fields are actually populated).

alter table public.profiles alter column email drop not null;
alter table public.profiles add column if not exists avatar_url text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, phone, name, avatar_url)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1),
      new.phone,
      'Member'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

-- Phone auth (SMS OTP) was dropped — it needs a paid SMS provider, not
-- worth it for a student project. Phone is now just an optional field
-- collected at signup, so the trigger needs to read it from signup
-- metadata instead of auth.users.phone (which stays null since we never
-- use Supabase's native phone-auth flow).

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
    coalesce(new.phone, new.raw_user_meta_data ->> 'phone'),
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

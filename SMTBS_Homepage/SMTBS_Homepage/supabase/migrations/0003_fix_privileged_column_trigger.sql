-- Fixes protect_profile_privileged_columns() (from migration 0001): it
-- checked is_admin() unconditionally, which also silently reverted role
-- edits made from the Supabase dashboard's Table Editor / SQL Editor —
-- those run with no app-user session, so auth.uid() is null there, which
-- the trigger was treating the same as "not an admin". Direct dashboard
-- access is already a fully-trusted context (it bypasses RLS entirely
-- regardless), so this only needs to guard against a logged-in, non-admin
-- app user editing their own row through the client.

create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.loyalty_points := old.loyalty_points;
    new.status := old.status;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

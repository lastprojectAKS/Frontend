-- Phase 6: real favourites. Profile.jsx's Favourites tab has shown an
-- honest "coming soon" empty state rather than fake data since the auth
-- migration — this is what makes it real. A customer can only ever see or
-- change their own favourites; there's no admin visibility into this table
-- since it's not an operational concern (unlike bookings/profiles).

create table public.favourites (
  customer_id  uuid not null references public.profiles(id) on delete cascade,
  movie_id     text not null references public.movies(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (customer_id, movie_id)
);

alter table public.favourites enable row level security;

create policy "favourites_select_own" on public.favourites for select
  using (auth.uid() = customer_id);
create policy "favourites_insert_own" on public.favourites for insert
  with check (auth.uid() = customer_id);
create policy "favourites_delete_own" on public.favourites for delete
  using (auth.uid() = customer_id);

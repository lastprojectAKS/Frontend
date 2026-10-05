-- "Notify Me" on coming-soon movies. Saves a customer's interest so it
-- survives a reload. No email or push is sent yet — admins can see the list.

create table public.release_alerts (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  movie_id   text not null references public.movies(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, movie_id)
);

create index idx_release_alerts_movie_id on public.release_alerts (movie_id);

alter table public.release_alerts enable row level security;

create policy "release_alerts_own_select" on public.release_alerts
  for select using (auth.uid() = user_id or public.is_admin());
create policy "release_alerts_own_insert" on public.release_alerts
  for insert with check (auth.uid() = user_id);
create policy "release_alerts_own_delete" on public.release_alerts
  for delete using (auth.uid() = user_id);

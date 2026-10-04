-- A public Storage bucket for admin-uploaded movie poster/backdrop images.
-- Public read (customers need to actually see the images); writes gated by
-- the same is_admin() check every other admin-only table write already
-- uses (0001_profiles_and_auth.sql).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('movie-images', 'movie-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "movie_images_public_read" on storage.objects for select
  using (bucket_id = 'movie-images');

create policy "movie_images_admin_insert" on storage.objects for insert
  with check (bucket_id = 'movie-images' and public.is_admin());

create policy "movie_images_admin_update" on storage.objects for update
  using (bucket_id = 'movie-images' and public.is_admin())
  with check (bucket_id = 'movie-images' and public.is_admin());

create policy "movie_images_admin_delete" on storage.objects for delete
  using (bucket_id = 'movie-images' and public.is_admin());

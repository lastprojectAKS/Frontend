-- Phase 2a: movies, cinemas, and offers become real tables. Both apps used
-- to keep separate, inconsistent mock catalogs for movies/cinemas (different
-- status values, different field sets) — this reconciles them into one real
-- shape. Admin's 5-stage lifecycle wins on status (it's the operational
-- superset); the customer app's cast-with-{name,role} wins over admin's
-- flat string list; the richer of the two description texts was kept.
--
-- "cast" is a reserved word in Postgres (used by the CAST(...) syntax), so
-- the column is named cast_members instead.
--
-- distance and movie_ids on cinemas are a deliberate interim simplification:
-- there's no showtimes table yet (that's Phase 2b), so "which movies play
-- where" can't be derived from a real join yet. movie_ids is a denormalized
-- placeholder until showtimes lands, at which point it gets replaced by a
-- real query. distance is a static display string (no live geolocation) —
-- kept as-is rather than removed, since dropping it would need a UI change
-- for no real gain right now.

create table public.movies (
  id            text primary key,
  title         text not null,
  poster        text,
  backdrop      text,
  genres        text[] not null default '{}',
  duration      integer not null,
  language      text,
  age_rating    text,
  director      text,
  cast_members  jsonb not null default '[]',
  release_date  date,
  end_date      date,
  trailer_url   text,
  status        text not null default 'Draft'
                  check (status in ('Draft', 'Upcoming', 'Now Showing', 'Ended', 'Inactive')),
  rating        numeric(3, 1),
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.cinemas (
  id          text primary key,
  name        text not null,
  address     text not null,
  distance    text,
  phone       text,
  email       text,
  amenities   text[] not null default '{}',
  movie_ids   text[] not null default '{}',
  status      text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at  timestamptz not null default now()
);

create table public.offers (
  id           text primary key,
  title        text not null,
  description  text,
  discount     text not null,
  validity     text not null,
  code         text not null unique,
  created_at   timestamptz not null default now()
);

alter table public.movies enable row level security;
alter table public.cinemas enable row level security;
alter table public.offers enable row level security;

-- Browsing needs no login; only admins can change the catalogue.
create policy "movies_public_read" on public.movies for select using (true);
create policy "movies_admin_insert" on public.movies for insert with check (public.is_admin());
create policy "movies_admin_update" on public.movies for update using (public.is_admin()) with check (public.is_admin());
create policy "movies_admin_delete" on public.movies for delete using (public.is_admin());

create policy "cinemas_public_read" on public.cinemas for select using (true);
create policy "cinemas_admin_insert" on public.cinemas for insert with check (public.is_admin());
create policy "cinemas_admin_update" on public.cinemas for update using (public.is_admin()) with check (public.is_admin());
create policy "cinemas_admin_delete" on public.cinemas for delete using (public.is_admin());

create policy "offers_public_read" on public.offers for select using (true);
create policy "offers_admin_insert" on public.offers for insert with check (public.is_admin());
create policy "offers_admin_update" on public.offers for update using (public.is_admin()) with check (public.is_admin());
create policy "offers_admin_delete" on public.offers for delete using (public.is_admin());

-- Seed data: the reconciled catalogue described above.

insert into public.movies (id, title, poster, backdrop, genres, duration, language, age_rating, director, cast_members, release_date, end_date, trailer_url, status, rating, description) values
('dune-part-two', 'Dune: Part Two', '/images/dune-part-two.jpeg', '/images/dune-part-two.jpeg', '{Sci-Fi,Adventure}', 166, 'English', 'PG-13', 'Denis Villeneuve',
  '[{"name":"Timothée Chalamet","role":"Paul Atreides"},{"name":"Zendaya","role":"Chani"},{"name":"Rebecca Ferguson","role":"Lady Jessica"},{"name":"Josh Brolin","role":"Gurney Halleck"},{"name":"Austin Butler","role":"Feyd-Rautha"}]',
  '2026-03-01', '2026-09-15', 'https://example.com/trailers/dune-part-two', 'Now Showing', 8.6,
  'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.'),
('oppenheimer', 'Oppenheimer', '/images/oppenheimer.jpeg', '/images/oppenheimer.jpeg', '{Drama,History}', 180, 'English', 'R', 'Christopher Nolan',
  '[{"name":"Cillian Murphy","role":"J. Robert Oppenheimer"},{"name":"Emily Blunt","role":"Kitty Oppenheimer"},{"name":"Matt Damon","role":"Leslie Groves"},{"name":"Robert Downey Jr.","role":"Lewis Strauss"},{"name":"Florence Pugh","role":"Jean Tatlock"}]',
  '2026-07-21', '2026-10-01', 'https://example.com/trailers/oppenheimer', 'Now Showing', 8.9,
  'The story of J. Robert Oppenheimer''s role in the development of the atomic bomb during World War II, and the moral weight of unleashing a power that could end the world.'),
('inception', 'Inception', '/images/inception.jpeg', '/images/inception.jpeg', '{Sci-Fi,Thriller}', 148, 'English', 'PG-13', 'Christopher Nolan',
  '[{"name":"Leonardo DiCaprio","role":"Cobb"},{"name":"Joseph Gordon-Levitt","role":"Arthur"},{"name":"Elliot Page","role":"Ariadne"},{"name":"Tom Hardy","role":"Eames"}]',
  '2010-07-16', '2026-09-30', 'https://example.com/trailers/inception', 'Now Showing', 8.8,
  'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a CEO, in a job that spirals into layers of reality itself.'),
('the-batman', 'The Batman', '/images/the-batman.jpg', '/images/the-batman.jpg', '{Action,Crime}', 176, 'English', 'PG-13', 'Matt Reeves',
  '[{"name":"Robert Pattinson","role":"Bruce Wayne / Batman"},{"name":"Zoë Kravitz","role":"Selina Kyle"},{"name":"Paul Dano","role":"The Riddler"},{"name":"Jeffrey Wright","role":"James Gordon"}]',
  '2022-03-04', '2026-08-30', 'https://example.com/trailers/the-batman', 'Now Showing', 7.8,
  'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city''s hidden corruption and question his family''s involvement.'),
('ashes-of-meridian', 'Ashes of Meridian', '/images/ashes-of-meridian.svg', '/images/ashes-of-meridian.svg', '{Sci-Fi,Thriller}', 128, 'English', 'PG-13', 'Nadia Okonkwo',
  '[{"name":"Ines Callahan","role":"Voss Kellan"},{"name":"Dorian Achebe","role":"Commander Reyes"},{"name":"Mira Solenko","role":"Dr. Anwen Price"}]',
  '2026-07-04', '2026-09-20', 'https://example.com/trailers/ashes-of-meridian', 'Now Showing', 8.3,
  'When a routine supply run to the failing orbital colony of Meridian uncovers a conspiracy decades in the making, engineer Voss Kellan has to decide how far she''ll go to expose the truth before the station''s next collapse.'),
('echoes-of-verity', 'Echoes of Verity', '/images/echoes-of-verity.svg', '/images/echoes-of-verity.svg', '{Mystery,Drama}', 118, 'English', 'R', 'Marcus Whitfield',
  '[{"name":"Clara Fontaine","role":"Wren Ashby"},{"name":"Idris Van Der Berg","role":"Sheriff Cole Mercer"},{"name":"Renata Solheim","role":"Dana Whitcombe"}]',
  '2026-08-08', '2026-09-25', 'https://example.com/trailers/echoes-of-verity', 'Now Showing', 8.2,
  'A disgraced journalist returns to her hometown to investigate one final cold case, only to find that everyone she interviews is telling a slightly different version of the same lie.'),
('the-last-bloom', 'The Last Bloom', '/images/the-last-bloom.svg', '/images/the-last-bloom.svg', '{Drama,Romance}', 112, 'English', 'PG-13', 'Sofia Marchetti',
  '[{"name":"Naomi Castellano","role":"Iris Hensley"},{"name":"Felix Adeyemi","role":"Tomas Reyes"},{"name":"Priya Nakamura","role":"Grandma Ruth"}]',
  '2026-09-18', '2026-11-10', 'https://example.com/trailers/the-last-bloom', 'Upcoming', 7.9,
  'A florist inheriting her grandmother''s failing shop and the quiet architect renovating the building next door find themselves rebuilding more than just a storefront over the course of one long, unhurried summer.'),
('paper-moons', 'Paper Moons', '/images/paper-moons.svg', '/images/paper-moons.svg', '{Comedy,Drama}', 101, 'English', 'PG-13', 'Levi Hutton',
  '[{"name":"Gemma Whitfield","role":"Nora Address"},{"name":"Théo Lindqvist","role":"Sam Address"},{"name":"Aaliyah Brennan","role":"Casey Address"}]',
  '2026-10-10', '2026-12-01', 'https://example.com/trailers/paper-moons', 'Upcoming', 8.0,
  'Three estranged siblings are forced to co-run their late father''s failing drive-in cinema for one summer, or lose it forever — and rediscover exactly why they stopped speaking to each other in the first place.'),
('past-lives', 'Past Lives', '/images/past-lives.jpg', '/images/past-lives.jpg', '{Drama,Romance}', 106, 'English', 'PG-13', 'Celine Woo',
  '[{"name":"Greta Lee","role":"Nora"},{"name":"Teo Yoo","role":"Hae Sung"},{"name":"John Magaro","role":"Arthur"}]',
  '2026-05-01', '2026-07-15', 'https://example.com/trailers/past-lives', 'Ended', 8.0,
  'Nora and Hae Sung, two deeply connected childhood friends, are reunited in New York for one fateful week as they confront notions of destiny, love, and the choices that make a life.'),
('poor-things', 'Poor Things', '/images/poor-things.jpg', '/images/poor-things.jpg', '{Fantasy,Comedy}', 141, 'English', 'R', 'Yorgos Lanthimos',
  '[{"name":"Emma Stone","role":"Bella Baxter"},{"name":"Mark Ruffalo","role":"Duncan Wedderburn"},{"name":"Willem Dafoe","role":"Dr. Godwin Baxter"}]',
  '2026-04-01', '2026-06-30', 'https://example.com/trailers/poor-things', 'Ended', 8.1,
  'The incredible tale of Bella Baxter, a young woman brought back to life by a brilliant scientist. Hungry for the freedom this new life brings, Bella sets off on a whirlwind adventure across the world.'),
('midnight-foundry', 'Midnight Foundry', '/images/midnight-foundry.svg', '/images/midnight-foundry.svg', '{Action,Thriller}', 134, 'English', 'R', 'Iggy Falkner',
  '[{"name":"Marcus Delgado","role":"Ray Novak"},{"name":"Sana Okafor","role":"Detective Lin Torres"},{"name":"Viktor Hallstrom","role":"Aldous Kane"}]',
  '2026-11-05', '2026-12-20', 'https://example.com/trailers/midnight-foundry', 'Draft', 7.6,
  'A decommissioned steelworks becomes the last stand for a former demolitions expert forced back into the game for one night, when the crew that betrayed him comes back to finish the job.'),
('glass-horizon', 'Glass Horizon', '/images/glass-horizon.svg', '/images/glass-horizon.svg', '{Sci-Fi,Adventure}', 145, 'English', 'PG-13', 'Renata Kwon',
  '[{"name":"Odalys Marchetti","role":"Captain Reva Solis"},{"name":"Kwame Osei","role":"Dr. Bennett Cho"},{"name":"Freya Lindgren","role":"Navigator Iris Voss"}]',
  '2026-11-21', '2027-01-15', 'https://example.com/trailers/glass-horizon', 'Inactive', 8.4,
  'The first crewed expedition beyond the solar system''s edge discovers the boundary they were sent to map isn''t empty space at all — and turning back may no longer be an option.');

insert into public.cinemas (id, name, address, distance, phone, email, amenities, movie_ids, status) values
('downtown', 'SMTBS Downtown', '142 Market Street, City Centre', '1.8 km', '+1 (212) 555-0142', 'downtown@smtbs.example',
  '{IMAX,"Dolby Atmos",Recliner,Parking}',
  '{dune-part-two,oppenheimer,inception,the-batman,ashes-of-meridian,midnight-foundry}', 'Active'),
('riverside', 'SMTBS Riverside', '8 Riverside Boulevard, Harbour District', '3.2 km', '+1 (212) 555-0108', 'riverside@smtbs.example',
  '{"Dolby Atmos",Recliner,"Wheelchair Accessible"}',
  '{dune-part-two,oppenheimer,the-batman,the-last-bloom,echoes-of-verity}', 'Active'),
('grand-mall', 'SMTBS Grand Mall', '500 Grand Mall Avenue, Level 3', '4.6 km', '+1 (212) 555-0500', 'grandmall@smtbs.example',
  '{IMAX,Parking,"Wheelchair Accessible"}',
  '{dune-part-two,inception,the-batman,midnight-foundry,ashes-of-meridian}', 'Active'),
('uptown-plaza', 'SMTBS Uptown Plaza', '27 Uptown Plaza, North End', '6.1 km', '+1 (212) 555-0027', 'uptown@smtbs.example',
  '{Recliner,Parking,"Wheelchair Accessible"}',
  '{oppenheimer,inception,the-last-bloom,echoes-of-verity}', 'Inactive');

insert into public.offers (id, title, description, discount, validity, code) values
('student-discount', 'Student Discount', 'Show a valid student ID at checkout and save on any weekday screening.', '20% OFF', 'Mon–Thu, all cinemas', 'STUDENT20'),
('weekend-family', 'Weekend Family Deal', 'Bring the whole family — bundle four tickets and snacks for one flat price.', 'Save $15', 'Sat–Sun, family screenings', 'FAMILY15'),
('tuesday-deal', 'Tuesday Movie Deal', 'Every Tuesday, all standard tickets drop to a flat rate across every cinema.', '$8 Tickets', 'Every Tuesday', 'TUESDAY8'),
('couples-package', 'Couples Package', 'Two premium recliner seats plus a shared snack box, ready when you arrive.', '15% OFF', 'Fri–Sun, recliner seats', 'COUPLES15');

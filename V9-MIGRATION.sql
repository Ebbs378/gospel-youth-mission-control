-- Gospel Youth Mission Control V9 Migration
-- Einmal in Supabase > SQL Editor ausführen.

-- Bestehende V8-Felder sicherstellen
alter table public.team_members add column if not exists phone text;
alter table public.program_items add column if not exists interviewer text;
alter table public.tasks add column if not exists category text;
alter table public.tasks add column if not exists done boolean default false;
alter table public.content_items add column if not exists category text;
alter table public.content_images add column if not exists created_at timestamptz default now();

-- NEU: Unterpunkte innerhalb eines Programmpunkts
create table if not exists public.program_subitems (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.program_items(id) on delete cascade,
  title text not null,
  kind text,
  start_time time,
  description text,
  sort_order integer not null default 1,
  created_at timestamptz not null default now()
);

-- NEU: nummerierte Story-Punkte (1., 2., 3. Story ...)
create table if not exists public.story_points (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.program_items(id) on delete cascade,
  event_date date not null,
  title text not null,
  description text,
  owner text,
  sort_order integer not null default 1,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- Tagesziele sicherstellen
create table if not exists public.daily_goals (
  id uuid primary key default gen_random_uuid(),
  event_date date not null unique,
  stories_goal integer not null default 0,
  reels_goal integer not null default 0,
  photos_goal integer not null default 0,
  interviews_goal integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.program_subitems enable row level security;
alter table public.story_points enable row level security;
alter table public.daily_goals enable row level security;

-- Öffentliche Ansicht: lesen erlaubt
drop policy if exists "public read program subitems" on public.program_subitems;
create policy "public read program subitems"
on public.program_subitems for select
to anon, authenticated
using (true);

drop policy if exists "public read story points" on public.story_points;
create policy "public read story points"
on public.story_points for select
to anon, authenticated
using (true);

drop policy if exists "public read daily goals" on public.daily_goals;
create policy "public read daily goals"
on public.daily_goals for select
to anon, authenticated
using (true);

-- Admin: eingeloggte User dürfen bearbeiten
drop policy if exists "authenticated manage program subitems" on public.program_subitems;
create policy "authenticated manage program subitems"
on public.program_subitems for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated manage story points" on public.story_points;
create policy "authenticated manage story points"
on public.story_points for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated manage daily goals" on public.daily_goals;
create policy "authenticated manage daily goals"
on public.daily_goals for all
to authenticated
using (true)
with check (true);

grant select on public.program_subitems to anon, authenticated;
grant insert, update, delete on public.program_subitems to authenticated;
grant select on public.story_points to anon, authenticated;
grant insert, update, delete on public.story_points to authenticated;
grant select on public.daily_goals to anon, authenticated;
grant insert, update, delete on public.daily_goals to authenticated;

-- Storage-Bucket für Inspirationsbilder sicherstellen
insert into storage.buckets (id,name,public)
values ('content-images','content-images',true)
on conflict (id) do update set public=true;

drop policy if exists "v9 public content images" on storage.objects;
create policy "v9 public content images"
on storage.objects for select
to anon, authenticated
using (bucket_id='content-images');

drop policy if exists "v9 authenticated upload images" on storage.objects;
create policy "v9 authenticated upload images"
on storage.objects for insert
to authenticated
with check (bucket_id='content-images');

drop policy if exists "v9 authenticated update images" on storage.objects;
create policy "v9 authenticated update images"
on storage.objects for update
to authenticated
using (bucket_id='content-images')
with check (bucket_id='content-images');

drop policy if exists "v9 authenticated delete images" on storage.objects;
create policy "v9 authenticated delete images"
on storage.objects for delete
to authenticated
using (bucket_id='content-images');

-- PostgREST Schema-Cache aktualisieren
notify pgrst, 'reload schema';
select pg_notification_queue_usage();

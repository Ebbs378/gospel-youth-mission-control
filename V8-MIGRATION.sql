-- Gospel Youth Mission Control V8 Migration
-- Einmal in Supabase > SQL Editor > New Query ausführen.

alter table public.team_members
  add column if not exists phone text;

alter table public.program_items
  add column if not exists interviewer text;

alter table public.tasks
  add column if not exists category text;

alter table public.content_items
  add column if not exists category text;

alter table public.content_images
  add column if not exists created_at timestamptz default now();

create table if not exists public.daily_goals (
  id uuid primary key default gen_random_uuid(),
  event_date date not null unique,
  stories_goal integer not null default 0,
  reels_goal integer not null default 0,
  photos_goal integer not null default 0,
  interviews_goal integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.daily_goals enable row level security;

drop policy if exists "public read daily goals" on public.daily_goals;
create policy "public read daily goals"
on public.daily_goals for select
to anon, authenticated
using (true);

drop policy if exists "authenticated manage daily goals" on public.daily_goals;
create policy "authenticated manage daily goals"
on public.daily_goals for all
to authenticated
using (true)
with check (true);

-- Storage-Policies sicherstellen
insert into storage.buckets (id,name,public)
values ('content-images','content-images',true)
on conflict (id) do update set public=true;

drop policy if exists "public view content images v8" on storage.objects;
create policy "public view content images v8"
on storage.objects for select
to anon, authenticated
using (bucket_id='content-images');

drop policy if exists "authenticated upload content images v8" on storage.objects;
create policy "authenticated upload content images v8"
on storage.objects for insert
to authenticated
with check (bucket_id='content-images');

drop policy if exists "authenticated update content images v8" on storage.objects;
create policy "authenticated update content images v8"
on storage.objects for update
to authenticated
using (bucket_id='content-images')
with check (bucket_id='content-images');

drop policy if exists "authenticated delete content images v8" on storage.objects;
create policy "authenticated delete content images v8"
on storage.objects for delete
to authenticated
using (bucket_id='content-images');

notify pgrst, 'reload schema';

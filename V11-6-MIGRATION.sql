-- V11.6 SPOTIFY + REEL INSPIRATION
-- Additiv: vorhandene Daten werden NICHT gelöscht.

alter table public.content_todos
  add column if not exists spotify_url text;

create table if not exists public.content_ideas (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  video_url text not null,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_ideas enable row level security;

drop policy if exists "content ideas public read" on public.content_ideas;
create policy "content ideas public read"
on public.content_ideas for select to anon, authenticated using (true);

drop policy if exists "content ideas admin manage" on public.content_ideas;
create policy "content ideas admin manage"
on public.content_ideas for all to authenticated using (true) with check (true);

grant select on public.content_ideas to anon, authenticated;
grant insert, update, delete on public.content_ideas to authenticated;

notify pgrst, 'reload schema';

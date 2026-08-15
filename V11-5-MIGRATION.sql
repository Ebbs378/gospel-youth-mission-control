-- V11.5 DIRECT CONTENT + VORGABEN
-- Bestehende Daten bleiben erhalten.
alter table public.content_todos add column if not exists program_id uuid references public.program_items(id) on delete cascade;
alter table public.content_todos add column if not exists background_song text;
alter table public.content_todos add column if not exists download_file_url text;
update public.content_todos ct set program_id=ps.program_id from public.program_subitems ps where ct.program_id is null and ct.subitem_id=ps.id;
create table if not exists public.guideline_sections(id uuid primary key default gen_random_uuid(),title text not null,description text,image_url text,sort_order integer not null default 1,created_at timestamptz not null default now());
create table if not exists public.guideline_items(id uuid primary key default gen_random_uuid(),section_id uuid not null references public.guideline_sections(id) on delete cascade,title text not null,description text,image_url text,sort_order integer not null default 1,created_at timestamptz not null default now());
alter table public.guideline_sections enable row level security;alter table public.guideline_items enable row level security;
drop policy if exists "guidelines public read" on public.guideline_sections;create policy "guidelines public read" on public.guideline_sections for select to anon,authenticated using(true);
drop policy if exists "guidelines admin manage" on public.guideline_sections;create policy "guidelines admin manage" on public.guideline_sections for all to authenticated using(true) with check(true);
drop policy if exists "guideline items public read" on public.guideline_items;create policy "guideline items public read" on public.guideline_items for select to anon,authenticated using(true);
drop policy if exists "guideline items admin manage" on public.guideline_items;create policy "guideline items admin manage" on public.guideline_items for all to authenticated using(true) with check(true);
grant select on public.guideline_sections,public.guideline_items to anon,authenticated;grant insert,update,delete on public.guideline_sections,public.guideline_items to authenticated;notify pgrst,'reload schema';

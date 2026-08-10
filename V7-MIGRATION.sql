-- Mission Control V7 Migration
-- NACH dem ursprünglichen supabase-schema.sql ausführen.

alter table public.program_items
  add column if not exists interviewer text;

alter table public.tasks
  add column if not exists category text;

alter table public.content_items
  add column if not exists category text;

-- Bestehende Daten automatisch kategorisieren.
update public.tasks
set category = case
  when lower(coalesce(role,'')) like '%foto%' then 'photo'
  when lower(coalesce(role,'')) like '%reel%' then 'reel'
  when lower(coalesce(role,'')) like '%interview%' then 'interview'
  else 'story'
end
where category is null;

update public.content_items
set category = case
  when lower(coalesce(kind,'')) = 'reel' then 'reel'
  when lower(coalesce(kind,'')) = 'foto' then 'photo'
  when lower(coalesce(kind,'')) = 'interview' then 'interview'
  else 'story'
end
where category is null;

-- Realtime für spätere Live-Aktualisierung vorbereiten.
do $$
begin
  alter publication supabase_realtime add table public.app_settings;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.team_members;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.program_items;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.tasks;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.content_items;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.content_images;
exception when duplicate_object then null;
end $$;

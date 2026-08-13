-- GOSPEL YOUTH MISSION CONTROL V10 PRODUCTION
-- Einmal komplett in Supabase > SQL Editor > New Query ausführen.

create extension if not exists pgcrypto;

-- 1) Festival-Tage: Thema/Bezeichnung jetzt im Admin bearbeitbar
create table if not exists public.festival_days (
  event_date date primary key,
  short_label text,
  display_date text,
  theme text,
  description text,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.festival_days(event_date,short_label,display_date,theme,sort_order) values
('2026-08-29','Sa · 29. Aug','29. August','Anreise',1),
('2026-08-30','So · 30. Aug','30. August','Ankunft',2),
('2026-08-31','Mo · 31. Aug','31. August','Identität',3),
('2026-09-01','Di · 1. Sep','1. September','Metanoia',4),
('2026-09-02','Mi · 2. Sep','2. September','Gaben',5),
('2026-09-03','Do · 3. Sep','3. September','Ausflug',6),
('2026-09-04','Fr · 4. Sep','4. September','Gnade',7),
('2026-09-05','Sa · 5. Sep','5. September','Alltag',8),
('2026-09-06','So · 6. Sep','6. September','Zeugnisse',9),
('2026-09-07','Mo · 7. Sep','7. September','Heimfahrt',10)
on conflict(event_date) do nothing;

-- bestehende Tabellen/Felder absichern
alter table public.team_members add column if not exists phone text;
alter table public.program_items add column if not exists interviewer text;
alter table public.program_subitems add column if not exists sort_order integer default 1;

-- 2) Content-To-dos hängen DIREKT an Unterpunkten.
create table if not exists public.content_todos (
  id uuid primary key default gen_random_uuid(),
  subitem_id uuid not null references public.program_subitems(id) on delete cascade,
  event_date date not null,
  type text not null check (type in ('Story','Reel','Foto','Interview')),
  title text not null,
  description text,
  due_time time,
  example_url text,
  sort_order integer not null default 1,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) Mehrere Personen pro Content-To-do
create table if not exists public.todo_assignments (
  todo_id uuid not null references public.content_todos(id) on delete cascade,
  member_id uuid not null references public.team_members(id) on delete cascade,
  primary key(todo_id,member_id)
);

-- 4) Mehrere Personen pro Rolle am Programmpunkt
create table if not exists public.program_assignments (
  program_id uuid not null references public.program_items(id) on delete cascade,
  member_id uuid not null references public.team_members(id) on delete cascade,
  role text not null,
  primary key(program_id,member_id,role)
);

-- 5) Bilder / MP4 / Links direkt am To-do
create table if not exists public.todo_media (
  id uuid primary key default gen_random_uuid(),
  todo_id uuid not null references public.content_todos(id) on delete cascade,
  media_type text not null check(media_type in ('image','video','link')),
  url text not null,
  caption text,
  sort_order integer not null default 1,
  created_at timestamptz not null default now()
);

-- 6) Vorlagen-Galerie
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  description text,
  file_url text not null,
  created_at timestamptz not null default now()
);

-- Bestehende einzelne Rollen aus V9 einmalig in Mehrfach-Zuweisungen übernehmen,
-- sofern ein Team-Mitglied mit exakt gleichem Namen existiert.
insert into public.program_assignments(program_id,member_id,role)
select p.id,m.id,'Fotograf' from public.program_items p join public.team_members m on m.name=p.photographer where p.photographer is not null
on conflict do nothing;
insert into public.program_assignments(program_id,member_id,role)
select p.id,m.id,'Story-Koordinator' from public.program_items p join public.team_members m on m.name=p.story_coordinator where p.story_coordinator is not null
on conflict do nothing;
insert into public.program_assignments(program_id,member_id,role)
select p.id,m.id,'Story-Maker' from public.program_items p join public.team_members m on m.name=p.story_maker where p.story_maker is not null
on conflict do nothing;
insert into public.program_assignments(program_id,member_id,role)
select p.id,m.id,'Reel-Maker' from public.program_items p join public.team_members m on m.name=p.reel_maker where p.reel_maker is not null
on conflict do nothing;
insert into public.program_assignments(program_id,member_id,role)
select p.id,m.id,'Interview' from public.program_items p join public.team_members m on m.name=p.interviewer where p.interviewer is not null
on conflict do nothing;

-- V9 Story-Punkte einmalig als V10-To-dos übernehmen, wenn möglich.
insert into public.content_todos(subitem_id,event_date,type,title,description,sort_order,done)
select s.id,sp.event_date,'Story',sp.title,sp.description,sp.sort_order,coalesce(sp.done,false)
from public.story_points sp
join lateral (
  select ps.id from public.program_subitems ps where ps.program_id=sp.program_id order by ps.sort_order limit 1
) s on true
where not exists (
  select 1 from public.content_todos ct where ct.subitem_id=s.id and ct.type='Story' and ct.title=sp.title
);

-- RLS
alter table public.festival_days enable row level security;
alter table public.content_todos enable row level security;
alter table public.todo_assignments enable row level security;
alter table public.program_assignments enable row level security;
alter table public.todo_media enable row level security;
alter table public.templates enable row level security;

-- public read + authenticated manage
do $$
declare t text;
begin
  foreach t in array array['festival_days','content_todos','todo_assignments','program_assignments','todo_media','templates']
  loop
    execute format('drop policy if exists "v10 public read" on public.%I',t);
    execute format('create policy "v10 public read" on public.%I for select to anon, authenticated using (true)',t);
    execute format('drop policy if exists "v10 admin manage" on public.%I',t);
    execute format('create policy "v10 admin manage" on public.%I for all to authenticated using (true) with check (true)',t);
    execute format('grant select on public.%I to anon, authenticated',t);
    execute format('grant insert, update, delete on public.%I to authenticated',t);
  end loop;
end $$;

-- Storage: bestehender Bucket wird für Todo-Medien und Vorlagen weiterverwendet
insert into storage.buckets(id,name,public) values('content-images','content-images',true)
on conflict(id) do update set public=true;

drop policy if exists "v10 public media" on storage.objects;
create policy "v10 public media" on storage.objects for select to anon,authenticated using(bucket_id='content-images');
drop policy if exists "v10 admin upload" on storage.objects;
create policy "v10 admin upload" on storage.objects for insert to authenticated with check(bucket_id='content-images');
drop policy if exists "v10 admin update" on storage.objects;
create policy "v10 admin update" on storage.objects for update to authenticated using(bucket_id='content-images') with check(bucket_id='content-images');
drop policy if exists "v10 admin delete" on storage.objects;
create policy "v10 admin delete" on storage.objects for delete to authenticated using(bucket_id='content-images');

notify pgrst, 'reload schema';
select pg_notification_queue_usage();

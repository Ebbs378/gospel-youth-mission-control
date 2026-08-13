-- GOSPEL YOUTH MISSION CONTROL V11 TEAM APP
-- Einmal komplett in Supabase > SQL Editor > New Query ausführen.

create extension if not exists pgcrypto;

-- Home, externe Links, Bibelvers und Motivation zentral editierbar.
alter table public.app_settings add column if not exists whatsapp_url text;
alter table public.app_settings add column if not exists dropbox_url text;
alter table public.app_settings add column if not exists bible_url text default 'https://www.bible.com/bible/157/MAT.1.SCH2000';
alter table public.app_settings add column if not exists daily_verse text;
alter table public.app_settings add column if not exists daily_verse_ref text;
alter table public.app_settings add column if not exists motivation_title text;
alter table public.app_settings add column if not exists motivation_text text;
alter table public.app_settings add column if not exists announcement text;
update public.app_settings set bible_url=coalesce(bible_url,'https://www.bible.com/bible/157/MAT.1.SCH2000') where true;

alter table public.festival_days add column if not exists briefing text;

-- Fertige Ergebnisse/Downloads pro Tag.
create table if not exists public.finished_content (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  category text not null default 'Sonstiges',
  title text not null,
  description text,
  file_url text not null,
  file_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.finished_content enable row level security;
drop policy if exists "v11 team read finished" on public.finished_content;
create policy "v11 team read finished" on public.finished_content for select to anon,authenticated using(true);
drop policy if exists "v11 admin manage finished" on public.finished_content;
create policy "v11 admin manage finished" on public.finished_content for all to authenticated using(true) with check(true);
grant select on public.finished_content to anon,authenticated;
grant insert,update,delete on public.finished_content to authenticated;

-- TEAM-DATENSCHUTZ:
-- Telefonnummern/E-Mails sind NICHT mehr direkt für anon lesbar.
-- Ein Viewer erhält sie nur über die Passcode-Funktion; eingeloggte Admins weiterhin direkt.
drop policy if exists "public read team" on public.team_members;
drop policy if exists "v10 public read" on public.team_members;
revoke select on public.team_members from anon;
grant select on public.team_members to authenticated;

create table if not exists public.team_access_config (
  singleton boolean primary key default true check(singleton),
  pass_hash text not null
);
alter table public.team_access_config enable row level security;
revoke all on public.team_access_config from anon,authenticated;
insert into public.team_access_config(singleton,pass_hash)
values(true,crypt('7777',gen_salt('bf')))
on conflict(singleton) do update set pass_hash=excluded.pass_hash;

create or replace function public.team_members_with_passcode(passcode text)
returns table(id uuid,name text,email text,roles text[],phone text)
language plpgsql
security definer
set search_path=public
as $$
declare h text;
begin
  -- Authentifizierte Admins dürfen ohne Team-Passwort lesen.
  if auth.uid() is not null then
    return query select t.id,t.name,t.email,t.roles,t.phone from public.team_members t order by t.name;
    return;
  end if;
  select pass_hash into h from public.team_access_config where singleton=true;
  if h is null or crypt(coalesce(passcode,''),h) <> h then
    raise exception 'invalid team passcode' using errcode='28000';
  end if;
  return query select t.id,t.name,t.email,t.roles,t.phone from public.team_members t order by t.name;
end $$;
revoke all on function public.team_members_with_passcode(text) from public;
grant execute on function public.team_members_with_passcode(text) to anon,authenticated;

-- Storage bleibt öffentlich lesbar, damit Download-Links/Bilder funktionieren.
-- Upload/Löschen bleibt authentifizierten Admins vorbehalten (V10 Policies).

notify pgrst, 'reload schema';
select pg_notification_queue_usage();

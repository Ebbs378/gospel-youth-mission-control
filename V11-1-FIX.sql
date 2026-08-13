-- V11.1 FIX / Ergänzung
alter table public.app_settings add column if not exists whatsapp_url text;
alter table public.app_settings add column if not exists dropbox_url text;
alter table public.app_settings add column if not exists bible_url text default 'https://www.bible.com/bible/157/MAT.1.SCH2000';
alter table public.app_settings add column if not exists home_motivation text;
alter table public.app_settings add column if not exists home_verse text;
alter table public.app_settings add column if not exists home_verse_ref text;

create extension if not exists pgcrypto with schema extensions;

create or replace function public.team_members_with_passcode(passcode text)
returns table(
  id uuid,
  name text,
  email text,
  roles text[],
  phone text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare h text;
begin
  if auth.uid() is not null then
    return query select t.id,t.name,t.email,t.roles,t.phone from public.team_members t order by t.name;
    return;
  end if;

  select pass_hash into h from public.team_access_config where singleton=true;

  if h is null or extensions.crypt(coalesce(passcode,''),h) <> h then
    raise exception 'invalid team passcode' using errcode='28000';
  end if;

  return query select t.id,t.name,t.email,t.roles,t.phone from public.team_members t order by t.name;
end;
$$;

revoke all on function public.team_members_with_passcode(text) from public;
grant execute on function public.team_members_with_passcode(text) to anon, authenticated;

notify pgrst, 'reload schema';

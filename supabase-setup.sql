-- Gospel Forum Kalender V10 – Supabase Setup
-- Im Supabase SQL Editor vollständig ausführen.

create extension if not exists pgcrypto;

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_date date not null,
  end_date date,
  start_time time,
  end_time time,
  category text not null default 'event',
  location text,
  description text,
  created_by text not null,
  created_by_email text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.calendar_events drop constraint if exists calendar_events_status_check;
alter table public.calendar_events add constraint calendar_events_status_check
  check (status in ('pending','published','rejected'));

alter table public.calendar_events drop constraint if exists calendar_events_date_order;
alter table public.calendar_events add constraint calendar_events_date_order
  check (end_date is null or end_date >= start_date);

alter table public.calendar_events drop constraint if exists calendar_events_category_check;

create table if not exists public.calendar_categories (
  slug text primary key,
  name text not null unique,
  allow_proposals boolean not null default true,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

insert into public.calendar_categories(slug,name,allow_proposals,active,sort_order) values
  ('event','Event',true,true,10),
  ('gottesdienst','Gottesdienst',true,true,20),
  ('leitung','Leitertermin',true,true,30),
  ('ferien','Ferien',false,true,40)
on conflict (slug) do update set
  name=excluded.name,
  allow_proposals=excluded.allow_proposals,
  active=excluded.active,
  sort_order=excluded.sort_order;

create table if not exists public.calendar_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.calendar_events enable row level security;
alter table public.calendar_categories enable row level security;
alter table public.calendar_admins enable row level security;

create or replace function public.is_calendar_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.calendar_admins a
    where a.user_id = auth.uid()
  );
$$;

drop policy if exists "Public can read calendar requests" on public.calendar_events;
drop policy if exists "Public can submit pending calendar events" on public.calendar_events;
drop policy if exists "Admins can update calendar events" on public.calendar_events;
drop policy if exists "Admins can delete calendar events" on public.calendar_events;

create policy "Public can read calendar requests"
on public.calendar_events
for select
to anon, authenticated
using (status in ('published','pending') or public.is_calendar_admin());

create policy "Public can submit pending calendar events"
on public.calendar_events
for insert
to anon, authenticated
with check (
  status = 'pending'
  and created_by is not null
  and created_by_email is not null
);

create policy "Admins can update calendar events"
on public.calendar_events
for update
to authenticated
using (public.is_calendar_admin())
with check (public.is_calendar_admin());

create policy "Admins can delete calendar events"
on public.calendar_events
for delete
to authenticated
using (public.is_calendar_admin());

drop policy if exists "Public can read active categories" on public.calendar_categories;
drop policy if exists "Admins can insert categories" on public.calendar_categories;
drop policy if exists "Admins can update categories" on public.calendar_categories;
drop policy if exists "Admins can delete categories" on public.calendar_categories;

create policy "Public can read active categories"
on public.calendar_categories
for select
to anon, authenticated
using (active = true or public.is_calendar_admin());

create policy "Admins can insert categories"
on public.calendar_categories
for insert
to authenticated
with check (public.is_calendar_admin());

create policy "Admins can update categories"
on public.calendar_categories
for update
to authenticated
using (public.is_calendar_admin())
with check (public.is_calendar_admin());

create policy "Admins can delete categories"
on public.calendar_categories
for delete
to authenticated
using (public.is_calendar_admin());

drop policy if exists "Admins can read own admin row" on public.calendar_admins;
create policy "Admins can read own admin row"
on public.calendar_admins
for select
to authenticated
using (user_id = auth.uid());

revoke all on table public.calendar_events from anon, authenticated;

grant select (
  id,title,start_date,end_date,start_time,end_time,category,location,
  description,created_by,status,created_at,updated_at
) on public.calendar_events to anon, authenticated;

grant insert (
  title,start_date,end_date,start_time,end_time,category,location,
  description,created_by,created_by_email,status
) on public.calendar_events to anon, authenticated;

grant update, delete on public.calendar_events to authenticated;

grant select on public.calendar_categories to anon, authenticated;
grant insert, update, delete on public.calendar_categories to authenticated;
grant select on public.calendar_admins to authenticated;

create or replace function public.set_calendar_event_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_calendar_event_updated_at on public.calendar_events;
create trigger set_calendar_event_updated_at
before update on public.calendar_events
for each row execute function public.set_calendar_event_updated_at();

-- ADMIN EINRICHTEN:
-- 1. Supabase -> Authentication -> Users -> Add user
-- 2. Danach die E-Mail unten ersetzen und ausführen:
--
-- insert into public.calendar_admins(user_id)
-- select id from auth.users
-- where lower(email)=lower('DEINE-ADMIN-EMAIL@gospel-forum.de')
-- on conflict (user_id) do nothing;

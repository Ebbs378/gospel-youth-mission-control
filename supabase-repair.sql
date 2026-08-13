-- Gospel Forum Kalender V10 – Reparatur für Terminvorschläge
-- Nur nötig, falls INSERTs weiterhin an RLS/Berechtigungen scheitern.

alter table public.calendar_events enable row level security;

grant insert (
  title,start_date,end_date,start_time,end_time,category,location,
  description,created_by,created_by_email,status
) on public.calendar_events to anon, authenticated;

drop policy if exists "Public can submit pending calendar events"
on public.calendar_events;

create policy "Public can submit pending calendar events"
on public.calendar_events
for insert
to anon, authenticated
with check (
  status = 'pending'
  and created_by is not null
  and created_by_email is not null
);

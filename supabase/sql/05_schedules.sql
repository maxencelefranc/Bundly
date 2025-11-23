-- Work schedules for couple members
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  person_id uuid references public.profiles(id) on delete set null,
  at_date date not null,
  start_time time not null,
  end_time time not null,
  location text,
  role text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.schedule_imports (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  raw_text text not null,
  parsed_at timestamptz,
  status text check (status in ('pending','parsed','error')) not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.schedules enable row level security;
alter table public.schedule_imports enable row level security;

create policy schedules_select on public.schedules
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.couple_id = couple_id));
create policy schedules_mod on public.schedules
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.couple_id = couple_id));

create policy schimp_select on public.schedule_imports
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.couple_id = couple_id));
create policy schimp_mod on public.schedule_imports
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.couple_id = couple_id));

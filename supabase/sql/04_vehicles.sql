-- Vehicles and maintenance schema
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  name text,
  brand text,
  model text,
  plate text,
  year int,
  mileage int,
  insurance_expiry date,
  tech_control_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicle_maintenances (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  title text not null,
  type text check (type in ('oil','tire','brake','inspection','battery','custom')),
  due_date date,
  due_mileage int,
  recurrence_months int,
  completed boolean not null default false,
  completed_at date,
  cost numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicle_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  at_date date not null default (now()::date),
  mileage int,
  kind text check (kind in ('refuel','service','repair','check')) not null,
  cost numeric,
  notes text,
  created_at timestamptz not null default now()
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_vehicles_updated on public.vehicles;
create trigger trg_vehicles_updated before update on public.vehicles
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_vehicle_maint_updated on public.vehicle_maintenances;
create trigger trg_vehicle_maint_updated before update on public.vehicle_maintenances
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.vehicles enable row level security;
alter table public.vehicle_maintenances enable row level security;
alter table public.vehicle_logs enable row level security;

create policy vehicles_select on public.vehicles
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.couple_id = couple_id));
create policy vehicles_mod on public.vehicles
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.couple_id = couple_id));

create policy maint_select on public.vehicle_maintenances
  for select using (exists (
    select 1 from public.vehicles v join public.profiles p on p.couple_id = v.couple_id
    where v.id = vehicle_id and p.id = auth.uid()
  ));
create policy maint_mod on public.vehicle_maintenances
  for all using (exists (
    select 1 from public.vehicles v join public.profiles p on p.couple_id = v.couple_id
    where v.id = vehicle_id and p.id = auth.uid()
  ));

create policy vlog_select on public.vehicle_logs
  for select using (exists (
    select 1 from public.vehicles v join public.profiles p on p.couple_id = v.couple_id
    where v.id = vehicle_id and p.id = auth.uid()
  ));
create policy vlog_mod on public.vehicle_logs
  for all using (exists (
    select 1 from public.vehicles v join public.profiles p on p.couple_id = v.couple_id
    where v.id = vehicle_id and p.id = auth.uid()
  ));

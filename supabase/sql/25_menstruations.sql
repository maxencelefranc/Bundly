-- Menstruations tracking
-- Table periods: each row marks start of a period; optional end_date captured later.
create table if not exists public.menstruation_periods (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  couple_id uuid references public.couples(id) on delete cascade,
  start_date date not null,
  end_date date,
  flow_level int check (flow_level between 1 and 5), -- intensité optionnelle
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.menstruation_periods enable row level security;

-- Remove old policies if rerun
DO $$
BEGIN
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='menstruation_periods' and policyname='Members select menstruation_periods') THEN
    DROP POLICY "Members select menstruation_periods" ON public.menstruation_periods; END IF;
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='menstruation_periods' and policyname='Members insert menstruation_periods') THEN
    DROP POLICY "Members insert menstruation_periods" ON public.menstruation_periods; END IF;
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='menstruation_periods' and policyname='Members update menstruation_periods') THEN
    DROP POLICY "Members update menstruation_periods" ON public.menstruation_periods; END IF;
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='menstruation_periods' and policyname='Members delete menstruation_periods') THEN
    DROP POLICY "Members delete menstruation_periods" ON public.menstruation_periods; END IF;
END$$;

create policy "Members select menstruation_periods" on public.menstruation_periods
  for select using (public.is_couple_member(couple_id));
create policy "Members insert menstruation_periods" on public.menstruation_periods
  for insert with check (public.is_couple_member(couple_id));
create policy "Members update menstruation_periods" on public.menstruation_periods
  for update using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));
create policy "Members delete menstruation_periods" on public.menstruation_periods
  for delete using (public.is_couple_member(couple_id));

-- Trigger to stamp couple_id / updated_at
create or replace function public.trg_menstruation_periods_defaults()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if new.couple_id is null then
      select couple_id into new.couple_id from public.profiles where id = new.profile_id;
    end if;
    new.created_at := coalesce(new.created_at, now());
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_menstruation_periods_defaults on public.menstruation_periods;
create trigger trg_menstruation_periods_defaults
before insert or update on public.menstruation_periods
for each row execute function public.trg_menstruation_periods_defaults();

create index if not exists menstruation_periods_profile_start_idx on public.menstruation_periods(profile_id, start_date desc);

-- Stats / prediction: uses last 12 cycles
create or replace function public.get_menstruation_stats(
  p_profile uuid default auth.uid()
) returns table(
  cycles_count int,
  avg_cycle_length numeric,
  avg_period_length numeric,
  last_start date,
  last_end date,
  predicted_next_start date
) language sql stable as $$
  with periods as (
    select * from public.menstruation_periods where profile_id = p_profile order by start_date asc
  ), enriched as (
    select *, lead(start_date) over (order by start_date) as next_start from periods
  ), limited as (
    select * from enriched order by start_date desc limit 12
  )
  select 
    (select count(*) from periods) as cycles_count,
    (select avg((next_start - start_date)) from limited where next_start is not null)::numeric(5,2) as avg_cycle_length,
    (select avg((coalesce(end_date, start_date) - start_date + 1)) from limited where end_date is not null)::numeric(5,2) as avg_period_length,
    (select max(start_date) from periods) as last_start,
    (select max(end_date) from periods) as last_end,
    (select (max(start_date) + coalesce((select avg((next_start - start_date)) from limited where next_start is not null), 28)::int) from periods) as predicted_next_start;
$$;

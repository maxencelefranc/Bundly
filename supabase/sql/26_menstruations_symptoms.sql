-- Migration: add title to periods and symptoms table
alter table public.menstruation_periods add column if not exists title text;

create table if not exists public.menstruation_period_symptoms (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.menstruation_periods(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  couple_id uuid references public.couples(id) on delete cascade,
  symptom_type text not null, -- e.g. cramps, headache, mood, bloating
  intensity int check (intensity between 1 and 5),
  notes text,
  occurred_at date not null default (now()::date),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.menstruation_period_symptoms enable row level security;

-- Clean old policies if re-run
DO $$
BEGIN
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='menstruation_period_symptoms' and policyname='Members select menstruation_period_symptoms') THEN
    DROP POLICY "Members select menstruation_period_symptoms" ON public.menstruation_period_symptoms; END IF;
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='menstruation_period_symptoms' and policyname='Members insert menstruation_period_symptoms') THEN
    DROP POLICY "Members insert menstruation_period_symptoms" ON public.menstruation_period_symptoms; END IF;
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='menstruation_period_symptoms' and policyname='Members update menstruation_period_symptoms') THEN
    DROP POLICY "Members update menstruation_period_symptoms" ON public.menstruation_period_symptoms; END IF;
  IF EXISTS (select 1 from pg_policies where schemaname='public' and tablename='menstruation_period_symptoms' and policyname='Members delete menstruation_period_symptoms') THEN
    DROP POLICY "Members delete menstruation_period_symptoms" ON public.menstruation_period_symptoms; END IF;
END$$;

create policy "Members select menstruation_period_symptoms" on public.menstruation_period_symptoms for select using (public.is_couple_member(couple_id));
create policy "Members insert menstruation_period_symptoms" on public.menstruation_period_symptoms for insert with check (public.is_couple_member(couple_id));
create policy "Members update menstruation_period_symptoms" on public.menstruation_period_symptoms for update using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));
create policy "Members delete menstruation_period_symptoms" on public.menstruation_period_symptoms for delete using (public.is_couple_member(couple_id));

create or replace function public.trg_menstruation_period_symptoms_defaults()
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

drop trigger if exists trg_menstruation_period_symptoms_defaults on public.menstruation_period_symptoms;
create trigger trg_menstruation_period_symptoms_defaults
before insert or update on public.menstruation_period_symptoms
for each row execute function public.trg_menstruation_period_symptoms_defaults();

create index if not exists menstruation_period_symptoms_period_idx on public.menstruation_period_symptoms(period_id, occurred_at desc);

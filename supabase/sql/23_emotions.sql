create table if not exists public.emotions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  mood int not null check (mood between 1 and 5), -- 1: très bas, 5: excellent
  emotion text, -- ex: joy, triste, stress, colère, calme, etc.
  tags text[],
  note text,
  occurred_at timestamp with time zone not null default now(),
  day date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.emotions enable row level security;

do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='emotions' and policyname='Members select emotions') then
    drop policy "Members select emotions" on public.emotions;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='emotions' and policyname='Members insert emotions') then
    drop policy "Members insert emotions" on public.emotions;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='emotions' and policyname='Members update emotions') then
    drop policy "Members update emotions" on public.emotions;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='emotions' and policyname='Members delete emotions') then
    drop policy "Members delete emotions" on public.emotions;
  end if;
end$$;

create policy "Members select emotions" on public.emotions
  for select using (public.is_couple_member(couple_id));

create policy "Members insert emotions" on public.emotions
  for insert with check (public.is_couple_member(couple_id));

create policy "Members update emotions" on public.emotions
  for update using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));

create policy "Members delete emotions" on public.emotions
  for delete using (public.is_couple_member(couple_id));

-- helper to stamp couple_id/created_by and updated_at
create or replace function public.trg_emotions_defaults()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if new.couple_id is null then
      select couple_id into new.couple_id from public.profiles where id = auth.uid();
    end if;
    new.created_by := coalesce(new.created_by, auth.uid());
    new.created_at := coalesce(new.created_at, now());
    -- compute immutable day value in UTC for indexing/grouping
    new.day := ((new.occurred_at at time zone 'UTC')::date);
  else
    -- on update, recompute day only if occurred_at changed
    if new.occurred_at is distinct from old.occurred_at then
      new.day := ((new.occurred_at at time zone 'UTC')::date);
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_emotions_defaults on public.emotions;
create trigger trg_emotions_defaults
before insert or update on public.emotions
for each row execute function public.trg_emotions_defaults();

-- useful indexes
create index if not exists emotions_couple_occurred_idx on public.emotions (couple_id, occurred_at desc);
create index if not exists emotions_couple_day_idx on public.emotions (couple_id, day);

-- Simple stats for a period
create or replace function public.get_emotions_stats(
  p_from timestamptz default (now() - interval '30 days'),
  p_to   timestamptz default now()
) returns table(
  total integer,
  avg_mood numeric,
  mood_counts jsonb,
  first_at timestamptz,
  last_at timestamptz
) language sql stable as $$
  with me as (
    select couple_id from public.profiles where id = auth.uid()
  ), base as (
    select e.* from public.emotions e
    join me on me.couple_id = e.couple_id
    where e.occurred_at >= p_from and e.occurred_at <= p_to
  ), counts as (
    select jsonb_object_agg(mood::text, cnt) as c
    from (
      select mood, count(*) as cnt from base group by mood
    ) s
  )
  select
    (select count(*) from base) as total,
    (select avg(mood)::numeric(4,2) from base) as avg_mood,
    coalesce((select c from counts), '{}'::jsonb) as mood_counts,
    (select min(occurred_at) from base) as first_at,
    (select max(occurred_at) from base) as last_at;
$$;

-- Time series aggregation (day or week buckets)
create or replace function public.get_emotions_series(
  p_from timestamptz default (now() - interval '30 days'),
  p_to   timestamptz default now(),
  p_bucket text default 'day'
) returns table(
  bucket_start date,
  avg_mood numeric,
  count integer
) language sql stable as $$
  with me as (
    select couple_id from public.profiles where id = auth.uid()
  ), base as (
    select e.* from public.emotions e
    join me on me.couple_id = e.couple_id
    where e.occurred_at >= p_from and e.occurred_at <= p_to
  ), bucketted as (
    select 
      case when p_bucket = 'week' 
           then (date_trunc('week', occurred_at))::date
           else (date_trunc('day', occurred_at))::date end as b,
      mood
    from base
  )
  select b as bucket_start,
         avg(mood)::numeric(4,2) as avg_mood,
         count(*)::int as count
  from bucketted
  group by b
  order by b asc;
$$;

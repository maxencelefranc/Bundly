-- Food items for anti-waste
create table if not exists public.food_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  name text not null,
  category text,
  location text,
  expiration_date date not null,
  quantity int,
  status text check (status in ('fresh', 'soon', 'expired')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.food_items enable row level security;

-- Reset policies to be explicit per action (helps with UPSERT + RETURNING)
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='food_items' and policyname='Members can CRUD their food items') then
    drop policy "Members can CRUD their food items" on public.food_items;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='food_items' and policyname='Members select food') then
    drop policy "Members select food" on public.food_items;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='food_items' and policyname='Members insert food') then
    drop policy "Members insert food" on public.food_items;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='food_items' and policyname='Members update food') then
    drop policy "Members update food" on public.food_items;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='food_items' and policyname='Members delete food') then
    drop policy "Members delete food" on public.food_items;
  end if;
end$$;

create policy "Members select food" on public.food_items
  for select using (public.is_couple_member(couple_id));

create policy "Members insert food" on public.food_items
  for insert with check (public.is_couple_member(couple_id));

create policy "Members update food" on public.food_items
  for update using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));

create policy "Members delete food" on public.food_items
  for delete using (public.is_couple_member(couple_id));

-- Trigger to update updated_at on change
-- Helper: current user's couple id
create or replace function public.current_user_couple_id()
returns uuid as $$
  select couple_id from public.profiles where id = auth.uid();
$$ language sql stable;

-- Defaults + guards: always stamp updated_at; ensure couple_id matches caller
create or replace function public.trg_food_items_defaults()
returns trigger as $$
declare
  v_couple uuid;
begin
  v_couple := public.current_user_couple_id();
  if tg_op = 'INSERT' then
    if v_couple is null then
      raise exception 'User has no couple';
    end if;
    new.couple_id := v_couple; -- enforce ownership
    new.created_at := coalesce(new.created_at, now());
  else
    -- UPDATE: prevent cross-couple moves
    if new.couple_id is distinct from old.couple_id then
      new.couple_id := old.couple_id;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_food_items_updated_at on public.food_items;
drop trigger if exists trg_food_items_defaults on public.food_items;
create trigger trg_food_items_defaults
before insert or update on public.food_items
for each row execute function public.trg_food_items_defaults();

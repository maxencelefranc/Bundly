-- Anti-gaspi events to compute avoided waste stats
create table if not exists public.food_item_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  item_id uuid,
  name text,
  category text,
  location text,
  expiration_date date,
  event_type text not null check (event_type in ('consumed','discarded','added')),
  quantity int not null default 1,
  event_at timestamp with time zone default now()
);

alter table public.food_item_events enable row level security;

do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='food_item_events' and policyname='Members select events') then
    drop policy "Members select events" on public.food_item_events;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='food_item_events' and policyname='Members insert events') then
    drop policy "Members insert events" on public.food_item_events;
  end if;
end$$;

create policy "Members select events" on public.food_item_events
  for select using (public.is_couple_member(couple_id));

create policy "Members insert events" on public.food_item_events
  for insert with check (public.is_couple_member(couple_id));

-- Helper to log an event; SECURITY DEFINER to set couple_id automatically
create or replace function public.log_food_event(p_item_id uuid, p_name text, p_category text, p_location text,
  p_expiration date, p_type text, p_qty int)
returns void
language plpgsql security definer
set search_path = public as $$
declare
  v_couple uuid;
begin
  select couple_id into v_couple from public.profiles where id = auth.uid();
  if v_couple is null then
    raise exception 'User has no couple';
  end if;
  insert into public.food_item_events (couple_id, item_id, name, category, location, expiration_date, event_type, quantity)
  values (v_couple, p_item_id, p_name, p_category, p_location, p_expiration, p_type, greatest(1, coalesce(p_qty,1)));
end;
$$;

grant execute on function public.log_food_event(uuid, text, text, text, date, text, int) to authenticated;

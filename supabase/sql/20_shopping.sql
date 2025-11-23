-- Shopping lists and items
create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  name text not null default 'Courses',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  list_id uuid references public.shopping_lists(id) on delete set null,
  name text not null,
  category text,
  quantity int not null default 1 check (quantity > 0),
  picked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shopping_lists enable row level security;
alter table public.shopping_items enable row level security;

-- Recreate policies safely
drop policy if exists "Members can CRUD shopping_lists" on public.shopping_lists;
create policy "Members can CRUD shopping_lists" on public.shopping_lists
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

drop policy if exists "Members can CRUD shopping_items" on public.shopping_items;
create policy "Members can CRUD shopping_items" on public.shopping_items
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

-- Trigger to update updated_at
create or replace function public.set_updated_at_shopping()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_shopping_lists_updated on public.shopping_lists;
create trigger trg_shopping_lists_updated
before update on public.shopping_lists
for each row execute function public.set_updated_at_shopping();

drop trigger if exists trg_shopping_items_updated on public.shopping_items;
create trigger trg_shopping_items_updated
before update on public.shopping_items
for each row execute function public.set_updated_at_shopping();

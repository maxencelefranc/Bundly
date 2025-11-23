-- Couples table
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique default encode(gen_random_bytes(6), 'hex'),
  created_at timestamp with time zone default now()
);

alter table public.couples enable row level security;

-- Members of a couple are anyone whose profile.couple_id = couples.id
-- We'll create a helper function to check membership
create or replace function public.is_couple_member(c_id uuid)
returns boolean as $$
  select exists(select 1 from public.profiles p where p.id = auth.uid() and p.couple_id = c_id);
$$ language sql stable;

create policy "Couple members can read couple" on public.couples
  for select using (public.is_couple_member(id));

-- Optionally allow couple creation to any authenticated user
create policy "Authenticated can insert couples" on public.couples
  for insert with check (auth.uid() is not null);

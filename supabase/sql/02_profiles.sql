-- Profiles table mirrors auth.users (runs after couples creation)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  couple_id uuid references public.couples(id),
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

-- Users can read/update only their profile (create policies if missing)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Individuals can view own profile'
  ) then
    create policy "Individuals can view own profile" on public.profiles
      for select using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Individuals can update own profile'
  ) then
    create policy "Individuals can update own profile" on public.profiles
      for update using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Individuals can insert own profile'
  ) then
    create policy "Individuals can insert own profile" on public.profiles
      for insert with check (auth.uid() = id);
  end if;
end $$;

-- Helper function and policy on couples now that profiles exists
create or replace function public.is_couple_member(c_id uuid)
returns boolean as $$
  select exists(select 1 from public.profiles p where p.id = auth.uid() and p.couple_id = c_id);
$$ language sql stable;

do $$
declare
  has_created_by boolean;
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='couples' and policyname='Couple members can read couple'
  ) then
    create policy "Couple members can read couple" on public.couples
      for select using (public.is_couple_member(id));
  end if;

  select exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='couples' and column_name='created_by'
  ) into has_created_by;

  if has_created_by then
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='couples' and policyname='Creator can read couple'
    ) then
      create policy "Creator can read couple" on public.couples
        for select using (created_by = auth.uid());
    end if;
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='couples' and policyname='Creator can update couple'
    ) then
      create policy "Creator can update couple" on public.couples
        for update using (created_by = auth.uid()) with check (created_by = auth.uid());
    end if;
  end if;
end $$;

-- Allow members of the same couple to view each other's basic profile (for members list)
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Couple members can view profiles'
  ) then
    create policy "Couple members can view profiles" on public.profiles
      for select using (
        couple_id is not null and couple_id = (
          select couple_id from public.profiles where id = auth.uid()
        )
      );
  end if;
end $$;

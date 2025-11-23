-- Profiles table mirrors auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  couple_id uuid references public.couples(id),
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

-- Users can read/update only their profile
create policy "Individuals can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Individuals can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Allow authenticated user to insert their own row (first login)
create policy "Individuals can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

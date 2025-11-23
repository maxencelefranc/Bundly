-- Couples table (renamed to run before profiles)
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique default encode(gen_random_bytes(6), 'hex'),
  created_by uuid default auth.uid(),
  created_at timestamp with time zone default now()
);

alter table public.couples enable row level security;

-- Optionally allow couple creation to any authenticated user
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='couples' and policyname='Authenticated can insert couples'
  ) then
    create policy "Authenticated can insert couples" on public.couples
      for insert with check (auth.uid() is not null);
  end if;
end $$;

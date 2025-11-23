-- Ensure INSERT and SELECT policies are present for couples
alter table public.couples enable row level security;

do $$
begin
  -- Allow any authenticated user to insert a couple
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='couples' and policyname='Authenticated can insert couples'
  ) then
    create policy "Authenticated can insert couples" on public.couples
      for insert with check (auth.uid() is not null);
  end if;
end $$;

-- If the created_by column exists, ensure the creator can read the row right away
do $$
declare has_created_by boolean;
begin
  select exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='couples' and column_name='created_by'
  ) into has_created_by;

  if has_created_by then
    if not exists (
      select 1 from pg_policies
      where schemaname='public' and tablename='couples' and policyname='Creator can read couple'
    ) then
      create policy "Creator can read couple" on public.couples
        for select using (created_by = auth.uid());
    end if;
  end if;
end $$;

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';

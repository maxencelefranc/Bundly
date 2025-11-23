-- Add created_by to couples for existing databases and grant read to creator
alter table public.couples add column if not exists created_by uuid;
alter table public.couples alter column created_by set default auth.uid();

-- Backfill created_by for existing rows with the first profile found of that couple if possible (best effort)
-- Note: If no profile references the couple yet, created_by stays null but future inserts will set it.
-- This block is intentionally simple and idempotent.
update public.couples c
set created_by = p.id
from public.profiles p
where c.created_by is null and p.couple_id = c.id;

-- Ensure policy exists
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='couples' and policyname='Creator can read couple'
  ) then
    create policy "Creator can read couple" on public.couples
      for select using (created_by = auth.uid());
  end if;
end $$;

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';

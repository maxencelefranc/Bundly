-- Ensure couples.invite_code exists and is populated, with default and uniqueness
alter table public.couples add column if not exists invite_code text;

-- Populate missing codes
update public.couples
set invite_code = encode(gen_random_bytes(6), 'hex')
where invite_code is null;

-- Set default for future inserts
alter table public.couples alter column invite_code set default encode(gen_random_bytes(6), 'hex');

-- Add unique constraint if not exists
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.couples'::regclass
      and contype = 'u'
      and conname = 'couples_invite_code_key'
  ) then
    alter table public.couples add constraint couples_invite_code_key unique(invite_code);
  end if;
end $$;

-- Ask PostgREST to reload its schema cache
notify pgrst, 'reload schema';

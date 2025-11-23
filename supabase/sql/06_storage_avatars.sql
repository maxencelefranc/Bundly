-- Create a public bucket for avatars and basic policies
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Enable RLS on storage.objects if not already
-- Policies for the avatars bucket
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Public read avatars'
  ) then
    create policy "Public read avatars" on storage.objects
      for select using ( bucket_id = 'avatars' );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Authenticated can upload own avatars'
  ) then
    create policy "Authenticated can upload own avatars" on storage.objects
      for insert with check ( bucket_id = 'avatars' and auth.uid() = owner );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Users can update own avatars'
  ) then
    create policy "Users can update own avatars" on storage.objects
      for update using ( bucket_id = 'avatars' and auth.uid() = owner );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Users can delete own avatars'
  ) then
    create policy "Users can delete own avatars" on storage.objects
      for delete using ( bucket_id = 'avatars' and auth.uid() = owner );
  end if;
end $$;

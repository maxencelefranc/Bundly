-- Secure RPCs to manage couple joining and invite regeneration

-- Join couple by invite code: sets the caller's profile.couple_id
create or replace function public.join_couple_by_code(p_code text)
returns uuid
language plpgsql security definer
set search_path = public as $$
declare
  c_id uuid;
begin
  select id into c_id from public.couples where invite_code = p_code limit 1;
  if c_id is null then
    raise exception 'Invalid invite code';
  end if;
  update public.profiles set couple_id = c_id where id = auth.uid();
  return c_id;
end;
$$;

grant execute on function public.join_couple_by_code(text) to authenticated;

-- Regenerate invite code for the caller's couple and return the new code
create or replace function public.regenerate_invite_code()
returns text
language plpgsql security definer
set search_path = public as $$
declare
  c_id uuid;
  new_code text;
begin
  select couple_id into c_id from public.profiles where id = auth.uid();
  if c_id is null then
    raise exception 'No couple to regenerate invite for';
  end if;
  select encode(gen_random_bytes(6), 'hex') into new_code;
  update public.couples set invite_code = new_code where id = c_id;
  return new_code;
end;
$$;

grant execute on function public.regenerate_invite_code() to authenticated;

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';

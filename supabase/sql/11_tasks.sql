-- Shared Tasks (lists + tasks) with couple-based RLS
-- Safeguard: rename mistaken 'tasks_lists' table to 'task_lists' if it exists.
do $$
begin
  if exists (
    select 1 from information_schema.tables where table_schema='public' and table_name='tasks_lists'
  ) and not exists (
    select 1 from information_schema.tables where table_schema='public' and table_name='task_lists'
  ) then
    execute 'alter table public.tasks_lists rename to task_lists';
  end if;
end $$;

create table if not exists public.task_lists (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  name text not null,
  created_by uuid default auth.uid(),
  created_at timestamp with time zone default now()
);

alter table public.task_lists enable row level security;

-- Couple members can manage their task lists
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='task_lists' and policyname='Members select lists'
  ) then
    create policy "Members select lists" on public.task_lists
      for select using (public.is_couple_member(couple_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='task_lists' and policyname='Members insert lists'
  ) then
    create policy "Members insert lists" on public.task_lists
      for insert with check (public.is_couple_member(couple_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='task_lists' and policyname='Members update lists'
  ) then
    create policy "Members update lists" on public.task_lists
      for update using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='task_lists' and policyname='Members delete lists'
  ) then
    create policy "Members delete lists" on public.task_lists
      for delete using (public.is_couple_member(couple_id));
  end if;
end $$;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  list_id uuid references public.task_lists(id) on delete set null,
  title text not null,
  done boolean not null default false,
  due_date date,
  created_by uuid default auth.uid(),
  completed_at timestamp with time zone,
  updated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

alter table public.tasks enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tasks' and policyname='Members select tasks'
  ) then
    create policy "Members select tasks" on public.tasks
      for select using (public.is_couple_member(couple_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tasks' and policyname='Members insert tasks'
  ) then
    create policy "Members insert tasks" on public.tasks
      for insert with check (public.is_couple_member(couple_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tasks' and policyname='Members update tasks'
  ) then
    create policy "Members update tasks" on public.tasks
      for update using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='tasks' and policyname='Members delete tasks'
  ) then
    create policy "Members delete tasks" on public.tasks
      for delete using (public.is_couple_member(couple_id));
  end if;
end $$;

-- Helpful view for ordering undone first then recent updates
create or replace view public.v_tasks as
  select *, (case when done then 1 else 0 end) as done_int
  from public.tasks;

grant select on public.v_tasks to authenticated;

-- reload PostgREST cache
notify pgrst, 'reload schema';

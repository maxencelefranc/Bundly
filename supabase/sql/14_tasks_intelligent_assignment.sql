-- Intelligent task assignment: add columns and RPCs

-- Columns for assignment and prioritization
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tasks') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='assigned_to') THEN
      ALTER TABLE public.tasks ADD COLUMN assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='effort') THEN
      ALTER TABLE public.tasks ADD COLUMN effort integer;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='priority') THEN
      ALTER TABLE public.tasks ADD COLUMN priority integer;
    END IF;
  END IF;
END $$;

-- Helpful index for load queries
CREATE INDEX IF NOT EXISTS idx_tasks_couple_done_assigned ON public.tasks(couple_id, done, assigned_to);

-- Helper: ensure caller is couple member and determine couple id
CREATE OR REPLACE FUNCTION public.distribute_tasks_intelligently(p_couple_id uuid DEFAULT NULL, p_list_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_couple_id uuid;
  v_assigned_count integer := 0;
  r_task record;
  v_candidate uuid;
BEGIN
  -- derive couple from caller if not provided
  IF p_couple_id IS NULL THEN
    SELECT couple_id INTO v_couple_id FROM public.profiles WHERE id = auth.uid();
  ELSE
    v_couple_id := p_couple_id;
  END IF;

  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'Caller has no couple_id';
  END IF;

  -- check membership
  IF NOT public.is_couple_member(v_couple_id) THEN
    RAISE EXCEPTION 'Not a member of this couple';
  END IF;

  -- loop over unassigned, undone tasks oldest first
  FOR r_task IN
    SELECT id
    FROM public.tasks t
    WHERE t.couple_id = v_couple_id
      AND t.done = false
      AND t.assigned_to IS NULL
      AND (p_list_id IS NULL OR t.list_id = p_list_id)
    ORDER BY t.updated_at NULLS FIRST, t.created_at
  LOOP
    -- pick member with lowest current undone load
    SELECT p.id INTO v_candidate
    FROM public.profiles p
    WHERE p.couple_id = v_couple_id
    ORDER BY (
      SELECT COUNT(1) FROM public.tasks tt
      WHERE tt.couple_id = v_couple_id AND tt.done = false AND tt.assigned_to = p.id
    ) ASC,
    p.id ASC
    LIMIT 1;

    IF v_candidate IS NOT NULL THEN
      -- extra safety: only update if candidate still exists
      UPDATE public.tasks SET assigned_to = v_candidate, updated_at = now()
      WHERE id = r_task.id
        AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_candidate);
      IF FOUND THEN
        v_assigned_count := v_assigned_count + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN v_assigned_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.distribute_tasks_intelligently(uuid, uuid) TO authenticated;

-- Claim a single task to current user
CREATE OR REPLACE FUNCTION public.claim_task(p_task_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_couple_id uuid;
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  SELECT couple_id INTO v_couple_id FROM public.tasks WHERE id = p_task_id;
  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'Task not found';
  END IF;
  IF NOT public.is_couple_member(v_couple_id) THEN
    RAISE EXCEPTION 'Not a member of this couple';
  END IF;
  -- Ensure the caller has a profile row with proper couple_id to satisfy FK and membership
  INSERT INTO public.profiles (id, couple_id)
  VALUES (v_uid, v_couple_id)
  ON CONFLICT (id) DO NOTHING;
  BEGIN
    UPDATE public.tasks SET assigned_to = v_uid, updated_at = now() WHERE id = p_task_id AND done = false;
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE EXCEPTION 'Cannot assign: profile row missing for %', v_uid;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_task(uuid) TO authenticated;

-- Reload schema for PostgREST
NOTIFY pgrst, 'reload schema';

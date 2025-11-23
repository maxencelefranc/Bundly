-- Fix missing columns on public.tasks and recreate view v_tasks safely

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tasks'
  ) THEN
    -- Ensure 'done'
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='done'
    ) THEN
      ALTER TABLE public.tasks ADD COLUMN done boolean NOT NULL DEFAULT false;
      -- No update needed; default fills new rows; existing rows get default
    END IF;

    -- Ensure 'due_date'
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='due_date'
    ) THEN
      ALTER TABLE public.tasks ADD COLUMN due_date date;
    END IF;

    -- Ensure 'completed_at'
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='completed_at'
    ) THEN
      ALTER TABLE public.tasks ADD COLUMN completed_at timestamptz;
    END IF;

    -- Ensure 'updated_at'
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='updated_at'
    ) THEN
      ALTER TABLE public.tasks ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;

    -- Ensure 'list_id' referencing task_lists (if column missing)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='list_id'
    ) THEN
      ALTER TABLE public.tasks ADD COLUMN list_id uuid REFERENCES public.task_lists(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Recreate view v_tasks depending on 'done'
DROP VIEW IF EXISTS public.v_tasks;
CREATE VIEW public.v_tasks AS
  SELECT *, (CASE WHEN done THEN 1 ELSE 0 END) AS done_int
  FROM public.tasks;

GRANT SELECT ON public.v_tasks TO authenticated;

-- Reload PostgREST schema
NOTIFY pgrst, 'reload schema';

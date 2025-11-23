-- Switch tasks.assigned_to FK to reference auth.users(id) to avoid missing profile FK violations
DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT constraint_name INTO v_constraint
  FROM information_schema.key_column_usage
  WHERE table_schema='public' AND table_name='tasks' AND column_name='assigned_to';

  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.tasks DROP CONSTRAINT %I', v_constraint);
  END IF;

  -- Recreate FK to auth.users(id)
  ALTER TABLE public.tasks
    ADD CONSTRAINT tasks_assigned_to_fkey
    FOREIGN KEY (assigned_to)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;
END $$;

NOTIFY pgrst, 'reload schema';

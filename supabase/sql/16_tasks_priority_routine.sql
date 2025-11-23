-- Add routine fields to tasks and ensure priority defaults
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tasks') THEN
    -- Ensure priority column exists with a default (2 = normal)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='priority'
    ) THEN
      ALTER TABLE public.tasks ADD COLUMN priority integer DEFAULT 2;
    ELSE
      -- set default if missing
      BEGIN
        ALTER TABLE public.tasks ALTER COLUMN priority SET DEFAULT 2;
      EXCEPTION WHEN others THEN
        -- ignore if cannot set default due to type constraints
        NULL;
      END;
    END IF;

    -- Add routine flags
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='is_routine'
    ) THEN
      ALTER TABLE public.tasks ADD COLUMN is_routine boolean NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='routine_every_days'
    ) THEN
      ALTER TABLE public.tasks ADD COLUMN routine_every_days integer;
    END IF;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

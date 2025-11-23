-- Add simple category text to tasks
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tasks') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='category'
    ) THEN
      ALTER TABLE public.tasks ADD COLUMN category text;
    END IF;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

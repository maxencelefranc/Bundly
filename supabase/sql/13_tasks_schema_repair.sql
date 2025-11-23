-- Idempotent réparation du schéma Tasks (task_lists + tasks + vue + RLS)
-- Traite les cas suivants:
-- 1. Table mal nommée 'tasks_lists'
-- 2. Absence de 'task_lists'
-- 3. Absence ou colonne manquante dans 'tasks'
-- 4. Vue 'v_tasks' cassée
-- 5. Politiques RLS manquantes

DO $$
BEGIN
  -- Renommer l'ancienne table fautive si présente
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tasks_lists')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='task_lists') THEN
    EXECUTE 'ALTER TABLE public.tasks_lists RENAME TO task_lists';
  END IF;
END $$;

-- Créer task_lists si absente
CREATE TABLE IF NOT EXISTS public.task_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.task_lists ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Politiques task_lists
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='task_lists' AND policyname='Members select lists') THEN
    CREATE POLICY "Members select lists" ON public.task_lists FOR SELECT USING (public.is_couple_member(couple_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='task_lists' AND policyname='Members insert lists') THEN
    CREATE POLICY "Members insert lists" ON public.task_lists FOR INSERT WITH CHECK (public.is_couple_member(couple_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='task_lists' AND policyname='Members update lists') THEN
    CREATE POLICY "Members update lists" ON public.task_lists FOR UPDATE USING (public.is_couple_member(couple_id)) WITH CHECK (public.is_couple_member(couple_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='task_lists' AND policyname='Members delete lists') THEN
    CREATE POLICY "Members delete lists" ON public.task_lists FOR DELETE USING (public.is_couple_member(couple_id));
  END IF;
END $$;

-- Créer tasks si absente (structure complète)
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  list_id uuid REFERENCES public.task_lists(id) ON DELETE SET NULL,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  due_date date,
  created_by uuid DEFAULT auth.uid(),
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Ajouter colonnes manquantes si la table existait incomplète
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tasks') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='list_id') THEN
      ALTER TABLE public.tasks ADD COLUMN list_id uuid REFERENCES public.task_lists(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='done') THEN
      ALTER TABLE public.tasks ADD COLUMN done boolean NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='due_date') THEN
      ALTER TABLE public.tasks ADD COLUMN due_date date;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='completed_at') THEN
      ALTER TABLE public.tasks ADD COLUMN completed_at timestamptz;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tasks' AND column_name='updated_at') THEN
      ALTER TABLE public.tasks ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  -- Politiques tasks
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tasks' AND policyname='Members select tasks') THEN
    CREATE POLICY "Members select tasks" ON public.tasks FOR SELECT USING (public.is_couple_member(couple_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tasks' AND policyname='Members insert tasks') THEN
    CREATE POLICY "Members insert tasks" ON public.tasks FOR INSERT WITH CHECK (public.is_couple_member(couple_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tasks' AND policyname='Members update tasks') THEN
    CREATE POLICY "Members update tasks" ON public.tasks FOR UPDATE USING (public.is_couple_member(couple_id)) WITH CHECK (public.is_couple_member(couple_id));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tasks' AND policyname='Members delete tasks') THEN
    CREATE POLICY "Members delete tasks" ON public.tasks FOR DELETE USING (public.is_couple_member(couple_id));
  END IF;
END $$;

-- Recréer la vue selon colonne 'done'
DROP VIEW IF EXISTS public.v_tasks;
CREATE VIEW public.v_tasks AS
  SELECT *, (CASE WHEN done THEN 1 ELSE 0 END) AS done_int
  FROM public.tasks;

GRANT SELECT ON public.v_tasks TO authenticated;

NOTIFY pgrst, 'reload schema';

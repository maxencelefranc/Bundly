-- Auto-categorize tasks based on title keywords
-- Idempotent: creates/updates functions; creates trigger if missing; backfills existing tasks

CREATE OR REPLACE FUNCTION public.infer_task_category(p_title text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  t text := lower(coalesce(p_title, ''));
BEGIN
  -- Household / cleaning
  IF t ~ '(poubell|balai|aspir|vaiss|serpill|nettoy|ranger|ménag|menag)' THEN
    RETURN 'Ménage';
  -- Groceries / shopping
  ELSIF t ~ '(course|supermarch|drive|acheter|épicer|magasin|carrefour|courses)' THEN
    RETURN 'Courses';
  -- Cooking / meals
  ELSIF t ~ '(cuisin|repas|déjeun|dej|dîner|diner|cuisine|prépar|prepar|meal)' THEN
    RETURN 'Cuisine';
  -- Laundry
  ELSIF t ~ '(linge|lessiv|machine|étendr|etendr|plis|pliage|repass)' THEN
    RETURN 'Linge';
  -- Administration
  ELSIF t ~ '(admin|imp[oô]t|banque|factur|rdv|rendez|dossier|papiers|urssaf|caf)' THEN
    RETURN 'Admin';
  -- Health
  ELSIF t ~ '(m[ée]decin|pharma|ordonn|m[ée]dicament|sant[ée]|dentist|radio|analyse)' THEN
    RETURN 'Santé';
  -- Pets
  ELSIF t ~ '(chat|chien|liti[eè]re|croquette|v[ée]t[ée]rinaire|veto|animal)' THEN
    RETURN 'Animaux';
  ELSE
    RETURN NULL;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.tasks_autocategorize()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.category IS NULL OR NEW.category = '' THEN
    NEW.category := public.infer_task_category(NEW.title);
  END IF;
  RETURN NEW;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tasks_autocategorize'
  ) THEN
    CREATE TRIGGER trg_tasks_autocategorize
    BEFORE INSERT OR UPDATE OF title ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.tasks_autocategorize();
  END IF;
END $$;

-- Backfill existing tasks once
UPDATE public.tasks
SET category = public.infer_task_category(title)
WHERE category IS NULL;

NOTIFY pgrst, 'reload schema';

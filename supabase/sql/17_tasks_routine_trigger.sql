-- Auto-generate next occurrence for routine tasks when completed
CREATE OR REPLACE FUNCTION public.handle_task_completed_generate_next()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_due date;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.done = true AND COALESCE(OLD.done,false) = false
     AND COALESCE(NEW.is_routine,false) = true
     AND NEW.routine_every_days IS NOT NULL THEN

    v_next_due := (COALESCE(NEW.due_date, current_date) + NEW.routine_every_days);

    INSERT INTO public.tasks (
      couple_id, list_id, title, done, due_date, assigned_to,
      effort, priority, is_routine, routine_every_days, created_by
    ) VALUES (
      NEW.couple_id, NEW.list_id, NEW.title, false, v_next_due, NEW.assigned_to,
      NEW.effort, COALESCE(NEW.priority, 2), true, NEW.routine_every_days, NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_completed_generate_next ON public.tasks;
CREATE TRIGGER trg_task_completed_generate_next
AFTER UPDATE ON public.tasks
FOR EACH ROW
EXECUTE PROCEDURE public.handle_task_completed_generate_next();

NOTIFY pgrst, 'reload schema';

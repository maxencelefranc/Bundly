-- Period summary: symptom frequencies & average intensity
create or replace function public.get_menstruation_period_summary(
  p_period uuid
) returns table(
  symptom_type text,
  occurrences int,
  avg_intensity numeric
) language sql stable as $$
  select symptom_type,
         count(*) as occurrences,
         avg(intensity)::numeric(4,2) as avg_intensity
  from public.menstruation_period_symptoms
  where period_id = p_period
  group by symptom_type
  order by occurrences desc;
$$;

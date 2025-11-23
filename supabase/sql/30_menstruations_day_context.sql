-- Daily menstruation context for debrief
create or replace function public.get_menstruation_day_context(
  p_profile uuid default auth.uid(),
  p_day date default now()::date
) returns table(
  is_period boolean,
  days_to_next_period int,
  days_to_ovulation int,
  fertile_window boolean
) language sql stable as $$
  with stats as (
    select * from public.get_menstruation_stats(p_profile)
  )
  select 
    (select exists (
      select 1 from public.menstruation_periods mp
      where mp.profile_id = p_profile
        and p_day between mp.start_date and coalesce(mp.end_date, mp.start_date + (coalesce((select avg_period_length from stats),5)::int) - 1)
    )) as is_period,
    (select case when (select predicted_next_start from stats) is not null then (select (predicted_next_start - p_day) from stats) else null end)::int as days_to_next_period,
    (select case when (select predicted_ovulation_day from stats) is not null then (select (predicted_ovulation_day - p_day) from stats) else null end)::int as days_to_ovulation,
    (select case when (select predicted_ovulation_day from stats) is not null then p_day between (select predicted_ovulation_day from stats) - 5 and (select predicted_ovulation_day from stats) + 1 else false end) as fertile_window;
$$;

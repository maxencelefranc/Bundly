-- Drop previous version (different return type) before redefining
drop function if exists public.get_menstruation_stats(uuid);

-- Extend menstruation stats with predicted ovulation day
create function public.get_menstruation_stats(
  p_profile uuid default auth.uid()
) returns table(
  cycles_count int,
  avg_cycle_length numeric,
  avg_period_length numeric,
  last_start date,
  last_end date,
  predicted_next_start date,
  predicted_ovulation_day date
) language sql stable as $$
  with periods as (
    select * from public.menstruation_periods where profile_id = p_profile order by start_date asc
  ), enriched as (
    select *, lead(start_date) over (order by start_date) as next_start from periods
  ), limited as (
    select * from enriched order by start_date desc limit 12
  )
  select 
    (select count(*) from periods) as cycles_count,
    (select avg((next_start - start_date)) from limited where next_start is not null)::numeric(5,2) as avg_cycle_length,
    (select avg((coalesce(end_date, start_date) - start_date + 1)) from limited where end_date is not null)::numeric(5,2) as avg_period_length,
    (select max(start_date) from periods) as last_start,
    (select max(end_date) from periods) as last_end,
    (select (max(start_date) + coalesce((select avg((next_start - start_date))::int from limited where next_start is not null), 28)) from periods) as predicted_next_start,
    (select (max(start_date) + coalesce((select avg((next_start - start_date))::int from limited where next_start is not null), 28) - 14) from periods) as predicted_ovulation_day;
$$;

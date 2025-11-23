-- Calendar & prediction RPC for menstruations
create or replace function public.get_menstruation_calendar(
  p_profile uuid default auth.uid(),
  p_from date default (now() - interval '30 days')::date,
  p_to date default (now() + interval '60 days')::date
) returns table(
  day date,
  type text, -- period, predicted_period, ovulation, fertile_window_start, fertile_window, fertile_window_end
  label text
) language sql stable as $$
  with periods as (
    select * from public.menstruation_periods where profile_id = p_profile order by start_date asc
  ), enriched as (
    select *, lead(start_date) over (order by start_date) as next_start from periods
  ), stats as (
    select 
      (select max(start_date) from periods) as last_start,
      coalesce((select avg(next_start - start_date) from enriched where next_start is not null), 28)::int as avg_cycle_length,
      coalesce((select avg((coalesce(end_date, start_date) - start_date + 1)) from periods where end_date is not null), 5)::int as avg_period_length
  ), predicted as (
    select last_start, avg_cycle_length, avg_period_length,
      (last_start + avg_cycle_length) as next_start,
      (last_start + avg_cycle_length - 14) as ovulation_day
    from stats
  ), range_days as (
    select generate_series(p_from, p_to, interval '1 day')::date as d
  ), actual_period_days as (
    select d.d as day, 'period'::text as type, 'Règles'::text as label
    from range_days d
    join periods p on d.d between p.start_date and coalesce(p.end_date, p.start_date + (select avg_period_length from predicted) - 1)
  ), predicted_period_days as (
    select d.d as day, 'predicted_period'::text as type, 'Règles (estim.)'::text as label
    from range_days d, predicted pr
    where d.d between pr.next_start and pr.next_start + pr.avg_period_length - 1
      and not exists (select 1 from actual_period_days ap where ap.day = d.d)
  ), fertile_window as (
    select d.d as day,
      case 
        when d.d = (select ovulation_day from predicted) then 'ovulation'
        when d.d = (select ovulation_day from predicted) - 5 then 'fertile_window_start'
        when d.d = (select ovulation_day from predicted) + 1 then 'fertile_window_end'
        else 'fertile_window'
      end as type,
      case 
        when d.d = (select ovulation_day from predicted) then 'Ovulation'
        when d.d = (select ovulation_day from predicted) - 5 then 'Début période fertile'
        when d.d = (select ovulation_day from predicted) + 1 then 'Fin période fertile'
        else 'Fertile'
      end as label
    from range_days d, predicted pr
    where d.d between pr.ovulation_day - 5 and pr.ovulation_day + 1
  )
  select * from actual_period_days
  union all select * from predicted_period_days
  union all select * from fertile_window
  order by day;
$$;

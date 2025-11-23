-- Réglages debrief émotions (heure + activation) et fonction résumé quotidien
alter table public.profiles
  add column if not exists emotion_debrief_enabled boolean default true,
  add column if not exists emotion_debrief_hour smallint check (emotion_debrief_hour between 0 and 23) default 21;

-- Résumé quotidien des émotions par utilisateur du couple
create or replace function public.get_emotions_day_summary(
  p_day date default (current_date),
  p_couple_id uuid default null
) returns table(
  user_id uuid,
  avg_mood numeric,
  count integer,
  top_emotion text,
  emotions jsonb
) language sql stable as $$
  with me as (
    select coalesce(p_couple_id, couple_id) as couple_id from public.profiles where id = auth.uid()
  ), base as (
    select e.* from public.emotions e
    join me on me.couple_id = e.couple_id
    where e.day = p_day
  ), per_user as (
    select created_by as user_id,
           avg(mood)::numeric(4,2) as avg_mood,
           count(*)::int as count,
           (select emotion from base b2 where b2.created_by = b.created_by and b2.emotion is not null group by emotion order by count(*) desc limit 1) as top_emotion,
           jsonb_agg(jsonb_build_object('id', id, 'mood', mood, 'emotion', emotion, 'occurred_at', occurred_at)) as emotions
    from base b
    group by created_by
  )
  select * from per_user;
$$;

-- Pour usage futur: debrief sur tous les jours où entrées présentes dans la plage
create or replace function public.get_emotions_recent_days_summary(
  p_from date default (current_date - interval '7 days'),
  p_to date default (current_date),
  p_couple_id uuid default null
) returns table(
  day date,
  user_id uuid,
  avg_mood numeric,
  count integer
) language sql stable as $$
  with me as (
    select coalesce(p_couple_id, couple_id) as couple_id from public.profiles where id = auth.uid()
  ), base as (
    select e.* from public.emotions e
    join me on me.couple_id = e.couple_id
    where e.day between p_from and p_to
  )
  select day, created_by as user_id, avg(mood)::numeric(4,2) as avg_mood, count(*)::int as count
  from base
  group by day, created_by
  order by day asc;
$$;

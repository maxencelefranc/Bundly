import { supabase } from 'src/lib/supabase';
import { TABLES } from 'src/lib/dbTables';
import { getOrCreateProfile } from 'src/features/profile/profileApi';
import type { EmotionRow, EmotionsStats, SeriesBucket, EmotionsSeriesPoint } from './types';

export async function addEmotion(input: { mood: number; emotion?: string | null; tags?: string[] | null; note?: string | null; occurred_at?: string | null }): Promise<EmotionRow> {
  const profile = await getOrCreateProfile();
  if (!profile.couple_id) throw new Error('Aucun couple');
  const payload = {
    couple_id: profile.couple_id as string,
    created_by: profile.id,
    mood: input.mood,
    emotion: input.emotion ?? null,
    tags: input.tags ?? null,
    note: input.note ?? null,
    occurred_at: input.occurred_at ?? new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from(TABLES.emotions)
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data as EmotionRow;
}

export async function listEmotions(limit = 50): Promise<EmotionRow[]> {
  const profile = await getOrCreateProfile();
  if (!profile.couple_id) throw new Error('Aucun couple');
  const { data, error } = await supabase
    .from(TABLES.emotions)
    .select('*')
    .eq('couple_id', profile.couple_id as string)
    .order('occurred_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as EmotionRow[];
}

export async function deleteEmotion(id: string): Promise<void> {
  const { error } = await supabase.from(TABLES.emotions).delete().eq('id', id);
  if (error) throw error;
}

export async function getEmotionsStats(days = 30): Promise<EmotionsStats> {
  const today = new Date(); today.setHours(0,0,0,0);
  const from = new Date(today); from.setDate(from.getDate() - Math.max(0, days-1));
  const { data, error } = await supabase.rpc('get_emotions_stats', {
    p_from: from.toISOString(),
    p_to: new Date(today.getTime() + 24*60*60*1000).toISOString(),
  });
  if (error) throw error;
  const row = (data || {}) as any;
  return {
    total: Number(row.total || 0),
    avg_mood: row.avg_mood != null ? Number(row.avg_mood) : null,
    mood_counts: row.mood_counts || {},
    first_at: row.first_at || null,
    last_at: row.last_at || null,
  };
}

export async function getEmotionsSeries(days = 30, bucket: SeriesBucket = 'day'): Promise<EmotionsSeriesPoint[]> {
  const today = new Date(); today.setHours(0,0,0,0);
  const from = new Date(today); from.setDate(from.getDate() - Math.max(0, days-1));
  const { data, error } = await supabase.rpc('get_emotions_series', {
    p_from: from.toISOString(),
    p_to: new Date(today.getTime() + 24*60*60*1000).toISOString(),
    p_bucket: bucket,
  });
  if (error) throw error;
  return (data || []) as EmotionsSeriesPoint[];
}

export type DayUserSummary = { user_id: string; avg_mood: number | null; count: number; top_emotion: string | null; emotions: any[] };
export async function getEmotionsDaySummary(day: Date = new Date()): Promise<DayUserSummary[]> {
  const isoDay = day.toISOString().slice(0,10);
  const { data, error } = await supabase.rpc('get_emotions_day_summary', { p_day: isoDay });
  if (error) throw error;
  return (data || []) as DayUserSummary[];
}

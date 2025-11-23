import { supabase } from 'src/lib/supabase';
import { TABLES } from 'src/lib/dbTables';
import { Schedule, ScheduleImport } from './types';

export async function listSchedules(coupleId: string, from?: string, to?: string): Promise<Schedule[]> {
  let q = supabase.from(TABLES.schedules).select('*').eq('couple_id', coupleId).order('at_date', { ascending: true });
  if (from) q = q.gte('at_date', from);
  if (to) q = q.lte('at_date', to);
  const { data, error } = await q;
  if (error) throw error;
  return data as any;
}

export async function upsertSchedule(s: Partial<Schedule> & { couple_id: string }): Promise<void> {
  const { error } = await supabase.from(TABLES.schedules).upsert(s, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase.from(TABLES.schedules).delete().eq('id', id);
  if (error) throw error;
}

export async function createRawImport(coupleId: string, raw: string): Promise<ScheduleImport> {
  const { data, error } = await supabase.from(TABLES.scheduleImports).insert({ couple_id: coupleId, raw_text: raw }).select('*').single();
  if (error) throw error;
  return data as any;
}

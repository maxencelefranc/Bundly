import { supabase } from 'src/lib/supabase';
import { TABLES } from 'src/lib/dbTables';
import { getOrCreateProfile } from 'src/features/profile/profileApi';

export type MenstruationPeriod = {
  id: string;
  profile_id: string;
  couple_id: string | null;
  start_date: string; // YYYY-MM-DD
  end_date?: string | null;
  flow_level?: number | null;
  notes?: string | null;
  title?: string | null;
  created_at?: string;
  updated_at?: string;
};

export async function listPeriods(limit = 30): Promise<MenstruationPeriod[]> {
  const profile = await getOrCreateProfile();
  const { data, error } = await supabase
    .from(TABLES.menstruationPeriods)
    .select('*')
    .eq('profile_id', profile.id)
    .order('start_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as MenstruationPeriod[];
}

function todayIso() { const d = new Date(); const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const da = String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; }

export async function startPeriod(flow_level?: number | null, notes?: string | null, title?: string | null): Promise<MenstruationPeriod> {
  const profile = await getOrCreateProfile();
  const start_date = todayIso();
  const { data, error } = await supabase
    .from(TABLES.menstruationPeriods)
    .insert({ profile_id: profile.id, start_date, flow_level: flow_level ?? null, notes: notes ?? null, title: title ?? null })
    .select('*')
    .single();
  if (error) throw error;
  return data as MenstruationPeriod;
}

export async function endCurrentPeriod(): Promise<MenstruationPeriod | null> {
  const profile = await getOrCreateProfile();
  // Find latest period without end_date
  const { data: open, error: errOpen } = await supabase
    .from(TABLES.menstruationPeriods)
    .select('*')
    .eq('profile_id', profile.id)
    .is('end_date', null)
    .order('start_date', { ascending: false })
    .limit(1);
  if (errOpen) throw errOpen;
  if (!open || open.length === 0) return null;
  const period = open[0] as MenstruationPeriod;
  const end_date = todayIso();
  const { data, error } = await supabase
    .from(TABLES.menstruationPeriods)
    .update({ end_date })
    .eq('id', period.id)
    .select('*')
    .single();
  if (error) throw error;
  return data as MenstruationPeriod;
}

export async function updatePeriod(id: string, fields: { flow_level?: number | null; notes?: string | null; title?: string | null }): Promise<MenstruationPeriod> {
  const update: any = {};
  if (fields.flow_level !== undefined) update.flow_level = fields.flow_level;
  if (fields.notes !== undefined) update.notes = fields.notes;
  if (fields.title !== undefined) update.title = fields.title;
  const { data, error } = await supabase
    .from(TABLES.menstruationPeriods)
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as MenstruationPeriod;
}

export type MenstruationSymptom = {
  id: string;
  period_id: string;
  profile_id: string;
  couple_id: string | null;
  symptom_type: string;
  intensity?: number | null;
  notes?: string | null;
  occurred_at: string;
  created_at?: string;
  updated_at?: string;
};

export async function listSymptoms(period_id: string): Promise<MenstruationSymptom[]> {
  const { data, error } = await supabase
    .from('menstruation_period_symptoms')
    .select('*')
    .eq('period_id', period_id)
    .order('occurred_at', { ascending: false });
  if (error) throw error;
  return (data || []) as MenstruationSymptom[];
}

export async function addSymptom(period_id: string, symptom_type: string, intensity?: number | null, notes?: string | null): Promise<MenstruationSymptom> {
  const profile = await getOrCreateProfile();
  const { data, error } = await supabase
    .from('menstruation_period_symptoms')
    .insert({ period_id, profile_id: profile.id, symptom_type, intensity: intensity ?? null, notes: notes ?? null })
    .select('*')
    .single();
  if (error) throw error;
  return data as MenstruationSymptom;
}

export async function deleteSymptom(id: string): Promise<void> {
  const { error } = await supabase
    .from('menstruation_period_symptoms')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function deletePeriod(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.menstruationPeriods)
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export type MenstruationStats = {
  cycles_count: number;
  avg_cycle_length: number | null;
  avg_period_length: number | null;
  last_start: string | null;
  last_end: string | null;
  predicted_next_start: string | null;
  predicted_ovulation_day: string | null;
};

export async function getMenstruationStats(): Promise<MenstruationStats> {
  const profile = await getOrCreateProfile();
  const { data, error } = await supabase.rpc('get_menstruation_stats', { p_profile: profile.id });
  if (error) throw error;
  const row = data as any;
  return {
    cycles_count: Number(row?.cycles_count || 0),
    avg_cycle_length: row?.avg_cycle_length != null ? Number(row.avg_cycle_length) : null,
    avg_period_length: row?.avg_period_length != null ? Number(row.avg_period_length) : null,
    last_start: row?.last_start || null,
    last_end: row?.last_end || null,
    predicted_next_start: row?.predicted_next_start || null,
    predicted_ovulation_day: row?.predicted_ovulation_day || null,
  };
}

export type MenstruationPeriodSymptomSummary = {
  symptom_type: string;
  occurrences: number;
  avg_intensity: number | null;
};

export async function getMenstruationPeriodSummary(period_id: string): Promise<MenstruationPeriodSymptomSummary[]> {
  const { data, error } = await supabase.rpc('get_menstruation_period_summary', { p_period: period_id });
  if (error) throw error;
  return (data || []).map((r:any) => ({
    symptom_type: r.symptom_type,
    occurrences: Number(r.occurrences),
    avg_intensity: r.avg_intensity != null ? Number(r.avg_intensity) : null,
  }));
}

export type MenstruationDayContext = {
  is_period: boolean;
  days_to_next_period: number | null;
  days_to_ovulation: number | null;
  fertile_window: boolean;
};

export async function getMenstruationDayContext(day?: string): Promise<MenstruationDayContext> {
  const profile = await getOrCreateProfile();
  const params: any = { p_profile: profile.id };
  if (day) params.p_day = day;
  const { data, error } = await supabase.rpc('get_menstruation_day_context', params);
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    is_period: !!row?.is_period,
    days_to_next_period: row?.days_to_next_period != null ? Number(row.days_to_next_period) : null,
    days_to_ovulation: row?.days_to_ovulation != null ? Number(row.days_to_ovulation) : null,
    fertile_window: !!row?.fertile_window,
  };
}

export type MenstruationCalendarDay = {
  day: string; // YYYY-MM-DD
  type: 'period' | 'predicted_period' | 'ovulation' | 'fertile_window_start' | 'fertile_window' | 'fertile_window_end';
  label: string;
};

export async function getMenstruationCalendar(from?: string, to?: string): Promise<MenstruationCalendarDay[]> {
  const profile = await getOrCreateProfile();
  const params: any = { p_profile: profile.id };
  if (from) params.p_from = from;
  if (to) params.p_to = to;
  const { data, error } = await supabase.rpc('get_menstruation_calendar', params);
  if (error) throw error;
  return (data || []) as MenstruationCalendarDay[];
}

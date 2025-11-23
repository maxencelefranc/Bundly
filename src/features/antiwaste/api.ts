import { supabase } from 'src/lib/supabase';
import { TABLES } from 'src/lib/dbTables';
import type { FoodItem } from './types';
import { computeStatus } from './types';
import { getOrCreateProfile } from 'src/features/profile/profileApi';

export async function listFoodItems(coupleId: string): Promise<FoodItem[]> {
  const { data, error } = await supabase
    .from(TABLES.foodItems)
    .select('*')
    .eq('couple_id', coupleId)
    .order('expiration_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertFoodItem(item: Partial<FoodItem> & { name: string; expiration_date: string; couple_id: string }): Promise<FoodItem> {
  const status = computeStatus(item.expiration_date);
  const { data, error } = await supabase
    .from(TABLES.foodItems)
    .upsert({ ...item, status })
    .select('*')
    .single();
  if (error) throw error;
  return data as FoodItem;
}

export async function deleteFoodItem(id: string) {
  const { error } = await supabase.from(TABLES.foodItems).delete().eq('id', id);
  if (error) throw error;
}

export async function listExpiringSoon(days = 3): Promise<FoodItem[]> {
  const profile = await getOrCreateProfile();
  if (!profile.couple_id) throw new Error('Aucun couple');
  // Fetch items whose expiration_date is today or within the next `days`
  const today = new Date();
  today.setHours(0,0,0,0);
  const until = new Date(today);
  until.setDate(until.getDate() + Math.max(0, days));
  const fromIso = today.toISOString().slice(0,10);
  const toIso = until.toISOString().slice(0,10);
  const { data, error } = await supabase
    .from(TABLES.foodItems)
    .select('*')
    .eq('couple_id', profile.couple_id as string)
    .lte('expiration_date', toIso)
    .order('expiration_date', { ascending: true });
  if (error) throw error;
  return (data || []) as FoodItem[];
}

export async function getFoodItem(id: string): Promise<FoodItem | null> {
  const { data, error } = await supabase.from(TABLES.foodItems).select('*').eq('id', id).single();
  if (error) return null;
  return data as FoodItem;
}

export async function updateFoodItem(id: string, patch: Partial<FoodItem>): Promise<void> {
  const { error } = await supabase.from(TABLES.foodItems).update({ ...patch }).eq('id', id);
  if (error) throw error;
}

export async function consumeFoodItem(id: string): Promise<void> {
  const current = await getFoodItem(id);
  if (!current) return;
  const qty = Math.max(0, Number(current.quantity ?? 1) - 1);
  // Log event consumed for 1 unit
  try {
    await supabase.rpc('log_food_event', {
      p_item_id: id,
      p_name: current.name,
      p_category: current.category ?? null,
      p_location: current.location ?? null,
      p_expiration: current.expiration_date,
      p_type: 'consumed',
      p_qty: 1,
    });
  } catch {}
  if (qty <= 0) {
    await deleteFoodItem(id);
    return;
  }
  await updateFoodItem(id, { quantity: qty });
}

export async function discardFoodItem(id: string): Promise<void> {
  const current = await getFoodItem(id);
  if (!current) { await deleteFoodItem(id); return; }
  const remaining = Math.max(1, Number(current.quantity ?? 1));
  try {
    await supabase.rpc('log_food_event', {
      p_item_id: id,
      p_name: current.name,
      p_category: current.category ?? null,
      p_location: current.location ?? null,
      p_expiration: current.expiration_date,
      p_type: 'discarded',
      p_qty: remaining,
    });
  } catch {}
  await deleteFoodItem(id);
}

export type AntiWasteStats = {
  range_from: string;
  range_to: string;
  consumed_before_expiry: number;
  consumed_after_expiry: number;
  discarded: number;
  avoided_waste: number; // equals consumed_before_expiry
};

export async function getAntiWasteStats(days = 30): Promise<AntiWasteStats> {
  const profile = await getOrCreateProfile();
  if (!profile.couple_id) throw new Error('Aucun couple');
  const today = new Date(); today.setHours(0,0,0,0);
  const from = new Date(today); from.setDate(from.getDate() - Math.max(0, days));
  const fromIso = from.toISOString();
  const toIso = new Date(today.getTime() + 24*60*60*1000).toISOString();
  const { data, error } = await supabase
    .from('food_item_events')
    .select('event_type, quantity, expiration_date, event_at')
    .eq('couple_id', profile.couple_id as string)
    .gte('event_at', fromIso)
    .lt('event_at', toIso);
  if (error) throw error;
  let consumed_before_expiry = 0, consumed_after_expiry = 0, discarded = 0;
  for (const e of (data || []) as any[]) {
    if (e.event_type === 'discarded') {
      discarded += Number(e.quantity || 1);
    } else if (e.event_type === 'consumed') {
      const exp = e.expiration_date ? new Date(e.expiration_date) : null;
      const at = e.event_at ? new Date(e.event_at) : null;
      const q = Number(e.quantity || 1);
      if (exp && at && at <= new Date(exp.getFullYear(), exp.getMonth(), exp.getDate(), 23,59,59,999)) {
        consumed_before_expiry += q;
      } else {
        consumed_after_expiry += q;
      }
    }
  }
  return {
    range_from: fromIso,
    range_to: toIso,
    consumed_before_expiry,
    consumed_after_expiry,
    discarded,
    avoided_waste: consumed_before_expiry,
  };
}

export type SeriesGranularity = 'day' | 'week';
export type AntiWasteSeriesPoint = { key: string; label: string; avoided: number; discarded: number; total: number };

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function startOfWeek(d: Date) { const x = startOfDay(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x; }
function fmtDay(d: Date) { const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); return `${d.getFullYear()}-${mm}-${dd}`; }
function labelDay(d: Date) { return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`; }
function labelWeek(d: Date) { const end = new Date(d); end.setDate(d.getDate()+6); return `${labelDay(d)}–${labelDay(end)}`; }

export async function getAntiWasteSeries(days = 30, granularity: SeriesGranularity = 'day'): Promise<AntiWasteSeriesPoint[]> {
  const profile = await getOrCreateProfile();
  if (!profile.couple_id) throw new Error('Aucun couple');
  const today = startOfDay(new Date());
  const from = new Date(today); from.setDate(from.getDate() - Math.max(0, days-1));
  const fromIso = from.toISOString();
  const toIso = new Date(today.getTime() + 24*60*60*1000).toISOString();
  const { data, error } = await supabase
    .from('food_item_events')
    .select('event_type, quantity, expiration_date, event_at')
    .eq('couple_id', profile.couple_id as string)
    .gte('event_at', fromIso)
    .lt('event_at', toIso);
  if (error) throw error;
  const buckets = new Map<string, { avoided: number; discarded: number; date: Date }>();
  const ensure = (d: Date) => {
    const key = granularity === 'day' ? fmtDay(d) : fmtDay(startOfWeek(d));
    if (!buckets.has(key)) {
      buckets.set(key, { avoided: 0, discarded: 0, date: granularity==='day' ? startOfDay(d) : startOfWeek(d) });
    }
    return key;
  };
  for (const e of (data || []) as any[]) {
    const at = e.event_at ? new Date(e.event_at) : null;
    if (!at) continue;
    const key = ensure(at);
    const q = Number(e.quantity || 1);
    if (e.event_type === 'discarded') {
      buckets.get(key)!.discarded += q;
    } else if (e.event_type === 'consumed') {
      const exp = e.expiration_date ? new Date(e.expiration_date) : null;
      if (exp && at <= new Date(exp.getFullYear(), exp.getMonth(), exp.getDate(), 23,59,59,999)) {
        buckets.get(key)!.avoided += q;
      }
    }
  }
  // Fill missing periods with zeros, to keep chart continuous
  const cursor = granularity==='day' ? startOfDay(from) : startOfWeek(from);
  const end = today;
  while (cursor <= end) {
    const key = granularity==='day' ? fmtDay(cursor) : fmtDay(startOfWeek(cursor));
    if (!buckets.has(key)) buckets.set(key, { avoided: 0, discarded: 0, date: new Date(cursor) });
    cursor.setDate(cursor.getDate() + (granularity==='day' ? 1 : 7));
  }
  const arr = Array.from(buckets.entries())
    .map(([key, v]) => ({ key, label: granularity==='day' ? labelDay(v.date) : labelWeek(v.date), avoided: v.avoided, discarded: v.discarded, total: v.avoided + v.discarded }))
    .sort((a,b) => a.key.localeCompare(b.key));
  return arr;
}

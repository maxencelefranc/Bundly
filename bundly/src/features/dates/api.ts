import { supabase } from "@/lib/supabase";

export interface ImportantDate {
  id: string;
  couple_id: string;
  title: string;
  date: string;
  reminder_days: number;
  recurring: boolean;
}

export function daysUntil(dateStr: string, recurring: boolean): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);

  if (recurring) {
    target.setFullYear(today.getFullYear());
    if (target < today) target.setFullYear(today.getFullYear() + 1);
  }

  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export async function fetchDates(coupleId: string): Promise<ImportantDate[]> {
  const { data, error } = await supabase
    .from("important_dates")
    .select("*")
    .eq("couple_id", coupleId)
    .order("date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addDate(
  coupleId: string,
  item: Pick<ImportantDate, "title" | "date"> & Partial<ImportantDate>
): Promise<ImportantDate> {
  const { data, error } = await supabase
    .from("important_dates")
    .insert({ couple_id: coupleId, reminder_days: 3, recurring: true, ...item })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDate(id: string): Promise<void> {
  const { error } = await supabase.from("important_dates").delete().eq("id", id);
  if (error) throw error;
}

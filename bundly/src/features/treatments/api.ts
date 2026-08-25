import { supabase } from "@/lib/supabase";

export interface Treatment {
  id: string;
  profile_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  reminder_time: string | null;
  stock: number;
  created_at: string;
}

export interface TreatmentLog {
  id: string;
  treatment_id: string;
  taken_at: string;
}

export async function fetchTreatments(profileId: string): Promise<Treatment[]> {
  const { data, error } = await supabase
    .from("treatments")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addTreatment(
  profileId: string,
  treatment: Pick<Treatment, "name"> & Partial<Treatment>
): Promise<Treatment> {
  const { data, error } = await supabase
    .from("treatments")
    .insert({ profile_id: profileId, ...treatment })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTreatment(id: string): Promise<void> {
  const { error } = await supabase.from("treatments").delete().eq("id", id);
  if (error) throw error;
}

export async function markTaken(treatmentId: string): Promise<TreatmentLog> {
  const { data, error } = await supabase
    .from("treatment_logs")
    .insert({ treatment_id: treatmentId, taken_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function isTakenToday(treatmentId: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("treatment_logs")
    .select("id")
    .eq("treatment_id", treatmentId)
    .gte("taken_at", today.toISOString())
    .limit(1);

  return (data?.length ?? 0) > 0;
}

export async function fetchTodayLogs(treatmentIds: string[]): Promise<string[]> {
  if (treatmentIds.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("treatment_logs")
    .select("treatment_id")
    .in("treatment_id", treatmentIds)
    .gte("taken_at", today.toISOString());

  return data?.map((d) => d.treatment_id) ?? [];
}

export async function fetchLogsInRange(
  treatmentIds: string[],
  startISO: string,
  endISO: string
): Promise<TreatmentLog[]> {
  if (treatmentIds.length === 0) return [];

  const { data, error } = await supabase
    .from("treatment_logs")
    .select("*")
    .in("treatment_id", treatmentIds)
    .gte("taken_at", startISO)
    .lt("taken_at", endISO);

  if (error) throw error;
  return data ?? [];
}

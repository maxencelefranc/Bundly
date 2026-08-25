import { supabase } from "@/lib/supabase";

export interface FitnessLog {
  id: string;
  profile_id: string;
  activity: string;
  duration: number | null;
  calories: number | null;
  notes: string | null;
  logged_at: string;
}

export const ACTIVITIES = [
  { key: "running", label: "Course", emoji: "🏃" },
  { key: "cycling", label: "Vélo", emoji: "🚴" },
  { key: "swimming", label: "Natation", emoji: "🏊" },
  { key: "gym", label: "Musculation", emoji: "🏋️" },
  { key: "yoga", label: "Yoga", emoji: "🧘" },
  { key: "walking", label: "Marche", emoji: "🚶" },
  { key: "hiking", label: "Randonnée", emoji: "🥾" },
  { key: "other", label: "Autre", emoji: "💪" },
] as const;

export type ActivityKey = (typeof ACTIVITIES)[number]["key"];

export async function fetchFitnessLogs(profileId: string): Promise<FitnessLog[]> {
  const { data, error } = await supabase
    .from("fitness_logs")
    .select("*")
    .eq("profile_id", profileId)
    .order("logged_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return data ?? [];
}

export async function addFitnessLog(
  profileId: string,
  log: Pick<FitnessLog, "activity"> & Partial<FitnessLog>
): Promise<FitnessLog> {
  const { data, error } = await supabase
    .from("fitness_logs")
    .insert({ profile_id: profileId, logged_at: new Date().toISOString(), ...log })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFitnessLog(id: string): Promise<void> {
  const { error } = await supabase.from("fitness_logs").delete().eq("id", id);
  if (error) throw error;
}

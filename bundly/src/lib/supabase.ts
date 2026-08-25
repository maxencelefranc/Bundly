import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const supabase = createClient(
  "https://cvrgcqgsfswvglzcevuy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2cmdjcWdzZnN3dmdsemNldnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5Mzg1NzEsImV4cCI6MjA5NjUxNDU3MX0.BA-5CXiQD6KNlTN1dHFrI449WbOT9orP0PdCV94pryc",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export async function fetchRecentActivity(coupleId: string, limit = 10) {
  const { data, error } = await supabase
    .from("xp_events")
    .select("*, profiles(full_name)")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

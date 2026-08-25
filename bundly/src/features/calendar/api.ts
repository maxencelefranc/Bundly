import { supabase } from "@/lib/supabase";

export interface Appointment {
  id: string;
  couple_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  created_by: string | null;
  created_at: string;
}

export async function fetchAppointments(coupleId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("couple_id", coupleId)
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addAppointment(
  coupleId: string,
  createdBy: string,
  appointment: Pick<Appointment, "title" | "start_time"> & Partial<Appointment>
): Promise<Appointment> {
  const { data, error } = await supabase
    .from("appointments")
    .insert({ couple_id: coupleId, created_by: createdBy, ...appointment })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw error;
}

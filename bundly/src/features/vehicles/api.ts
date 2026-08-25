import { supabase } from "@/lib/supabase";

export interface Vehicle {
  id: string;
  couple_id: string;
  make: string;
  model: string | null;
  year: number | null;
  plate: string | null;
  mileage: number | null;
  next_service: string | null;
  created_at: string;
}

export async function fetchVehicles(coupleId: string): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addVehicle(
  coupleId: string,
  vehicle: Pick<Vehicle, "make"> & Partial<Vehicle>
): Promise<Vehicle> {
  const { data, error } = await supabase
    .from("vehicles")
    .insert({ couple_id: coupleId, ...vehicle })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
  const { data, error } = await supabase
    .from("vehicles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) throw error;
}

export function daysUntilService(nextService: string | null): number | null {
  if (!nextService) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const service = new Date(nextService);
  return Math.floor((service.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

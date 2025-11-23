import { supabase } from 'src/lib/supabase';
import { TABLES } from 'src/lib/dbTables';
import { Vehicle, VehicleMaintenance, VehicleLog } from './types';

export async function listVehicles(coupleId: string): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from(TABLES.vehicles)
    .select('*')
    .eq('couple_id', coupleId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data as any;
}

export async function upsertVehicle(v: Partial<Vehicle> & { couple_id: string }): Promise<void> {
  const { error } = await supabase.from(TABLES.vehicles).upsert(v, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase.from(TABLES.vehicles).delete().eq('id', id);
  if (error) throw error;
}

export async function listMaintenance(vehicleId: string): Promise<VehicleMaintenance[]> {
  const { data, error } = await supabase
    .from(TABLES.vehicleMaintenances)
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('completed', { ascending: true })
    .order('due_date', { ascending: true });
  if (error) throw error;
  return data as any;
}

export async function upsertMaintenance(m: Partial<VehicleMaintenance> & { vehicle_id: string }): Promise<void> {
  const { error } = await supabase.from(TABLES.vehicleMaintenances).upsert(m, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteMaintenance(id: string): Promise<void> {
  const { error } = await supabase.from(TABLES.vehicleMaintenances).delete().eq('id', id);
  if (error) throw error;
}

export async function addVehicleLog(l: Omit<VehicleLog, 'id' | 'created_at'>): Promise<void> {
  const { error } = await supabase.from(TABLES.vehicleLogs).insert(l as any);
  if (error) throw error;
}

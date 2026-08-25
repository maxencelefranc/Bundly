import { supabase } from "@/lib/supabase";

export interface FoodItem {
  id: string;
  couple_id: string;
  name: string;
  expiry_date: string | null;
  storage_location: string | null;
  status: "ok" | "warning" | "expired" | "consumed";
  created_at: string;
}

export function computeStatus(expiryDate: string | null): FoodItem["status"] {
  if (!expiryDate) return "ok";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  const diffDays = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "expired";
  if (diffDays <= 3) return "warning";
  return "ok";
}

export async function fetchFoodItems(coupleId: string): Promise<FoodItem[]> {
  const { data, error } = await supabase
    .from("food_items")
    .select("*")
    .eq("couple_id", coupleId)
    .neq("status", "consumed")
    .order("expiry_date", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
}

export async function addFoodItem(
  coupleId: string,
  item: Pick<FoodItem, "name"> & Partial<FoodItem>
): Promise<FoodItem> {
  const status = computeStatus(item.expiry_date ?? null);
  const { data, error } = await supabase
    .from("food_items")
    .insert({ couple_id: coupleId, status, ...item })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markConsumed(id: string): Promise<void> {
  const { error } = await supabase.from("food_items").update({ status: "consumed" }).eq("id", id);

  if (error) throw error;
}

export async function deleteFoodItem(id: string): Promise<void> {
  const { error } = await supabase.from("food_items").delete().eq("id", id);
  if (error) throw error;
}

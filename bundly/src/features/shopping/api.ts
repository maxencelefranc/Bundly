import { supabase } from "@/lib/supabase";

export interface ShoppingItem {
  id: string;
  list_id: string;
  text: string;
  category: string | null;
  picked: boolean;
  added_by: string | null;
  created_at: string;
}

export interface ShoppingList {
  id: string;
  couple_id: string;
  title: string;
  active: boolean;
  created_at: string;
}

export async function getOrCreateActiveList(coupleId: string): Promise<ShoppingList> {
  const { data: existing } = await supabase
    .from("shopping_lists")
    .select("*")
    .eq("couple_id", coupleId)
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("shopping_lists")
    .insert({ couple_id: coupleId, title: "Liste de courses", active: true })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchItems(listId: string): Promise<ShoppingItem[]> {
  const { data, error } = await supabase
    .from("shopping_items")
    .select("*")
    .eq("list_id", listId)
    .order("picked", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addItem(
  listId: string,
  addedBy: string,
  text: string,
  category?: string
): Promise<ShoppingItem> {
  const { data, error } = await supabase
    .from("shopping_items")
    .insert({ list_id: listId, added_by: addedBy, text, category: category ?? null })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function togglePicked(itemId: string, picked: boolean): Promise<ShoppingItem> {
  const { data, error } = await supabase
    .from("shopping_items")
    .update({ picked })
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteItem(itemId: string): Promise<void> {
  const { error } = await supabase.from("shopping_items").delete().eq("id", itemId);
  if (error) throw error;
}

export async function clearPicked(listId: string): Promise<void> {
  const { error } = await supabase
    .from("shopping_items")
    .delete()
    .eq("list_id", listId)
    .eq("picked", true);
  if (error) throw error;
}

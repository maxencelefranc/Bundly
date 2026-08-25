import { supabase } from "@/lib/supabase";

export interface Subscription {
  id: string;
  couple_id: string;
  name: string;
  renewal_date: string | null;
  amount: number | null;
  category: string | null;
  created_at: string;
}

export const SUB_CATEGORIES = [
  { key: "streaming", label: "Streaming", emoji: "📺" },
  { key: "music", label: "Musique", emoji: "🎵" },
  { key: "gaming", label: "Gaming", emoji: "🎮" },
  { key: "sport", label: "Sport", emoji: "💪" },
  { key: "software", label: "Logiciel", emoji: "💻" },
  { key: "food", label: "Alimentation", emoji: "🍽️" },
  { key: "other", label: "Autre", emoji: "📦" },
] as const;

export type SubCategoryKey = (typeof SUB_CATEGORIES)[number]["key"];

export async function fetchSubscriptions(coupleId: string): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("couple_id", coupleId)
    .order("renewal_date", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
}

export async function addSubscription(
  coupleId: string,
  sub: Pick<Subscription, "name"> & Partial<Subscription>
): Promise<Subscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({ couple_id: coupleId, ...sub })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSubscription(id: string): Promise<void> {
  const { error } = await supabase.from("subscriptions").delete().eq("id", id);
  if (error) throw error;
}

export function daysUntilRenewal(renewalDate: string | null): number | null {
  if (!renewalDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewal = new Date(renewalDate);
  return Math.floor((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function totalMonthly(subscriptions: Subscription[]): number {
  return subscriptions.reduce((acc, s) => acc + (s.amount ?? 0), 0);
}

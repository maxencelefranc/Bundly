import { supabase } from "@/lib/supabase";

export interface Pet {
  id: string;
  couple_id: string;
  name: string;
  type: string | null;
  breed: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface PetVaccination {
  id: string;
  pet_id: string;
  name: string;
  date: string | null;
  next_date: string | null;
}

export interface PetWeight {
  id: string;
  pet_id: string;
  weight: number;
  recorded_at: string;
}

export interface PetVetVisit {
  id: string;
  pet_id: string;
  reason: string | null;
  visited_at: string | null;
  next_visit: string | null;
}

export const PET_TYPES = [
  { key: "dog", label: "Chien", emoji: "🐕" },
  { key: "cat", label: "Chat", emoji: "🐈" },
  { key: "rabbit", label: "Lapin", emoji: "🐇" },
  { key: "bird", label: "Oiseau", emoji: "🐦" },
  { key: "fish", label: "Poisson", emoji: "🐠" },
  { key: "other", label: "Autre", emoji: "🐾" },
] as const;

export type PetTypeKey = (typeof PET_TYPES)[number]["key"];

export async function fetchPets(coupleId: string): Promise<Pet[]> {
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addPet(
  coupleId: string,
  pet: Pick<Pet, "name"> & Partial<Pet>
): Promise<Pet> {
  const { data, error } = await supabase
    .from("pets")
    .insert({ couple_id: coupleId, ...pet })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePet(id: string): Promise<void> {
  const { error } = await supabase.from("pets").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchVaccinations(petId: string): Promise<PetVaccination[]> {
  const { data, error } = await supabase
    .from("pet_vaccinations")
    .select("*")
    .eq("pet_id", petId)
    .order("date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addVaccination(
  petId: string,
  vac: Omit<PetVaccination, "id" | "pet_id">
): Promise<PetVaccination> {
  const { data, error } = await supabase
    .from("pet_vaccinations")
    .insert({ pet_id: petId, ...vac })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchWeights(petId: string): Promise<PetWeight[]> {
  const { data, error } = await supabase
    .from("pet_weight")
    .select("*")
    .eq("pet_id", petId)
    .order("recorded_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addWeight(petId: string, weight: number): Promise<PetWeight> {
  const { data, error } = await supabase
    .from("pet_weight")
    .insert({ pet_id: petId, weight, recorded_at: new Date().toISOString().split("T")[0] })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchVetVisits(petId: string): Promise<PetVetVisit[]> {
  const { data, error } = await supabase
    .from("pet_vet_visits")
    .select("*")
    .eq("pet_id", petId)
    .order("visited_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addVetVisit(
  petId: string,
  visit: Omit<PetVetVisit, "id" | "pet_id">
): Promise<PetVetVisit> {
  const { data, error } = await supabase
    .from("pet_vet_visits")
    .insert({ pet_id: petId, ...visit })
    .select()
    .single();

  if (error) throw error;
  return data;
}

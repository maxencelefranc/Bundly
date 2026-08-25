import { supabase } from "@/lib/supabase";

export interface Photo {
  id: string;
  couple_id: string;
  storage_path: string;
  caption: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

export async function fetchPhotos(coupleId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("couple_id", coupleId)
    .order("uploaded_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addPhoto(
  coupleId: string,
  uploadedBy: string,
  storagePath: string,
  caption?: string
): Promise<Photo> {
  const { data, error } = await supabase
    .from("photos")
    .insert({
      couple_id: coupleId,
      uploaded_by: uploadedBy,
      storage_path: storagePath,
      caption: caption ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePhoto(id: string, storagePath: string): Promise<void> {
  await supabase.storage.from("photos").remove([storagePath]);
  const { error } = await supabase.from("photos").delete().eq("id", id);
  if (error) throw error;
}

export function getPhotoUrl(storagePath: string): string {
  const { data } = supabase.storage.from("photos").getPublicUrl(storagePath);
  return data.publicUrl;
}

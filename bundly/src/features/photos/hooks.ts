import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPhotos, addPhoto, deletePhoto, type Photo } from "./api";
import { useAppStore } from "@/stores/appStore";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "@/lib/supabase";

export function usePhotos() {
  const couple = useAppStore((s) => s.couple);

  return useQuery({
    queryKey: ["photos", couple?.id],
    queryFn: () => fetchPhotos(couple!.id),
    enabled: !!couple?.id,
  });
}

export function useAddPhoto() {
  const queryClient = useQueryClient();
  const { couple, profile, awardXP } = useAppStore();

  return useMutation({
    mutationFn: async ({ uri, caption }: { uri: string; caption?: string }) => {
      const fileName = `${couple!.id}/${Date.now()}.jpg`;

      // Lire le fichier en base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Décoder base64 en Uint8Array
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(fileName, bytes, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const result = await addPhoto(couple!.id, profile!.id, fileName, caption);
      await awardXP("photo_upload", "photos");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos", couple?.id] });
    },
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  const couple = useAppStore((s) => s.couple);

  return useMutation({
    mutationFn: ({ id, storagePath }: { id: string; storagePath: string }) =>
      deletePhoto(id, storagePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos", couple?.id] });
    },
  });
}

export async function pickImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
    allowsEditing: true,
    aspect: [4, 3],
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
}

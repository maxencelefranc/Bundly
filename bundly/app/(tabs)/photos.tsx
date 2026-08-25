import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "@/components/shared/ScreenLayout";
import { useTheme } from "@/stores/themeStore";
import { usePhotos, useAddPhoto, useDeletePhoto, pickImage } from "@/features/photos/hooks";
import { getPhotoUrl } from "@/features/photos/api";

const SCREEN_WIDTH = Dimensions.get("window").width;
const PHOTO_SIZE = (SCREEN_WIDTH - 48) / 3;

export default function PhotosScreen() {
  const theme = useTheme();
  const { data: photos, isLoading } = usePhotos();
  const addPhoto = useAddPhoto();
  const deletePhoto = useDeletePhoto();
  const [uploading, setUploading] = useState(false);

  async function handleAdd() {
    const uri = await pickImage();
    if (!uri) return;
    setUploading(true);
    try {
      await addPhoto.mutateAsync({ uri });
    } catch (e: any) {
      Alert.alert("Erreur", e.message ?? "Upload impossible");
    } finally {
      setUploading(false);
    }
  }

  function handleLongPress(id: string, storagePath: string) {
    Alert.alert("Supprimer", "Voulez-vous supprimer cette photo ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => deletePhoto.mutate({ id, storagePath }),
      },
    ]);
  }

  return (
    <ScreenLayout
      title="Photos"
      subtitle={`${photos?.length ?? 0} souvenirs`}
      color="#EC4899"
      icon="camera-outline"
      onAdd={handleAdd}
    >
      {isLoading || uploading ? (
        <View style={{ alignItems: "center", marginTop: 40, gap: 12 }}>
          <ActivityIndicator color="#EC4899" />
          {uploading && (
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Upload en cours...</Text>
          )}
        </View>
      ) : photos?.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: "#FDF2F8",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Ionicons name="camera-outline" size={32} color="#EC4899" />
          </View>
          <Text style={{ fontSize: 16, fontWeight: "600", color: theme.text, marginBottom: 4 }}>
            Aucune photo
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.textSecondary,
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            Ajoutez vos premiers souvenirs
          </Text>
          <TouchableOpacity
            onPress={handleAdd}
            activeOpacity={0.8}
            style={{
              backgroundColor: "#EC4899",
              borderRadius: 14,
              paddingHorizontal: 20,
              paddingVertical: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Ionicons name="add" size={18} color="white" />
            <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
              Ajouter une photo
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
          {photos?.map((photo) => (
            <TouchableOpacity
              key={photo.id}
              onLongPress={() => handleLongPress(photo.id, photo.storage_path)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: getPhotoUrl(photo.storage_path) }}
                style={{ width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 12 }}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScreenLayout>
  );
}

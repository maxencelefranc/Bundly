import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/stores/themeStore";
import { useAddPet } from "@/features/pets/hooks";
import { PET_TYPES, type PetTypeKey } from "@/features/pets/api";

export default function AddPetModal() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const addPet = useAddPet();

  const [name, setName] = useState("");
  const [type, setType] = useState<PetTypeKey | null>(null);
  const [breed, setBreed] = useState("");

  async function handleSubmit() {
    if (!name.trim() || !type) return;
    await addPet.mutateAsync({ name: name.trim(), type, breed: breed.trim() || null });
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bgCard }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "600", color: theme.text }}>
              Ajouter un animal
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: theme.textMuted, fontSize: 24 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 16, marginBottom: 24 }}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}>
                Nom
              </Text>
              <TextInput
                style={{
                  backgroundColor: theme.bgSecondary,
                  borderWidth: 1,
                  borderColor: theme.borderStrong,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  height: 48,
                  color: theme.text,
                  fontSize: 16,
                }}
                placeholder="Rex, Mimi, Nemo..."
                placeholderTextColor={theme.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>

            <View>
              <Text
                style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 10 }}
              >
                Type
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {PET_TYPES.map((p) => (
                  <TouchableOpacity
                    key={p.key}
                    onPress={() => setType(p.key)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: type === p.key ? "#F59E0B" : theme.borderStrong,
                      backgroundColor: type === p.key ? "#FFFBEB" : theme.bgSecondary,
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>{p.emoji}</Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "500",
                        color: type === p.key ? "#F59E0B" : theme.text,
                      }}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}>
                Race (optionnel)
              </Text>
              <TextInput
                style={{
                  backgroundColor: theme.bgSecondary,
                  borderWidth: 1,
                  borderColor: theme.borderStrong,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  height: 48,
                  color: theme.text,
                  fontSize: 16,
                }}
                placeholder="Golden Retriever, Siamois..."
                placeholderTextColor={theme.textMuted}
                value={breed}
                onChangeText={setBreed}
              />
            </View>
          </View>

          <View
            style={{
              backgroundColor: "#FFFBEB",
              borderRadius: 12,
              padding: 12,
              marginBottom: 24,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16 }}>✨</Text>
            <Text style={{ color: "#F59E0B", fontSize: 13, fontWeight: "500" }}>
              XP pour chaque suivi vaccin, poids et véto
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!name.trim() || !type || addPet.isPending}
            activeOpacity={0.8}
            style={{
              height: 56,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: name.trim() && type ? "#F59E0B" : theme.bgSecondary,
              marginTop: "auto",
            }}
          >
            {addPet.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: name.trim() && type ? "white" : theme.textMuted,
                }}
              >
                Ajouter
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

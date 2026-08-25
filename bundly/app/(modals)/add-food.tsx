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
import { useAddFoodItem } from "@/features/anti-waste/hooks";

const LOCATIONS = ["Frigo", "Congélateur", "Placard", "Autre"];

export default function AddFoodModal() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const addFood = useAddFoodItem();

  const [name, setName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [location, setLocation] = useState("Frigo");

  async function handleSubmit() {
    if (!name.trim()) return;
    await addFood.mutateAsync({
      name: name.trim(),
      expiry_date: expiryDate || null,
      storage_location: location,
    });
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
              Ajouter un aliment
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
                placeholder="Lait, poulet, yaourt..."
                placeholderTextColor={theme.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}>
                Date de péremption
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
                placeholder="2026-06-20"
                placeholderTextColor={theme.textMuted}
                value={expiryDate}
                onChangeText={setExpiryDate}
              />
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
                Format : AAAA-MM-JJ
              </Text>
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 8 }}>
                Emplacement
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {LOCATIONS.map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    onPress={() => setLocation(loc)}
                    activeOpacity={0.7}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: location === loc ? "#EF4444" : theme.borderStrong,
                      backgroundColor: location === loc ? "#FEF2F2" : theme.bgSecondary,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "500",
                        color: location === loc ? "#EF4444" : theme.text,
                      }}
                    >
                      {loc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View
            style={{
              backgroundColor: "#FEF2F2",
              borderRadius: 12,
              padding: 12,
              marginBottom: 24,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16 }}>✨</Text>
            <Text style={{ color: "#EF4444", fontSize: 13, fontWeight: "500" }}>
              +5 XP à l&apos;ajout, +10 XP quand consommé
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!name.trim() || addFood.isPending}
            activeOpacity={0.8}
            style={{
              height: 56,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: name.trim() ? "#EF4444" : theme.bgSecondary,
              marginTop: "auto",
            }}
          >
            {addFood.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: name.trim() ? "white" : theme.textMuted,
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

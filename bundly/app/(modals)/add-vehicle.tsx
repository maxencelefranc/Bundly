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
import { useAddVehicle } from "@/features/vehicles/hooks";

export default function AddVehicleModal() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const addVehicle = useAddVehicle();

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plate, setPlate] = useState("");
  const [mileage, setMileage] = useState("");
  const [nextService, setNextService] = useState("");

  async function handleSubmit() {
    if (!make.trim()) return;
    await addVehicle.mutateAsync({
      make: make.trim(),
      model: model.trim() || null,
      year: year ? parseInt(year) : null,
      plate: plate.trim() || null,
      mileage: mileage ? parseInt(mileage) : null,
      next_service: nextService || null,
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
              Nouveau véhicule
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: theme.textMuted, fontSize: 24 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 14, marginBottom: 24 }}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}>
                Marque
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
                placeholder="Renault, Peugeot, Toyota..."
                placeholderTextColor={theme.textMuted}
                value={make}
                onChangeText={setMake}
                autoFocus
              />
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 2 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}
                >
                  Modèle
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
                  placeholder="Clio, 208..."
                  placeholderTextColor={theme.textMuted}
                  value={model}
                  onChangeText={setModel}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}
                >
                  Année
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
                  placeholder="2020"
                  placeholderTextColor={theme.textMuted}
                  value={year}
                  onChangeText={setYear}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}
                >
                  Plaque
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
                  placeholder="AB-123-CD"
                  placeholderTextColor={theme.textMuted}
                  value={plate}
                  onChangeText={(t) => setPlate(t.toUpperCase())}
                  autoCapitalize="characters"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}
                >
                  Kilométrage
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
                  placeholder="45000"
                  placeholderTextColor={theme.textMuted}
                  value={mileage}
                  onChangeText={setMileage}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}>
                Prochain entretien
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
                placeholder="2026-12-01"
                placeholderTextColor={theme.textMuted}
                value={nextService}
                onChangeText={setNextService}
              />
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
                Format : AAAA-MM-JJ
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: "#F8FAFC",
              borderRadius: 12,
              padding: 12,
              marginBottom: 24,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16 }}>✨</Text>
            <Text style={{ color: "#64748B", fontSize: 13, fontWeight: "500" }}>
              +20 XP à l&apos;ajout
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!make.trim() || addVehicle.isPending}
            activeOpacity={0.8}
            style={{
              height: 56,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: make.trim() ? "#64748B" : theme.bgSecondary,
              marginTop: "auto",
            }}
          >
            {addVehicle.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: make.trim() ? "white" : theme.textMuted,
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

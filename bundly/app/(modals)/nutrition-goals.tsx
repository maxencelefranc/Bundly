import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/stores/themeStore";
import { useNutritionGoal, useUpdateGoal } from "@/features/nutrition/hooks";

export default function NutritionGoalsModal() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { data: goal } = useNutritionGoal();
  const updateGoal = useUpdateGoal();

  const [calories, setCalories] = useState(String(goal?.calories ?? 2000));
  const [proteins, setProteins] = useState(String(goal?.proteins ?? 50));
  const [carbs, setCarbs] = useState(String(goal?.carbs ?? 250));
  const [fats, setFats] = useState(String(goal?.fats ?? 70));

  async function handleSave() {
    await updateGoal.mutateAsync({
      calories: parseInt(calories) || 2000,
      proteins: parseInt(proteins) || 50,
      carbs: parseInt(carbs) || 250,
      fats: parseInt(fats) || 70,
    });
    router.back();
  }

  const fields = [
    {
      label: "Calories (kcal/jour)",
      value: calories,
      set: setCalories,
      color: "#8B5CF6",
      emoji: "⚡",
    },
    {
      label: "Protéines (g/jour)",
      value: proteins,
      set: setProteins,
      color: "#FF6B9D",
      emoji: "💪",
    },
    { label: "Glucides (g/jour)", value: carbs, set: setCarbs, color: "#F59E0B", emoji: "🍞" },
    { label: "Lipides (g/jour)", value: fats, set: setFats, color: "#22C55E", emoji: "🥑" },
  ];

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
              Mes objectifs
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: theme.textMuted, fontSize: 24 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 14, marginBottom: 24 }}>
            {fields.map((f) => (
              <View key={f.label}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}
                >
                  <Text style={{ fontSize: 14 }}>{f.emoji}</Text>
                  <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text }}>
                    {f.label}
                  </Text>
                </View>
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
                    fontWeight: "600",
                  }}
                  value={f.value}
                  onChangeText={f.set}
                  keyboardType="numeric"
                />
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={updateGoal.isPending}
            activeOpacity={0.8}
            style={{
              height: 56,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#8B5CF6",
              marginTop: "auto",
            }}
          >
            {updateGoal.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
import { useAddTreatment } from "@/features/treatments/hooks";

export default function AddTreatmentModal() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const addTreatment = useAddTreatment();

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [reminderTime, setReminderTime] = useState("09:00");

  async function handleSubmit() {
    if (!name.trim()) return;
    await addTreatment.mutateAsync({
      name: name.trim(),
      dosage: dosage.trim() || null,
      frequency: frequency.trim() || null,
      reminder_time: /^\d{2}:\d{2}$/.test(reminderTime) ? reminderTime : "09:00",
      stock: 0,
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
              Nouveau traitement
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: theme.textMuted, fontSize: 24 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 16, marginBottom: 24 }}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}>
                Nom du médicament
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
                placeholder="Doliprane, Vitamine D..."
                placeholderTextColor={theme.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}>
                Dosage (optionnel)
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
                placeholder="500mg, 1 comprimé..."
                placeholderTextColor={theme.textMuted}
                value={dosage}
                onChangeText={setDosage}
              />
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}>
                Fréquence (optionnel)
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
                placeholder="1x par jour, matin et soir..."
                placeholderTextColor={theme.textMuted}
                value={frequency}
                onChangeText={setFrequency}
              />
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}>
                Heure du rappel
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
                placeholder="09:00"
                placeholderTextColor={theme.textMuted}
                value={reminderTime}
                onChangeText={setReminderTime}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
                Format : HH:mm — une notification quotidienne sera programmée
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: "#ECFEFF",
              borderRadius: 12,
              padding: 12,
              marginBottom: 24,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16 }}>✨</Text>
            <Text style={{ color: "#06B6D4", fontSize: 13, fontWeight: "500" }}>
              +10 XP chaque fois que vous le prenez
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!name.trim() || addTreatment.isPending}
            activeOpacity={0.8}
            style={{
              height: 56,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: name.trim() ? "#06B6D4" : theme.bgSecondary,
              marginTop: "auto",
            }}
          >
            {addTreatment.isPending ? (
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

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
import { useAddFitnessLog } from "@/features/fitness/hooks";
import { ACTIVITIES, type ActivityKey } from "@/features/fitness/api";

export default function AddFitnessModal() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const addLog = useAddFitnessLog();

  const [activity, setActivity] = useState<ActivityKey | null>(null);
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit() {
    if (!activity) return;
    await addLog.mutateAsync({
      activity,
      duration: duration ? parseInt(duration) : null,
      calories: calories ? parseInt(calories) : null,
      notes: notes.trim() || null,
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
              Activité sportive
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: theme.textMuted, fontSize: 24 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Activités */}
          <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 10 }}>
            Type d&apos;activité
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {ACTIVITIES.map((a) => (
              <TouchableOpacity
                key={a.key}
                onPress={() => setActivity(a.key)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: activity === a.key ? "#22C55E" : theme.borderStrong,
                  backgroundColor: activity === a.key ? "#F0FDF4" : theme.bgSecondary,
                }}
              >
                <Text style={{ fontSize: 16 }}>{a.emoji}</Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: activity === a.key ? "#22C55E" : theme.text,
                  }}
                >
                  {a.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Durée & Calories */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}>
                Durée (min)
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
                placeholder="30"
                placeholderTextColor={theme.textMuted}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}>
                Calories
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
                placeholder="200"
                placeholderTextColor={theme.textMuted}
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Notes */}
          <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}>
            Notes (optionnel)
          </Text>
          <TextInput
            style={{
              backgroundColor: theme.bgSecondary,
              borderWidth: 1,
              borderColor: theme.borderStrong,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              color: theme.text,
              fontSize: 15,
              minHeight: 70,
              textAlignVertical: "top",
              marginBottom: 24,
            }}
            placeholder="Comment ça s'est passé ?"
            placeholderTextColor={theme.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {/* XP */}
          <View
            style={{
              backgroundColor: "#F0FDF4",
              borderRadius: 12,
              padding: 12,
              marginBottom: 24,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16 }}>✨</Text>
            <Text style={{ color: "#22C55E", fontSize: 13, fontWeight: "500" }}>
              +15 XP pour cette séance
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!activity || addLog.isPending}
            activeOpacity={0.8}
            style={{
              height: 56,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: activity ? "#22C55E" : theme.bgSecondary,
              marginTop: "auto",
            }}
          >
            {addLog.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: activity ? "white" : theme.textMuted,
                }}
              >
                Enregistrer
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

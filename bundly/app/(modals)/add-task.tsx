import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/stores/themeStore";
import { useAddTask } from "@/features/tasks/hooks";

const PRIORITIES = [
  { value: "low", label: "Basse", color: "#94A3B8" },
  { value: "medium", label: "Moyenne", color: "#F59E0B" },
  { value: "high", label: "Haute", color: "#EF4444" },
] as const;

export default function AddTaskModal() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const addTask = useAddTask();

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  async function handleSubmit() {
    if (!title.trim()) return;
    await addTask.mutateAsync({ title: title.trim(), priority });
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bgCard }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "600", color: theme.text }}>Nouvelle tâche</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: theme.textMuted, fontSize: 24 }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Titre */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}>
            Que faut-il faire ?
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
            placeholder="Faire les courses, sortir le chien..."
            placeholderTextColor={theme.textMuted}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />
        </View>

        {/* Priorité */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 8 }}>
            Priorité
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.value}
                onPress={() => setPriority(p.value)}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: priority === p.value ? p.color : theme.bgSecondary,
                  borderWidth: 1,
                  borderColor: priority === p.value ? p.color : theme.borderStrong,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: priority === p.value ? "white" : theme.text,
                  }}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* XP preview */}
        <View
          style={{
            backgroundColor: "#FFF1F5",
            borderRadius: 12,
            padding: 12,
            marginBottom: 24,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 16 }}>✨</Text>
          <Text style={{ color: "#FF6B9D", fontSize: 13, fontWeight: "500" }}>
            +5 XP à la création, +10 XP quand elle sera complétée
          </Text>
        </View>

        {/* Bouton */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!title.trim() || addTask.isPending}
          activeOpacity={0.8}
          style={{
            height: 56,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: title.trim() ? "#FF6B9D" : theme.bgSecondary,
            marginTop: "auto",
          }}
        >
          {addTask.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: title.trim() ? "white" : theme.textMuted,
              }}
            >
              Ajouter la tâche
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

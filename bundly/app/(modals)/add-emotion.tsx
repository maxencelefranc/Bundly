import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/stores/themeStore";
import { useAddEmotion } from "@/features/emotions/hooks";
import { EMOTIONS, type EmotionKey } from "@/features/emotions/api";

export default function AddEmotionModal() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const addEmotion = useAddEmotion();

  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKey | null>(null);
  const [mood, setMood] = useState(5);
  const [context, setContext] = useState("");

  async function handleSubmit() {
    if (!selectedEmotion) return;
    await addEmotion.mutateAsync({
      emotion: selectedEmotion,
      mood,
      context: context.trim() || undefined,
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
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "600", color: theme.text }}>
              Comment tu te sens ?
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: theme.textMuted, fontSize: 24 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Émotions */}
          <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 12 }}>
            Émotion
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {EMOTIONS.map((e) => (
              <TouchableOpacity
                key={e.key}
                onPress={() => setSelectedEmotion(e.key)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: selectedEmotion === e.key ? "#A78BFA" : theme.borderStrong,
                  backgroundColor: selectedEmotion === e.key ? "#F5F3FF" : theme.bgSecondary,
                }}
              >
                <Text style={{ fontSize: 18 }}>{e.emoji}</Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: selectedEmotion === e.key ? "#A78BFA" : theme.text,
                  }}
                >
                  {e.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Humeur */}
          <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 8 }}>
            Humeur : {mood}/10
          </Text>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 24 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => setMood(n)}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  height: 36,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: mood >= n ? "#A78BFA" : theme.bgSecondary,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: mood >= n ? "white" : theme.textMuted,
                  }}
                >
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Contexte */}
          <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 8 }}>
            Contexte (optionnel)
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
              minHeight: 80,
              textAlignVertical: "top",
              marginBottom: 24,
            }}
            placeholder="Qu'est-ce qui s'est passé ?"
            placeholderTextColor={theme.textMuted}
            value={context}
            onChangeText={setContext}
            multiline
          />

          {/* XP */}
          <View
            style={{
              backgroundColor: "#F5F3FF",
              borderRadius: 12,
              padding: 12,
              marginBottom: 24,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16 }}>✨</Text>
            <Text style={{ color: "#A78BFA", fontSize: 13, fontWeight: "500" }}>
              +10 XP pour ce journal
            </Text>
          </View>

          {/* Bouton */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!selectedEmotion || addEmotion.isPending}
            activeOpacity={0.8}
            style={{
              height: 56,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: selectedEmotion ? "#A78BFA" : theme.bgSecondary,
              marginTop: "auto",
            }}
          >
            {addEmotion.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: selectedEmotion ? "white" : theme.textMuted,
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

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
import { useAddDate } from "@/features/dates/hooks";

export default function AddDateModal() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const addDate = useAddDate();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [recurring, setRecurring] = useState(true);

  async function handleSubmit() {
    if (!title.trim() || !date) return;
    await addDate.mutateAsync({ title: title.trim(), date, recurring });
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
              Date importante
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: theme.textMuted, fontSize: 24 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 16, marginBottom: 24 }}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}>
                Titre
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
                placeholder="Anniversaire, Saint-Valentin..."
                placeholderTextColor={theme.textMuted}
                value={title}
                onChangeText={setTitle}
                autoFocus
              />
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}>
                Date
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
                value={date}
                onChangeText={setDate}
              />
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
                Format : AAAA-MM-JJ
              </Text>
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 8 }}>
                Récurrence annuelle
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[
                  { label: "Oui", value: true },
                  { label: "Non", value: false },
                ].map((opt) => (
                  <TouchableOpacity
                    key={String(opt.value)}
                    onPress={() => setRecurring(opt.value)}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: recurring === opt.value ? "#F97316" : theme.borderStrong,
                      backgroundColor: recurring === opt.value ? "#FFF7ED" : theme.bgSecondary,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: recurring === opt.value ? "#F97316" : theme.text,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View
            style={{
              backgroundColor: "#FFF7ED",
              borderRadius: 12,
              padding: 12,
              marginBottom: 24,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16 }}>✨</Text>
            <Text style={{ color: "#F97316", fontSize: 13, fontWeight: "500" }}>
              +5 XP à l&apos;ajout · Rappel 3 jours avant
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!title.trim() || !date || addDate.isPending}
            activeOpacity={0.8}
            style={{
              height: 56,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: title.trim() && date ? "#F97316" : theme.bgSecondary,
              marginTop: "auto",
            }}
          >
            {addDate.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: title.trim() && date ? "white" : theme.textMuted,
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

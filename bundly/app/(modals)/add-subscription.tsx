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
import { useAddSubscription } from "@/features/subscriptions/hooks";
import { SUB_CATEGORIES, type SubCategoryKey } from "@/features/subscriptions/api";

export default function AddSubscriptionModal() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const addSub = useAddSubscription();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [renewalDate, setRenewalDate] = useState("");
  const [category, setCategory] = useState<SubCategoryKey | null>(null);

  async function handleSubmit() {
    if (!name.trim()) return;
    await addSub.mutateAsync({
      name: name.trim(),
      amount: amount ? parseFloat(amount) : null,
      renewal_date: renewalDate || null,
      category: category ?? null,
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
              Nouvel abonnement
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
                placeholder="Netflix, Spotify, Prime..."
                placeholderTextColor={theme.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}
                >
                  Montant (€/mois)
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
                  placeholder="9.99"
                  placeholderTextColor={theme.textMuted}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}
                >
                  Renouvellement
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
                  placeholder="2026-07-01"
                  placeholderTextColor={theme.textMuted}
                  value={renewalDate}
                  onChangeText={setRenewalDate}
                />
              </View>
            </View>

            <View>
              <Text
                style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 10 }}
              >
                Catégorie
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {SUB_CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.key}
                    onPress={() => setCategory(c.key)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: category === c.key ? "#8B5CF6" : theme.borderStrong,
                      backgroundColor: category === c.key ? "#F5F3FF" : theme.bgSecondary,
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{c.emoji}</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "500",
                        color: category === c.key ? "#8B5CF6" : theme.text,
                      }}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

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
            <Text style={{ color: "#8B5CF6", fontSize: 13, fontWeight: "500" }}>
              +5 XP à l&apos;ajout
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!name.trim() || addSub.isPending}
            activeOpacity={0.8}
            style={{
              height: 56,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: name.trim() ? "#8B5CF6" : theme.bgSecondary,
              marginTop: "auto",
            }}
          >
            {addSub.isPending ? (
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

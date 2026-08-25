import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "@/stores/appStore";
import { useTheme } from "@/stores/themeStore";

export default function CoupleSetupScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { createCouple, joinCouple, signOut, profile } = useAppStore();

  const [mode, setMode] = useState<"choice" | "create" | "join">("choice");
  const [code, setCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      const newCode = await createCouple();
      setGeneratedCode(newCode);
    } catch (e: any) {
      Alert.alert("Erreur", e.message ?? "Impossible de créer le couple");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (code.length < 4) return;
    setLoading(true);
    try {
      await joinCouple(code);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      Alert.alert("Erreur", e.message ?? "Code invalide");
    } finally {
      setLoading(false);
    }
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
          justifyContent: "center",
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 24,
              backgroundColor: "#FF6B9D",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 28 }}>💑</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: "600", color: theme.text, textAlign: "center" }}>
            Salut {profile?.full_name} !
          </Text>
          <Text style={{ color: theme.textSecondary, marginTop: 8, textAlign: "center" }}>
            Connectez-vous avec votre partenaire pour commencer
          </Text>
        </View>

        {/* Choix initial */}
        {mode === "choice" && (
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={() => setMode("create")}
              activeOpacity={0.8}
              style={{
                height: 56,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#FF6B9D",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
                Créer un nouveau couple
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode("join")}
              activeOpacity={0.8}
              style={{
                height: 56,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.bgSecondary,
                borderWidth: 1,
                borderColor: theme.borderStrong,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: theme.text }}>
                Rejoindre avec un code
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Créer un couple */}
        {mode === "create" && (
          <View style={{ gap: 16, alignItems: "center" }}>
            {!generatedCode ? (
              <>
                <Text style={{ color: theme.textSecondary, textAlign: "center", marginBottom: 8 }}>
                  On va générer un code unique à partager avec votre partenaire.
                </Text>
                <TouchableOpacity
                  onPress={handleCreate}
                  disabled={loading}
                  activeOpacity={0.8}
                  style={{
                    height: 56,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#FF6B9D",
                    width: "100%",
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
                      Générer le code
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={{ color: theme.textSecondary, textAlign: "center" }}>
                  Partagez ce code avec votre partenaire :
                </Text>
                <View
                  style={{
                    backgroundColor: theme.brandLight,
                    borderRadius: 16,
                    paddingVertical: 24,
                    paddingHorizontal: 32,
                    width: "100%",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ fontSize: 32, fontWeight: "700", color: "#FF6B9D", letterSpacing: 4 }}
                  >
                    {generatedCode}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.replace("/(tabs)/home")}
                  activeOpacity={0.8}
                  style={{
                    height: 56,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#FF6B9D",
                    width: "100%",
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>Continuer</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity onPress={() => setMode("choice")} style={{ marginTop: 8 }}>
              <Text style={{ color: theme.textSecondary }}>Retour</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Rejoindre un couple */}
        {mode === "join" && (
          <View style={{ gap: 16 }}>
            <Text style={{ color: theme.textSecondary, textAlign: "center", marginBottom: 8 }}>
              Entrez le code partagé par votre partenaire :
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.bgSecondary,
                borderWidth: 1,
                borderColor: theme.borderStrong,
                borderRadius: 16,
                paddingHorizontal: 16,
                height: 56,
                color: theme.text,
                fontSize: 20,
                fontWeight: "600",
                textAlign: "center",
                letterSpacing: 4,
              }}
              placeholder="CODE123"
              placeholderTextColor={theme.textMuted}
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              autoCapitalize="characters"
              maxLength={8}
            />
            <TouchableOpacity
              onPress={handleJoin}
              disabled={loading || code.length < 4}
              activeOpacity={0.8}
              style={{
                height: 56,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: code.length >= 4 ? "#FF6B9D" : theme.bgSecondary,
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: code.length >= 4 ? "white" : theme.textMuted,
                  }}
                >
                  Rejoindre
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode("choice")} style={{ alignItems: "center" }}>
              <Text style={{ color: theme.textSecondary }}>Retour</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Déconnexion */}
        <TouchableOpacity
          onPress={() => {
            signOut();
            router.replace("/(auth)/sign-in");
          }}
          style={{ marginTop: 32, alignItems: "center" }}
        >
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

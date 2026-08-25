import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "@/stores/appStore";
import { useTheme } from "@/stores/themeStore";

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const signUp = useAppStore((s) => s.signUp);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = fullName && email && password.length >= 6;

  async function handleSignUp() {
    if (!isValid) return;
    setLoading(true);
    try {
      await signUp(email.trim(), password, fullName.trim());
    } catch (e: any) {
      Alert.alert("Erreur", e.message ?? "Inscription impossible");
    } finally {
      setLoading(false);
    }
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
            <Text style={{ fontSize: 28, fontWeight: "600", color: theme.text }}>
              Créer un compte
            </Text>
            <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
              Rejoignez Bundly avec votre partenaire
            </Text>
          </View>

          {/* Champs */}
          <View style={{ gap: 12, marginBottom: 24 }}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}>
                Prénom
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
                }}
                placeholder="Votre prénom"
                placeholderTextColor={theme.textMuted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}>
                Email
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
                }}
                placeholder="vous@exemple.fr"
                placeholderTextColor={theme.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text, marginBottom: 6 }}>
                Mot de passe
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
                }}
                placeholder="6 caractères minimum"
                placeholderTextColor={theme.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* Bouton */}
          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading || !isValid}
            activeOpacity={0.8}
            style={{
              height: 56,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              backgroundColor: isValid ? "#FF6B9D" : theme.bgSecondary,
            }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: isValid ? "white" : theme.textMuted,
                }}
              >
                Créer mon compte
              </Text>
            )}
          </TouchableOpacity>

          {/* Lien connexion */}
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={{ alignItems: "center" }}
          >
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
              Déjà un compte ?{" "}
              <Text style={{ fontWeight: "600", color: "#FF6B9D" }}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

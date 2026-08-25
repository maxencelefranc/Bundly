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
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "@/stores/appStore";
import { useTheme } from "@/stores/themeStore";

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const signIn = useAppStore((s) => s.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) return;
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/(auth)/couple-setup");
    } catch (e: any) {
      Alert.alert("Erreur", e.message ?? "Connexion impossible");
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
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View style={{ alignItems: "center", marginBottom: 48 }}>
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
          <Text style={{ fontSize: 28, fontWeight: "600", color: theme.text }}>Bundly</Text>
          <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
            Connectez-vous à votre compte
          </Text>
        </View>

        <View style={{ gap: 12, marginBottom: 24 }}>
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
              placeholder="••••••••"
              placeholderTextColor={theme.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSignIn}
          disabled={loading || !email || !password}
          style={{
            height: 56,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            backgroundColor: email && password ? "#FF6B9D" : theme.bgSecondary,
          }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: email && password ? "white" : theme.textMuted,
              }}
            >
              Se connecter
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(auth)/sign-up")}
          style={{ alignItems: "center" }}
        >
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
            Pas encore de compte ?{" "}
            <Text style={{ fontWeight: "600", color: "#FF6B9D" }}>S&apos;inscrire</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

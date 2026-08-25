import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAppStore } from "@/stores/appStore";
import { useTheme, useThemeStore } from "@/stores/themeStore";
import { COUPLE_LEVELS } from "@/types";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { profile, partner, couple, coupleXP, signOut } = useAppStore();
  const { isDark, toggle } = useThemeStore();

  const currentLevel = COUPLE_LEVELS.find((l) => l.level === coupleXP?.level) ?? COUPLE_LEVELS[0];

  function handleSignOut() {
    Alert.alert("Se déconnecter", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnecter",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  }

  const stats = [
    {
      label: "XP total",
      value: `${coupleXP?.total_xp ?? 0}`,
      icon: "flash-outline",
      color: theme.brand,
    },
    { label: "Niveau", value: `${coupleXP?.level ?? 1}`, icon: "trophy-outline", color: "#F59E0B" },
    {
      label: "Streak",
      value: `${coupleXP?.streak_days ?? 0}j`,
      icon: "flame-outline",
      color: "#EF4444",
    },
    {
      label: "Cette sem.",
      value: `${coupleXP?.weekly_xp ?? 0}`,
      icon: "trending-up-outline",
      color: "#22C55E",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient
          colors={[theme.gradientStart, theme.gradientMiddle, theme.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: 20,
            paddingBottom: 32,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: "rgba(255,142,83,0.3)",
              top: -60,
              right: -50,
            }}
          />

          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginBottom: 16 }}>
            Votre couple
          </Text>

          {/* Avatars couple */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <View style={{ alignItems: "center", gap: 6 }}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 20,
                  backgroundColor: "rgba(255,255,255,0.25)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1.5,
                  borderColor: "rgba(255,255,255,0.3)",
                }}
              >
                <Ionicons name="person-outline" size={26} color="white" />
              </View>
              <Text style={{ color: "white", fontSize: 12, fontWeight: "500" }} numberOfLines={1}>
                {profile?.full_name ?? "Moi"}
              </Text>
            </View>

            <View style={{ flex: 1, alignItems: "center" }}>
              <Ionicons name="heart" size={24} color="rgba(255,255,255,0.6)" />
            </View>

            <View style={{ alignItems: "center", gap: 6 }}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 20,
                  backgroundColor: "rgba(255,255,255,0.25)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1.5,
                  borderColor: "rgba(255,255,255,0.3)",
                }}
              >
                <Ionicons name="person-outline" size={26} color="white" />
              </View>
              <Text style={{ color: "white", fontSize: 12, fontWeight: "500" }} numberOfLines={1}>
                {partner?.full_name ?? "En attente..."}
              </Text>
            </View>
          </View>

          {/* Niveau */}
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 14,
              padding: 12,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderWidth: 0.5,
              borderColor: "rgba(255,255,255,0.2)",
            }}
          >
            <View>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginBottom: 2 }}>
                Niveau actuel
              </Text>
              <Text style={{ color: "white", fontSize: 17, fontWeight: "600" }}>
                {coupleXP?.level ?? 1} — {coupleXP?.level_name ?? "Novices"}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.25)",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>
                +{coupleXP?.xp_to_next ?? 500} XP →
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{ padding: 16, gap: 14 }}>
          {/* Stats */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            {stats.map((s) => (
              <View
                key={s.label}
                style={{
                  flex: 1,
                  backgroundColor: theme.bgCard,
                  borderRadius: 16,
                  padding: 12,
                  alignItems: "center",
                  borderWidth: 0.5,
                  borderColor: theme.border,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 6,
                  elevation: 1,
                }}
              >
                <Ionicons
                  name={s.icon as any}
                  size={20}
                  color={s.color}
                  style={{ marginBottom: 4 }}
                />
                <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>
                  {s.value}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: theme.textSecondary,
                    textAlign: "center",
                    marginTop: 2,
                  }}
                >
                  {s.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Code couple */}
          {couple?.invite_code && !partner && (
            <View
              style={{
                backgroundColor: theme.bgCard,
                borderRadius: 16,
                padding: 16,
                borderWidth: 0.5,
                borderColor: theme.cardBorder,
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: theme.text, marginBottom: 12 }}
              >
                Invitez votre partenaire
              </Text>
              <View
                style={{
                  backgroundColor: theme.brandLight,
                  borderRadius: 12,
                  padding: 14,
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{ fontSize: 28, fontWeight: "700", color: theme.brand, letterSpacing: 4 }}
                >
                  {couple.invite_code}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: "center" }}>
                Partagez ce code avec votre partenaire
              </Text>
            </View>
          )}

          {/* Niveaux */}
          <View
            style={{
              backgroundColor: theme.bgCard,
              borderRadius: 16,
              padding: 16,
              borderWidth: 0.5,
              borderColor: theme.border,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: theme.text, marginBottom: 14 }}>
              Progression des niveaux
            </Text>
            {COUPLE_LEVELS.map((lvl) => {
              const isReached = (coupleXP?.level ?? 0) >= lvl.level;
              const isCurrent = coupleXP?.level === lvl.level;
              return (
                <View
                  key={lvl.level}
                  style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 11,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isReached ? lvl.color : theme.bgSecondary,
                    }}
                  >
                    {isReached && !isCurrent ? (
                      <Ionicons name="checkmark" size={18} color="white" />
                    ) : (
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: isReached ? "white" : theme.textMuted,
                        }}
                      >
                        {lvl.level}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "500",
                        color: isReached ? theme.text : theme.textMuted,
                      }}
                    >
                      {lvl.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textSecondary }}>{lvl.min} XP</Text>
                  </View>
                  {isCurrent && (
                    <View
                      style={{
                        backgroundColor: theme.brandLight,
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: theme.brand, fontWeight: "500" }}>
                        En cours
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Thème */}
          <TouchableOpacity
            onPress={toggle}
            activeOpacity={0.8}
            style={{
              backgroundColor: theme.bgCard,
              borderRadius: 16,
              padding: 16,
              borderWidth: 0.5,
              borderColor: theme.border,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                backgroundColor: isDark ? theme.bgSecondary : theme.brandLight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={isDark ? "moon-outline" : "sunny-outline"}
                size={20}
                color={isDark ? "#A78BFA" : theme.brand}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text }}>
                {isDark ? "Mode sombre" : "Mode clair"}
              </Text>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>Appuie pour changer</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Déconnexion */}
          <TouchableOpacity
            onPress={handleSignOut}
            activeOpacity={0.8}
            style={{
              backgroundColor: theme.bgCard,
              borderRadius: 16,
              padding: 16,
              borderWidth: 0.5,
              borderColor: "rgba(239,68,68,0.15)",
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                backgroundColor: "#FEF2F2",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </View>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: "500", color: "#EF4444" }}>
              Se déconnecter
            </Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
    </View>
  );
}

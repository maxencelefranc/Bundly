import { ScrollView, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "@/stores/appStore";
import { useTheme } from "@/stores/themeStore";
import { COUPLE_LEVELS } from "@/types";

export default function LevelsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { coupleXP } = useAppStore();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: "600", color: theme.text, marginBottom: 4 }}>
          Progression
        </Text>
        <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 24 }}>
          {coupleXP?.total_xp ?? 0} XP accumulés ensemble
        </Text>

        {/* Current level card */}
        <View
          style={{
            borderRadius: 20,
            padding: 20,
            marginBottom: 24,
            backgroundColor:
              COUPLE_LEVELS.find((l) => l.level === coupleXP?.level)?.color ?? theme.brand,
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 4 }}>
            Niveau actuel
          </Text>
          <Text style={{ color: "white", fontSize: 28, fontWeight: "600", marginBottom: 4 }}>
            {coupleXP?.level_name ?? "Novices"}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
            {coupleXP?.xp_to_next ?? 500} XP jusqu&apos;au prochain niveau
          </Text>
        </View>

        {/* All levels */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "500",
            color: theme.textSecondary,
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          Tous les niveaux
        </Text>
        <View style={{ gap: 12 }}>
          {COUPLE_LEVELS.map((lvl) => {
            const isReached = (coupleXP?.level ?? 0) >= lvl.level;
            const isCurrent = coupleXP?.level === lvl.level;
            return (
              <View
                key={lvl.level}
                style={{
                  backgroundColor: theme.bgCard,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: isCurrent ? theme.brand : theme.border,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isReached ? lvl.color : theme.bgSecondary,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: isReached ? "white" : theme.textMuted,
                    }}
                  >
                    {lvl.level}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontWeight: "500",
                      color: isReached ? theme.text : theme.textMuted,
                    }}
                  >
                    {lvl.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>{lvl.min} XP</Text>
                </View>
                {isCurrent && (
                  <View
                    style={{
                      backgroundColor: theme.brandLight,
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: theme.brand, fontWeight: "500" }}>
                      En cours
                    </Text>
                  </View>
                )}
                {isReached && !isCurrent && (
                  <Text style={{ color: "#22C55E", fontSize: 18 }}>✓</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

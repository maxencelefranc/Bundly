import { View, Text, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "@/components/shared/ScreenLayout";
import { useTheme } from "@/stores/themeStore";
import { useEmotions } from "@/features/emotions/hooks";
import { EMOTIONS } from "@/features/emotions/api";
import type { Emotion } from "@/features/emotions/api";

const MOOD_CONFIG = [
  { max: 3, label: "Difficile", color: "#EF4444", bg: "#FEF2F2" },
  { max: 6, label: "Moyen", color: "#F59E0B", bg: "#FFFBEB" },
  { max: 8, label: "Bien", color: "#22C55E", bg: "#F0FDF4" },
  { max: 10, label: "Excellent", color: "#FF6B9D", bg: "#FFF5F8" },
];

function getMoodConfig(mood: number) {
  return MOOD_CONFIG.find((m) => mood <= m.max) ?? MOOD_CONFIG[3];
}

function EmotionCard({ emotion }: { emotion: Emotion }) {
  const theme = useTheme();
  const config = EMOTIONS.find((e) => e.key === emotion.emotion);
  const mood = getMoodConfig(emotion.mood);
  const date = new Date(emotion.created_at);

  return (
    <View
      style={{
        backgroundColor: theme.bgCard,
        borderRadius: 16,
        padding: 14,
        marginBottom: 8,
        borderWidth: 0.5,
        borderColor: theme.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: "#F5F3FF",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 22 }}>{config?.emoji ?? "💜"}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "500", color: theme.text }}>
          {config?.label ?? emotion.emotion}
        </Text>
        <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
          {date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} ·{" "}
          {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </Text>
        {emotion.context && (
          <Text
            style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}
            numberOfLines={1}
          >
            {emotion.context}
          </Text>
        )}
      </View>
      <View
        style={{
          backgroundColor: mood.bg,
          borderRadius: 10,
          paddingHorizontal: 10,
          paddingVertical: 5,
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "700", color: mood.color }}>{emotion.mood}</Text>
        <Text style={{ fontSize: 9, color: mood.color, fontWeight: "500" }}>{mood.label}</Text>
      </View>
    </View>
  );
}

export default function EmotionsScreen() {
  const theme = useTheme();
  const { data: emotions, isLoading } = useEmotions();

  return (
    <ScreenLayout
      title="Émotions"
      subtitle={`${emotions?.length ?? 0} entrées`}
      color="#A78BFA"
      icon="heart-outline"
      onAdd={() => router.push("/(modals)/add-emotion")}
    >
      {isLoading ? (
        <ActivityIndicator color="#A78BFA" style={{ marginTop: 40 }} />
      ) : emotions?.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: "#F5F3FF",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Ionicons name="heart-outline" size={32} color="#A78BFA" />
          </View>
          <Text style={{ fontSize: 16, fontWeight: "600", color: theme.text, marginBottom: 4 }}>
            Aucune émotion
          </Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary }}>
            Notez comment vous vous sentez
          </Text>
        </View>
      ) : (
        emotions?.map((e) => <EmotionCard key={e.id} emotion={e} />)
      )}
    </ScreenLayout>
  );
}

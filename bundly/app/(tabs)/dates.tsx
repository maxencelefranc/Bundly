import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "@/components/shared/ScreenLayout";
import { useTheme } from "@/stores/themeStore";
import { useDates, useDeleteDate } from "@/features/dates/hooks";
import { daysUntil, type ImportantDate } from "@/features/dates/api";

function DateCard({ item }: { item: ImportantDate }) {
  const theme = useTheme();
  const remove = useDeleteDate();
  const days = daysUntil(item.date, item.recurring);
  const isToday = days === 0;
  const isSoon = days > 0 && days <= 7;

  return (
    <View
      style={{
        backgroundColor: theme.bgCard,
        borderRadius: 16,
        padding: 14,
        marginBottom: 8,
        borderWidth: 0.5,
        borderColor: isToday ? "rgba(249,115,22,0.3)" : theme.border,
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
          width: 48,
          alignItems: "center",
          backgroundColor: isToday ? "#FFF7ED" : theme.bgSecondary,
          borderRadius: 12,
          padding: 8,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: isToday ? "#F97316" : theme.textMuted,
            lineHeight: 22,
          }}
        >
          {new Date(item.date).getDate()}
        </Text>
        <Text
          style={{ fontSize: 10, color: isToday ? "#F97316" : theme.textMuted, fontWeight: "500" }}
        >
          {new Date(item.date).toLocaleDateString("fr-FR", { month: "short" })}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "500", color: theme.text }}>{item.title}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
          {item.recurring && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Ionicons name="repeat-outline" size={11} color={theme.textSecondary} />
              <Text style={{ fontSize: 11, color: theme.textSecondary }}>Annuel</Text>
            </View>
          )}
        </View>
      </View>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <View
          style={{
            backgroundColor: isToday ? "#F97316" : isSoon ? "#FFF7ED" : theme.bgSecondary,
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: isToday ? "white" : isSoon ? "#F97316" : theme.textMuted,
            }}
          >
            {isToday ? "Auj. !" : days < 0 ? `${Math.abs(days)}j` : `${days}j`}
          </Text>
        </View>
        <TouchableOpacity onPress={() => remove.mutate(item.id)} activeOpacity={0.6}>
          <Ionicons name="close" size={16} color={theme.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DatesScreen() {
  const theme = useTheme();
  const { data: dates, isLoading } = useDates();
  const sorted = [...(dates ?? [])].sort(
    (a, b) => daysUntil(a.date, a.recurring) - daysUntil(b.date, b.recurring)
  );

  return (
    <ScreenLayout
      title="Dates importantes"
      subtitle={`${dates?.length ?? 0} dates`}
      color="#F97316"
      icon="gift-outline"
      onAdd={() => router.push("/(modals)/add-date")}
    >
      {isLoading ? (
        <ActivityIndicator color="#F97316" style={{ marginTop: 40 }} />
      ) : dates?.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: "#FFF7ED",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Ionicons name="gift-outline" size={32} color="#F97316" />
          </View>
          <Text style={{ fontSize: 16, fontWeight: "600", color: theme.text, marginBottom: 4 }}>
            Aucune date
          </Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary }}>
            Ajoutez vos anniversaires et événements
          </Text>
        </View>
      ) : (
        sorted.map((d) => <DateCard key={d.id} item={d} />)
      )}
    </ScreenLayout>
  );
}

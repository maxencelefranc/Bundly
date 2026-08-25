import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "@/components/shared/ScreenLayout";
import { MonthCalendar, dateKey, type CalendarMarker } from "@/components/shared/MonthCalendar";
import { useTheme } from "@/stores/themeStore";
import { useSubscriptions, useDeleteSubscription } from "@/features/subscriptions/hooks";
import {
  SUB_CATEGORIES,
  daysUntilRenewal,
  totalMonthly,
  type Subscription,
} from "@/features/subscriptions/api";

function SubCard({ sub }: { sub: Subscription }) {
  const theme = useTheme();
  const remove = useDeleteSubscription();
  const days = daysUntilRenewal(sub.renewal_date);
  const category = SUB_CATEGORIES.find((c) => c.key === sub.category);

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
        <Text style={{ fontSize: 22 }}>{category?.emoji ?? "📦"}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "500", color: theme.text }}>{sub.name}</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 3 }}>
          {sub.amount && (
            <Text style={{ fontSize: 12, color: theme.textSecondary }}>{sub.amount}€/mois</Text>
          )}
          {days !== null && (
            <Text style={{ fontSize: 12, color: days <= 7 ? "#F59E0B" : theme.textSecondary }}>
              Renouvellement {days <= 0 ? "aujourd'hui" : `dans ${days}j`}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={() => remove.mutate(sub.id)} activeOpacity={0.6}>
        <Ionicons name="close" size={18} color={theme.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

export default function SubsScreen() {
  const theme = useTheme();
  const { data: subs, isLoading } = useSubscriptions();
  const total = totalMonthly(subs ?? []);
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const markersByDate = useMemo(() => {
    const map: Record<string, CalendarMarker[]> = {};
    for (const s of subs ?? []) {
      if (!s.renewal_date) continue;
      const [y, m, d] = s.renewal_date.split("-").map(Number);
      (map[dateKey(y, m, d)] ??= []).push({ color: "#8B5CF6" });
    }
    return map;
  }, [subs]);

  const visible = selectedDate
    ? (subs ?? []).filter((s) => s.renewal_date?.slice(0, 10) === selectedDate)
    : (subs ?? []);

  return (
    <ScreenLayout
      title="Abonnements"
      subtitle={`${subs?.length ?? 0} abonnements · ${total.toFixed(2)}€/mois`}
      color="#8B5CF6"
      icon="card-outline"
      onAdd={() => router.push("/(modals)/add-subscription")}
    >
      <View style={{ marginBottom: 16 }}>
        <MonthCalendar
          month={month}
          onMonthChange={setMonth}
          markersByDate={markersByDate}
          selectedDate={selectedDate}
          onSelectDate={(d) => setSelectedDate(d === selectedDate ? null : d)}
        />
      </View>

      {selectedDate && (
        <TouchableOpacity
          onPress={() => setSelectedDate(null)}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            alignSelf: "flex-start",
            backgroundColor: "#F5F3FF",
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 12, color: "#8B5CF6", fontWeight: "500" }}>
            {new Date(selectedDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
          </Text>
          <Ionicons name="close-circle" size={14} color="#8B5CF6" />
        </TouchableOpacity>
      )}

      {!selectedDate && total > 0 && (
        <View
          style={{
            backgroundColor: theme.bgCard,
            borderRadius: 16,
            padding: 16,
            marginBottom: 14,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderWidth: 0.5,
            borderColor: "rgba(139,92,246,0.15)",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "500", color: theme.text }}>Total mensuel</Text>
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#8B5CF6" }}>
            {total.toFixed(2)}€
          </Text>
        </View>
      )}
      {isLoading ? (
        <ActivityIndicator color="#8B5CF6" style={{ marginTop: 40 }} />
      ) : visible.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <Text style={{ fontSize: 14, color: theme.textSecondary }}>
            {selectedDate ? "Aucun renouvellement ce jour-là" : "Suivez vos dépenses récurrentes"}
          </Text>
        </View>
      ) : (
        visible.map((s) => <SubCard key={s.id} sub={s} />)
      )}
    </ScreenLayout>
  );
}

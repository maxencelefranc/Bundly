import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenLayout } from "@/components/shared/ScreenLayout";
import { MonthCalendar, dateKey, type CalendarMarker } from "@/components/shared/MonthCalendar";
import { useTheme } from "@/stores/themeStore";
import { useFoodItems, useMarkConsumed, useDeleteFoodItem } from "@/features/anti-waste/hooks";
import { computeStatus, type FoodItem } from "@/features/anti-waste/api";

const STATUS_CONFIG = {
  ok: { color: "#22C55E", bg: "#F0FDF4", label: "OK", icon: "checkmark-circle-outline" },
  warning: { color: "#F59E0B", bg: "#FFFBEB", label: "Bientôt", icon: "warning-outline" },
  expired: { color: "#EF4444", bg: "#FEF2F2", label: "Expiré", icon: "close-circle-outline" },
  consumed: { color: "#94A3B8", bg: "#F8FAFC", label: "Consommé", icon: "checkmark-outline" },
};

function FoodCard({ item }: { item: FoodItem }) {
  const theme = useTheme();
  const consume = useMarkConsumed();
  const remove = useDeleteFoodItem();
  const status = computeStatus(item.expiry_date);
  const cfg = STATUS_CONFIG[status];

  const daysLeft = item.expiry_date
    ? Math.floor(
        (new Date(item.expiry_date).getTime() - new Date().setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <View
      style={{
        backgroundColor: theme.bgCard,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 0.5,
        borderColor:
          status === "warning"
            ? "rgba(245,158,11,0.2)"
            : status === "expired"
              ? "rgba(239,68,68,0.2)"
              : theme.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: status !== "expired" ? 10 : 0,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: cfg.bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "500", color: theme.text }}>{item.name}</Text>
          <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
            {item.storage_location ?? ""}
            {daysLeft !== null
              ? ` · ${daysLeft < 0 ? `Expiré depuis ${Math.abs(daysLeft)}j` : daysLeft === 0 ? "Expire aujourd'hui" : `${daysLeft}j restants`}`
              : ""}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: cfg.bg,
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "600", color: cfg.color }}>{cfg.label}</Text>
        </View>
        <TouchableOpacity onPress={() => remove.mutate(item.id)} activeOpacity={0.6}>
          <Ionicons name="close" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </View>
      {status !== "expired" && (
        <TouchableOpacity
          onPress={() => consume.mutate({ id: item.id, name: item.name })}
          activeOpacity={0.8}
          style={{
            height: 40,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: cfg.bg,
            borderWidth: 0.5,
            borderColor: `${cfg.color}30`,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: cfg.color }}>
            Marquer consommé · +10 XP
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function AntiWasteScreen() {
  const theme = useTheme();
  const { data: items, isLoading } = useFoodItems();
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const markersByDate = useMemo(() => {
    const map: Record<string, CalendarMarker[]> = {};
    for (const item of items ?? []) {
      if (!item.expiry_date) continue;
      const [y, m, d] = item.expiry_date.split("-").map(Number);
      (map[dateKey(y, m, d)] ??= []).push({
        color: STATUS_CONFIG[computeStatus(item.expiry_date)].color,
      });
    }
    return map;
  }, [items]);

  const base = selectedDate
    ? (items ?? []).filter((i) => i.expiry_date?.slice(0, 10) === selectedDate)
    : (items ?? []);
  const expired = base.filter((i) => computeStatus(i.expiry_date) === "expired");
  const warning = base.filter((i) => computeStatus(i.expiry_date) === "warning");
  const ok = base.filter((i) => computeStatus(i.expiry_date) === "ok");

  return (
    <ScreenLayout
      title="Anti-gaspillage"
      subtitle={`${(items ?? []).filter((i) => computeStatus(i.expiry_date) === "expired").length > 0 ? `${(items ?? []).filter((i) => computeStatus(i.expiry_date) === "expired").length} expiré · ` : ""}${(items ?? []).length} suivis`}
      color="#EF4444"
      icon="leaf-outline"
      onAdd={() => router.push("/(modals)/add-food")}
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
            backgroundColor: "#FEF2F2",
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 12, color: "#EF4444", fontWeight: "500" }}>
            {new Date(selectedDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
          </Text>
          <Ionicons name="close-circle" size={14} color="#EF4444" />
        </TouchableOpacity>
      )}

      {isLoading ? (
        <ActivityIndicator color="#EF4444" style={{ marginTop: 40 }} />
      ) : base.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 40 }}>
          <Text style={{ fontSize: 14, color: theme.textSecondary }}>
            {selectedDate
              ? "Rien n'expire ce jour-là"
              : "Ajoutez vos aliments pour éviter le gaspillage"}
          </Text>
        </View>
      ) : (
        <>
          {[...expired, ...warning, ...ok].map((i) => (
            <FoodCard key={i.id} item={i} />
          ))}
        </>
      )}
    </ScreenLayout>
  );
}
